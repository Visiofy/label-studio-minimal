import { isAlive, types } from "mobx-state-tree";

import BaseTool, { DEFAULT_DIMENSIONS } from "./Base";
import ToolMixin from "../mixins/Tool";
import { MultipleClicksDrawingTool } from "../mixins/DrawingTool";
import { NodeViews } from "../components/Node/Node";
import { observe } from "mobx";

const _Tool = types
  .model("PolygonTool", {
    group: "segmentation",
    shortcut: "P",
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

        if (poly && !isAlive(poly)) return null;
        if (poly && poly.closed) return null;
        if (poly === undefined) return null;
        if (poly && poly.type !== "polygonregion") return null;

        return poly;
      },

      get tagTypes() {
        return {
          stateTypes: "polygonlabels",
          controlTagTypes: ["polygonlabels", "polygon"],
        };
      },

      get viewTooltip() {
        return "Polygon region";
      },
      get iconComponent() {
        return self.dynamic ? NodeViews.PolygonRegionModel.altIcon : NodeViews.PolygonRegionModel.icon;
      },

      get defaultDimensions() {
        return DEFAULT_DIMENSIONS.polygon;
      },

      createRegionOptions({ x, y }) {
        return Super.createRegionOptions({
          points: [[x, y]],
          width: 10,
          closed: false,
        });
      },

      isIncorrectControl() {
        if (self.current() !== null) return false; // already drawing
        // Standard check: tag4 has a selected label?
        if (!Super.isIncorrectControl()) return false;
        // Fallback: any label control has a selected label? (covers label-sync issues)
        const annotation = self.annotation;
        if (annotation?.root?.children) {
          for (const ctrl of annotation.root.children) {
            if (ctrl?.type?.includes('labels') && ctrl.isSelected) return false;
          }
        }
        return true;
      },
      isIncorrectLabel() {
        return !self.current() && Super.isIncorrectLabel();
      },
      canStart() {
        return self.current() === null;
      },

      current() {
        return self.getActivePolygon;
      },
    };
  })
  .actions((self) => {
    const Super = {
      startDrawing: self.startDrawing,
      _finishDrawing: self._finishDrawing,
      deleteRegion: self.deleteRegion,
      _clickEv: self._clickEv,
    };

    let disposer;
    let closed;

    return {
      // Override: if there is no polygon in progress but a region is selected
      // (e.g. just finished drawing), deselect first so a new polygon can start.
      _clickEv(ev, [x, y]) {
        if (!self.current() && self.annotation.regionStore.hasSelection) {
          self.annotation.unselectAll(true);
        }
        Super._clickEv(ev, [x, y]);
      },

      handleToolSwitch(tool) {
        self.stopListening();
        if (self.getCurrentArea()?.isDrawing && tool.toolName !== "ZoomPanTool") {
          const shape = self.getCurrentArea()?.toJSON();

          if (shape?.points?.length > 2) self.finishDrawing();
          else self.cleanupUncloseableShape();
        }
      },
      listenForClose() {
        closed = false;
        disposer = observe(
          self.getCurrentArea(),
          "closed",
          () => {
            if (self.getCurrentArea()?.closed && !closed) {
              self.finishDrawing();
            }
          },
          true,
        );
      },
      stopListening() {
        if (disposer) disposer();
      },
      closeCurrent() {
        self.stopListening();
        if (closed) return;
        closed = true;
        self.getCurrentArea().closePoly();
      },

      startDrawing(x, y) {
        const point = self.control?.getSnappedPoint({ x, y });

        self.mode = "drawing";
        self.currentArea = self.createRegion(self.createRegionOptions({ x: point.x, y: point.y }), true);
        self.setDrawing(true);
        self.applyActiveStates(self.currentArea);
      },

      _finishDrawing() {
        const { currentArea, control } = self;

        self.currentArea.notifyDrawingFinished();
        self.setDrawing(false);
        self.currentArea = null;
        self.mode = "viewing";
        self.annotation.afterCreateResult(currentArea, control);
      },

      setDrawing(drawing) {
        self.currentArea?.setDrawing(drawing);
        self.annotation.setIsDrawing(drawing);
      },

      deleteRegion() {
        const { currentArea } = self;

        self.setDrawing(false);
        self.currentArea = null;
        if (currentArea) {
          currentArea.deleteRegion();
        }
      },
    };
  });

const Polygon = types.compose(_Tool.name, ToolMixin, BaseTool, MultipleClicksDrawingTool, _Tool);

export { Polygon };
