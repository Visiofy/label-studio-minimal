// brush.jsx
import { observer } from "mobx-react";
import { types, isAlive, reaction } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import Canvas from "../utils/canvas";
import { clamp, findClosestParent } from "../utils/utilities";
import { DrawingTool } from "../mixins/DrawingTool";
import { Tool } from "../components/Toolbar/Tool";
import { Range } from "../common/Range/Range";
import { NodeViews } from "../components/Node/Node";

const MIN_SIZE = 1;
const MAX_SIZE = 50;

const IconDot = ({ size }) => (
  <span
    style={{
      display: "block",
      width: size,
      height: size,
      background: "rgba(0, 0, 0, 0.25)",
      borderRadius: "100%",
    }}
  />
);

const ToolView = observer(({ item }) => (
  <Tool
    label="Brush"
    ariaLabel="brush-tool"
    active={item.selected}
    shortcut={item.shortcut}
    extraShortcuts={item.extraShortcuts}
    icon={item.iconClass}
    tool={item}
    onClick={() => {
      if (item.selected) return;
      item.manager.selectTool(item, true);
    }}
    controls={item.controls}
  />
));

/* -------------------------------------------------------------- */
/*  BrushTool – modello                                           */
/* -------------------------------------------------------------- */
const _Tool = types
  .model("BrushTool", {
    strokeWidth: types.optional(types.number, 15),
    group: "segmentation",
    shortcut: "B",
    smart: true,
    unselectRegionOnToolChange: false,
  })
  .volatile(() => ({
    canInteractWithRegions: false,
  }))
  .views((self) => ({
    get viewClass() {
      return () => <ToolView item={self} />;
    },
    get iconComponent() {
      return self.dynamic
        ? NodeViews.BrushRegionModel.altIcon
        : NodeViews.BrushRegionModel.icon;
    },
    get tagTypes() {
      return {
        stateTypes: "brushlabels",
        controlTagTypes: ["brushlabels", "brush"],
      };
    },
    get controls() {
      return [
        <Range
          key="brush-size"
          value={self.strokeWidth}
          min={MIN_SIZE}
          max={MAX_SIZE}
          reverse
          align="vertical"
          minIcon={<IconDot size={8} />}
          maxIcon={<IconDot size={16} />}
          onChange={(value) => self.setStroke(value)}
        />,
      ];
    },
    get extraShortcuts() {
      return {
        "[": [
          "Decrease size",
          () => self.setStroke(clamp(self.strokeWidth - 5, MIN_SIZE, MAX_SIZE)),
        ],
        "]": [
          "Increase size",
          () => self.setStroke(clamp(self.strokeWidth + 5, MIN_SIZE, MAX_SIZE)),
        ],
      };
    },
  }))
  .actions((self) => ({
    /* ---------------------------------------------------------- */
    /*  Commit finale – solo se la regione è viva                 */
    /* ---------------------------------------------------------- */
    commitDrawingRegion() {
      const { currentArea, control, obj } = self;
      if (!currentArea || !isAlive(currentArea)) return;
      

      const source = currentArea.toJSON();
      const value = {
        coordstype: "px",
        touches: source.touches,
        dynamic: source.dynamic,
      };

      // createResult applica *già* il label attivo -> niente .setValue!
      const newArea = self.annotation.createResult(
        value,
        currentArea.results[0].value.toJSON(),
        control,
        obj
      );

      currentArea.setDrawing(false);
      self.applyActiveStates(newArea);
      self.deleteRegion();          // elimina la temporanea
      newArea.notifyDrawingFinished();

      // Reset isNewAnnotation flag for ALL other regions before marking the new one
      if (newArea && newArea.annotation && newArea.annotation.regionStore) {
        const allRegions = newArea.annotation.regionStore.regions || [];
        allRegions.forEach(region => {
          if (region && region.id !== newArea.id && region.isNewAnnotation && region.setIsNewAnnotation) {
            region.setIsNewAnnotation(false);
            console.log('[Brush.commitDrawingRegion] Reset isNewAnnotation for region:', region.id);
          }
        });
      }

      // Mark as new annotation so label changes create new regions instead of modifying this one
      if (newArea && newArea.setIsNewAnnotation) {
        newArea.setIsNewAnnotation(true);
        console.log('[Brush.commitDrawingRegion] marked region as new annotation:', newArea.id);
      }

      return newArea;
    },

    setStroke(val) {
      self.strokeWidth = val;
      self.updateCursor();
    },

    afterUpdateSelected() {
      self.updateCursor();
    },

    /**
     * Return the first non-brush region hit by the given coordinates (internal or canvas)
     * so we can delegate the click to the region for selection/tool switching.
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
          if (region.type === "brushregion") continue;
          if (self.obj.multiImage && region.item_index !== self.obj.currentImage) continue;

          const hasCanvasHit = pointInBBox(region.bboxCoordsCanvas, canvasX, canvasY);
          if (hasCanvasHit) {
            console.log('[Brush] Found region via canvas bbox at coords:', { region: region.id, type: region.type });
            return region;
          }

          const hasInternalHit = pointInBBox(region.bboxCoords, internalX, internalY);
          if (hasInternalHit) {
            console.log('[Brush] Found region via internal bbox at coords:', { region: region.id, type: region.type });
            return region;
          }

          if (region.type === "keypointregion") {
            const radius = region.radius || 5;
            const tolerance = (region.canvasWidth || radius * 2) * 0.5;
            const dx = Math.abs((region.canvasX || region.x) - (canvasX ?? internalX));
            const dy = Math.abs((region.canvasY || region.y) - (canvasY ?? internalY));
            if (dx <= tolerance && dy <= tolerance) {
              console.log('[Brush] Found keypoint region via fallback detection:', { region: region.id, type: region.type });
              return region;
            }
          }

          if (region.type === "polygonregion" && Array.isArray(region.points) && region.points.length > 2 && Number.isFinite(internalX) && Number.isFinite(internalY)) {
            let inside = false;
            for (let i = 0, j = region.points.length - 1; i < region.points.length; j = i++) {
              const [xi, yi] = region.points[i];
              const [xj, yj] = region.points[j];
              const intersect = ((yi > internalY) !== (yj > internalY)) &&
                (internalX < (xj - xi) * (internalY - yi) / ((yj - yi) || 1e-6) + xi);
              if (intersect) inside = !inside;
            }
            if (inside) {
              console.log('[Brush] Found polygon region via fallback polygon check:', { region: region.id, type: region.type });
              return region;
            }
          }
        }

        return null;
      } catch (error) {
        console.warn('[Brush] Error checking regions at coordinates:', error);
        return null;
      }
    },

    addPoint(x, y) {
      const brush = self.currentArea;
      if (!brush || !isAlive(brush)) return;
      if (typeof brush.addPoint !== "function") return;
      brush.addPoint(Math.floor(x), Math.floor(y));
    },

    /* ---------------------------------------------------------- */
    /*  mouseup                                                   */
    /* ---------------------------------------------------------- */
    mouseupEv(_ev, _, [x, y]) {
      if (self.mode !== "drawing") return;
      self.addPoint(x, y);
      self.mode = "viewing";

      const brush = self.currentArea;
      if (brush && isAlive(brush)) {
        brush.setDrawing(false);
        brush.endPath();
      }

      setTimeout(() => {
        if (!isAlive(self)) return;
        try {
          const newArea = self.commitDrawingRegion();
          if (newArea && isAlive(newArea) && isAlive(self.obj.annotation)) {
            self.obj.annotation.selectArea(newArea);
          }
          if (isAlive(self.annotation)) self.annotation.history.unfreeze();
          if (isAlive(self.obj) && isAlive(self.obj.annotation))
            self.obj.annotation.setIsDrawing(false);
        } catch (e) {
          console.error("[Brush] error in commitDrawingRegion", e);
        }
      });
    },

    /* ---------------------------------------------------------- */
    /*  mousemove                                                 */
    /* ---------------------------------------------------------- */
    mousemoveEv(ev, _, [x, y]) {
      if (!self.isAllowedInteraction(ev)) return;
      if (self.mode !== "drawing") return;
      if (!isAlive(self)) return;

      const inside = findClosestParent(
        ev.target,
        (el) => el === self.obj.stageRef.content,
        (el) => el.parentElement
      );
      if (!inside) return;
      self.addPoint(x, y);
    },

    /* ---------------------------------------------------------- */
    /*  mousedown – Crea regione SOLO se non esiste una viva      */
    /* ---------------------------------------------------------- */
    mousedownEv(ev, [internalX, internalY], [x, y]) {
      if (!self.isAllowedInteraction(ev)) return;
      if (self.obj && self.obj._toolSwitchingInProgress) {
        console.log("[Brush] Tool switching in progress flag detected, clearing and continuing");
        self.obj._toolSwitchingInProgress = false;
      }
      const inside = findClosestParent(
        ev.target,
        (el) => el === self.obj.stageRef.content,
        (el) => el.parentElement
      );
      if (!inside) return;

      // Check if clicking on an existing region by checking coordinates
      // IMPORTANT: In Konva, ev.target is ALWAYS the HTML canvas, not the Shape!
      // We need to check if there are regions at the click coordinates

      // Check if there are any regions at these coordinates
      const regionAtPointer = self.findRegionAtCoordinates(internalX, internalY, x, y);

      console.log('[Brush] mousedownEv - click analysis:', {
        x, y,
        hasRegionAtCoords: Boolean(regionAtPointer),
        clickedOnCanvas: ev.target?.tagName === 'CANVAS'
      });

      if (regionAtPointer) {
        console.log('[Brush] ✅ Detected region at coordinates, delegating to region click handler');

        const markDelegated = (eventLike) => {
          if (!eventLike || typeof eventLike !== 'object') return;
          eventLike.__lsfBrushDelegated = true;
          eventLike.__lsfBrushDelegatedTarget = regionAtPointer?.id;
        };

        // Stop the original event from bubbling further so the region handler won't run twice
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

        // Recreate enough of the Konva event structure so the region can handle selection/tool switching once
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

      console.log('[Brush] ❌ No region at coordinates, proceeding with drawing');

      const c = self.control;
      const o = self.obj;

      // Se esiste già una regione viva la ri-usiamo, altrimenti ne creiamo una nuova
      let brush = self.currentArea;
      if (brush && isAlive(brush)) {
        // Continua sullo stesso brush
        if (o.multiImage && o.currentImage !== brush.item_index) return;
      } else {
        // Crea nuova regione temporanea
        console.log('[Brush] Checking canStartDrawing:', self.canStartDrawing());
        if (!self.canStartDrawing()) {
          console.log('[Brush] ❌ canStartDrawing returned false, cannot create region');
          return;
        }
        console.log('[Brush] Checking control.isSelected:', self.control?.isSelected);
        if (
          self.tagTypes.stateTypes === self.control.type &&
          !self.control.isSelected
        ) {
          console.log('[Brush] ❌ No label selected, cannot create region');
          if (window.showLabelingWarning) {
            window.showLabelingWarning('Seleziona una label prima di disegnare! Premi un tasto numerico (1-9) oppure clicca direttamente sul menu per selezionare una label.');
          }
          return;
        }

        brush = self.createDrawingRegion({
          touches: [],
          coordstype: "px",
        });
      }

      self.annotation.history.freeze();
      self.mode = "drawing";
      self.obj.annotation.setIsDrawing(true);

      brush.beginPath({
        type: "add",
        strokeWidth: self.strokeWidth || c.strokeWidth,
      });
      self.addPoint(x, y);
    },

    // Handle tool switching - reset drawing state
    handleToolSwitch(newTool) {
      if (self.mode === "drawing") {
        self.mode = "viewing";
        if (self.currentArea && isAlive(self.currentArea)) {
          self.currentArea.setDrawing(false);
        }
      }
    },
  }))
  /* ---------- Reaction: se il label cambia -> nuova regione    */
  .actions((self) => ({
    afterAttach() {
      reaction(
        () => self.control?.selectedValues,
        () => {
          // se stiamo disegnando e il label cambia, semplicemente
          // lasciamo che il prossimo mousedown crei una regione nuova;
          // non tocchiamo la vecchia per evitare “object is no longer alive”.
          if (self.mode === "drawing") {
            self.mode = "viewing";
            if (self.currentArea && isAlive(self.currentArea)) {
              self.currentArea.setDrawing(false);
            }
          }
        }
      );
    },
  }));

/* ---------- Cursor ---------- */
const BrushCursorMixin = types
  .model("BrushCursorMixin")
  .views((self) => ({
    get cursorStyleRule() {
      return Canvas.createBrushSizeCircleCursor(self.strokeWidth);
    },
  }))
  .actions((self) => ({
    updateCursor() {
      if (!self.selected || !self.obj?.stageRef) return;
      self.obj.stageRef.container().style.cursor = self.cursorStyleRule;
    },
  }));

/* ---------- Export ---------- */
const Brush = types.compose(
  _Tool.name,
  ToolMixin,
  BaseTool,
  DrawingTool,
  BrushCursorMixin,
  _Tool
);

export { Brush, BrushCursorMixin };