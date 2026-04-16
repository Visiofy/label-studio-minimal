import { types, isAlive } from "mobx-state-tree";

import BaseTool, { DEFAULT_DIMENSIONS } from "./Base";
import ToolMixin from "../mixins/Tool";
import { ThreePointsDrawingTool, TwoPointsDrawingTool } from "../mixins/DrawingTool";
import { AnnotationMixin } from "../mixins/AnnotationMixin";
import { NodeViews } from "../components/Node/Node";
import { FF_DEV_3793, isFF } from "../utils/feature-flags";
import { findClosestParent } from "../utils/utilities";

const _BaseNPointTool = types
  .model("BaseNTool", {
    group: "segmentation",
    smart: false, // Rectangle NON usa SAM
    shortcut: "R",
  })
  .views((self) => {
    const Super = {
      createRegionOptions: self.createRegionOptions,
      isIncorrectControl: self.isIncorrectControl,
      isIncorrectLabel: self.isIncorrectLabel,
    };

    return {
      get getActivePolygon() {
        const poly = self.currentArea;

        if (poly && poly.closed) return null;
        if (poly === undefined) return null;
        if (poly && poly.type !== "rectangleregion") return null;

        return poly;
      },

      get tagTypes() {
        return {
          stateTypes: "rectanglelabels",
          controlTagTypes: ["rectanglelabels", "rectangle"],
        };
      },
      get defaultDimensions() {
        return DEFAULT_DIMENSIONS.rect;
      },
      createRegionOptions({ x, y }) {
        return Super.createRegionOptions({
          x,
          y,
          height: isFF(FF_DEV_3793) ? self.obj.canvasToInternalY(1) : 1,
          width: isFF(FF_DEV_3793) ? self.obj.canvasToInternalX(1) : 1,
        });
      },

      isIncorrectControl() {
        return Super.isIncorrectControl() && self.current() === null;
      },
      isIncorrectLabel() {
        return !self.current() && Super.isIncorrectLabel();
      },
      canStart() {
        return self.current() === null && !self.annotation.isReadOnly();
      },

      current() {
        return self.getActivePolygon;
      },
    };
  })
  .actions((self) => {
    const Super = {
      mousedownEv: self.mousedownEv,
    };

    return {
      /**
       * Find if there's a region at the given coordinates
       * Similar to Brush.findRegionAtCoordinates but simpler for Rectangle
       */
      findRegionAtCoordinates(internalX, internalY, canvasX, canvasY) {
        try {
          const regions = self.annotation?.regionStore?.regions;
          if (!regions || regions.length === 0) return null;

          const pointInBBox = (bbox, px, py) => {
            if (!bbox) return false;
            if (!Number.isFinite(px) || !Number.isFinite(py)) return false;
            return px >= bbox.left && px <= bbox.right && py >= bbox.top && py <= bbox.bottom;
          };

          for (const region of regions) {
            if (!region || !isAlive(region)) continue;
            // Skip rectangle regions to allow editing them
            if (region.type === "rectangleregion") continue;
            if (self.obj.multiImage && region.item_index !== self.obj.currentImage) continue;

            const hasCanvasHit = pointInBBox(region.bboxCoordsCanvas, canvasX, canvasY);
            if (hasCanvasHit) {
              console.log('[Rectangle] Found region via canvas bbox at coords:', { region: region.id, type: region.type });
              return region;
            }

            const hasInternalHit = pointInBBox(region.bboxCoords, internalX, internalY);
            if (hasInternalHit) {
              console.log('[Rectangle] Found region via internal bbox at coords:', { region: region.id, type: region.type });
              return region;
            }
          }

          return null;
        } catch (error) {
          console.warn('[Rectangle] Error checking regions at coordinates:', error);
          return null;
        }
      },

      /**
       * Override mousedownEv to check for existing regions
       * If clicking on an existing region, delegate to region click handler
       * Otherwise, proceed with normal drawing
       */
      mousedownEv(ev, [internalX, internalY], [x, y]) {
        if (!self.isAllowedInteraction(ev)) return;

        // Clear tool switching flag if set
        if (self.obj && self.obj._toolSwitchingInProgress) {
          console.log("[Rectangle] Tool switching in progress flag detected, clearing and continuing");
          self.obj._toolSwitchingInProgress = false;
        }

        const inside = findClosestParent(
          ev.target,
          (el) => el === self.obj.stageRef.content,
          (el) => el.parentElement
        );
        if (!inside) return;

        // Check if there are any regions at these coordinates
        const regionAtPointer = self.findRegionAtCoordinates(internalX, internalY, x, y);

        console.log('[Rectangle] mousedownEv - click analysis:', {
          x, y,
          hasRegionAtCoords: Boolean(regionAtPointer),
          clickedOnCanvas: ev.target?.tagName === 'CANVAS'
        });

        if (regionAtPointer) {
          console.log('[Rectangle] ✅ Detected region at coordinates, delegating to region click handler');

          // Mark event as delegated
          const markDelegated = (eventLike) => {
            if (!eventLike || typeof eventLike !== 'object') return;
            eventLike.__lsfRectangleDelegated = true;
            eventLike.__lsfRectangleDelegatedTarget = regionAtPointer?.id;
          };

          // Stop the original event from bubbling
          const stopOriginalEvent = (eventLike) => {
            if (!eventLike) return;
            if (typeof eventLike.cancelBubble !== "undefined") eventLike.cancelBubble = true;
            if (typeof eventLike.stopPropagation === "function") eventLike.stopPropagation();
            if (typeof eventLike.preventDefault === "function") eventLike.preventDefault();
          };

          markDelegated(ev);
          markDelegated(ev?.evt);
          stopOriginalEvent(ev);
          stopOriginalEvent(ev?.evt);

          // Create synthetic event for region click handler
          const syntheticEvent = {
            evt: ev?.evt || ev,
            detail: ev?.detail ?? ev?.evt?.detail ?? 1,
            cancelBubble: true,
            stopPropagation: () => {},
            preventDefault: () => {},
            __lsfSynthetic: true,
          };

          if (typeof regionAtPointer.onClickRegion === 'function') {
            regionAtPointer.onClickRegion(syntheticEvent);
          } else if (regionAtPointer.annotation) {
            // Fallback: at least select the region
            regionAtPointer.annotation.selectArea(regionAtPointer);
          }

          return;
        }

        console.log('[Rectangle] ❌ No region at coordinates, proceeding with drawing');

        // Check if a label is selected before drawing
        if (self.control && !self.control.isSelected) {
          console.log('[Rectangle] ❌ No label selected, cannot create region');
          if (window.showLabelingWarning) {
            window.showLabelingWarning('Seleziona una label prima di disegnare! Premi un tasto numerico (1-9) oppure clicca direttamente sul menù per selezionare una label.');
          }
          return;
        }

        // No region at coordinates, proceed with normal drawing
        // NOTE: TwoPointsDrawingTool expects internal coordinates only
        return Super.mousedownEv(ev, [internalX, internalY]);
      },

      beforeCommitDrawing() {
        const s = self.getActiveShape;
        
        return s.width > self.MIN_SIZE.X && s.height * self.MIN_SIZE.Y;
      },
    };
  });

const _Tool = types
  .model("RectangleTool", {
    shortcut: "R",
  })
  .views((self) => ({
    get viewTooltip() {
      return "Rectangle";
    },
    get iconComponent() {
      return self.dynamic ? NodeViews.RectRegionModel.altIcon : NodeViews.RectRegionModel.icon;
    },
  }));

const _Tool3Point = types
  .model("Rectangle3PointTool", {
    shortcut: "shift+R",
  })
  .views((self) => ({
    get viewTooltip() {
      return "3 Point Rectangle";
    },
    get iconComponent() {
      return self.dynamic ? NodeViews.Rect3PointRegionModel.altIcon : NodeViews.Rect3PointRegionModel.icon;
    },
  }));

const Rect = types.compose(
  _Tool.name,
  ToolMixin,
  BaseTool,
  TwoPointsDrawingTool,
  _BaseNPointTool,
  _Tool,
  AnnotationMixin,
);

const Rect3Point = types.compose(
  _Tool3Point.name,
  ToolMixin,
  BaseTool,
  ThreePointsDrawingTool,
  _BaseNPointTool,
  _Tool3Point,
  AnnotationMixin,
);

export { Rect, Rect3Point };
