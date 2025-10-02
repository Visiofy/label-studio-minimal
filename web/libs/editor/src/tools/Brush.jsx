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
      return newArea;
    },

    setStroke(val) {
      self.strokeWidth = val;
      self.updateCursor();
    },

    afterUpdateSelected() {
      self.updateCursor();
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
    mousedownEv(ev, _, [x, y]) {
      if (!self.isAllowedInteraction(ev)) return;
      const inside = findClosestParent(
        ev.target,
        (el) => el === self.obj.stageRef.content,
        (el) => el.parentElement
      );
      if (!inside) return;

      const c = self.control;
      const o = self.obj;

      // Se esiste già una regione viva la ri-usiamo, altrimenti ne creiamo una nuova
      let brush = self.currentArea;
      if (brush && isAlive(brush)) {
        // Continua sullo stesso brush
        if (o.multiImage && o.currentImage !== brush.item_index) return;
      } else {
        // Crea nuova regione temporanea
        if (!self.canStartDrawing()) return;
        if (
          self.tagTypes.stateTypes === self.control.type &&
          !self.control.isSelected
        )
          return;

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