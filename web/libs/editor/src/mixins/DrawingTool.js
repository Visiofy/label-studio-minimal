import { types, isAlive } from "mobx-state-tree";

import Utils from "../utils";
import throttle from "lodash.throttle";
import { MIN_SIZE } from "../tools/Base";
import { FF_DEV_3793, isFF } from "../utils/feature-flags";
import { RELATIVE_STAGE_HEIGHT, RELATIVE_STAGE_WIDTH } from "../components/ImageView/Image";

const safeMobxAccess = (fn, fallback = null) => {
  try {
    return fn();
  } catch (error) {
    if (error.message && error.message.includes('no longer part of a state tree')) {
      console.warn('[SafeMobX DrawingTool] Attempted access to destroyed MobX object:', error.message.substring(0, 100));
      return fallback;
    }
    throw error;
  }
};

const isSafeToUse = (item) => {
  if (!item) return false;
  try {
    return isAlive(item);
  } catch (error) {
    return false;
  }
};

const DrawingTool = types
  .model("DrawingTool", {
    default: true,
    mode: types.optional(types.enumeration(["drawing", "viewing"]), "viewing"),
    unselectRegionOnToolChange: true,
    isDrawingTool: true,
  })
  .volatile(() => {
    return {
      currentArea: null,
    };
  })
  .views((self) => {
    return {
      createRegionOptions(opts) {
        return {
          ...opts,
          coordstype: "px",
        };
      },
      get tagTypes() {
        console.error("Drawing tool model needs to implement tagTypes getter in views");
        return {};
      },
      isIncorrectControl() {
        return self.tagTypes.stateTypes === self.control.type && !self.control.isSelected;
      },
      isIncorrectLabel() {
        return !self.obj.checkLabels();
      },
      get isDrawing() {
        return self.mode === "drawing";
      },
      get getActiveShape() {
        return self.currentArea;
      },
      getCurrentArea() {
        return self.currentArea;
      },
      current() {
        return self.currentArea;
      },
      canStart() {
        return !self.isDrawing && !self.annotation.isReadOnly();
      },
      get defaultDimensions() {
        console.warn("Drawing tool model needs to implement defaultDimentions getter in views");
        return {};
      },
      get MIN_SIZE() {
        if (isFF(FF_DEV_3793)) {
          return {
            X: (MIN_SIZE.X / self.obj.stageScale / self.obj.stageWidth) * RELATIVE_STAGE_WIDTH,
            Y: (MIN_SIZE.Y / self.obj.stageScale / self.obj.stageHeight) * RELATIVE_STAGE_HEIGHT,
          };
        }

        return {
          X: MIN_SIZE.X / self.obj.stageScale,
          Y: MIN_SIZE.Y / self.obj.stageScale,
        };
      },
      /**
       * Determines if an interaction is allowed based on the current context and event properties.
       *
       * @param {Object} ev - The event object containing details about the interaction.
       * @return {boolean} Returns true if the interaction is allowed, otherwise false.
       */
      isAllowedInteraction(ev) {
        if (self.group !== "segmentation") return true;
        if (ev.offsetX > self.obj.canvasSize.width) return false;
        if (ev.offsetY > self.obj.canvasSize.height) return false;
        return true;
      },
    };
  })
  .actions((self) => {
    let lastClick = {
      ts: 0,
      x: 0,
      y: 0,
    };

    return {
      event(name, ev, [x, y, canvasX, canvasY]) {
        // filter right clicks and middle clicks and shift pressed
        if (ev.button > 0 || ev.shiftKey) return;
        let fn = `${name}Ev`;

        if (typeof self[fn] !== "undefined") self[fn].call(self, ev, [x, y], [canvasX, canvasY]);

        // Emulating of dblclick event, 'cause redrawing will crush the the original one
        if (name === "click") {
          const ts = ev.timeStamp;

          if (ts - lastClick.ts < 300 && self.comparePointsWithThreshold(lastClick, { x, y })) {
            fn = `dbl${fn}`;
            if (typeof self[fn] !== "undefined") self[fn].call(self, ev, [x, y], [canvasX, canvasY]);
          }
          lastClick = { ts, x, y };
        }
      },

      comparePointsWithThreshold(p1, p2, threshold = { x: self.MIN_SIZE.X, y: self.MIN_SIZE.Y }) {
        if (!p1 || !p2) return;
        if (typeof threshold === "number") threshold = { x: threshold, y: threshold };
        return Math.abs(p1.x - p2.x) < threshold.x && Math.abs(p1.y - p2.y) < threshold.y;
      },
    };
  })
  .actions((self) => {
    return {
      createDrawingRegion(opts) {
        try {
          const control = safeMobxAccess(() => self.control);
          if (!control || !isSafeToUse(control)) {
            console.warn('[DrawingTool] Control not available for createDrawingRegion');
            return null;
          }

          const resultValue = safeMobxAccess(() => control.getResultValue());
          if (!resultValue) {
            console.warn('[DrawingTool] No result value available');
            return null;
          }

          const obj = safeMobxAccess(() => self.obj);
          if (!obj || !isSafeToUse(obj)) {
            console.warn('[DrawingTool] Object not available for createDrawingRegion');
            return null;
          }

          self.currentArea = safeMobxAccess(() => obj.createDrawingRegion(opts, resultValue, control, false));
          if (!self.currentArea || !isSafeToUse(self.currentArea)) {
            console.warn('[DrawingTool] Failed to create drawing region');
            return null;
          }

          safeMobxAccess(() => self.currentArea.setDrawing(true));
          safeMobxAccess(() => self.applyActiveStates(self.currentArea));
          safeMobxAccess(() => self.annotation.setIsDrawing(true));

          return self.currentArea;
        } catch (error) {
          console.error('[DrawingTool] Error creating drawing region:', error);
          return null;
        }
      },
      resumeUnfinishedRegion(existingUnclosedPolygon) {
        self.currentArea = existingUnclosedPolygon;
        self.currentArea.setDrawing(true);
        self.annotation.regionStore.selection._updateResultsFromRegions([self.currentArea]);
        self.mode = "drawing";
        self.annotation.setIsDrawing(true);
        self.annotation.regionStore.selection.drawingSelect(self.currentArea);
        self.listenForClose?.();
      },
      commitDrawingRegion() {
        console.log('[DrawingTool.commitDrawingRegion] start, getting currentArea...');
        const { currentArea, control, obj } = self;

        if (!currentArea) {
          console.log('[DrawingTool.commitDrawingRegion] no currentArea, returning');
          return;
        }
        console.log('[DrawingTool.commitDrawingRegion] currentArea found, creating value...');
        const source = currentArea.toJSON();
        const value = Object.keys(currentArea.serialize().value).reduce(
          (value, key) => {
            value[key] = source[key];
            return value;
          },
          { coordstype: "px", dynamic: self.dynamic },
        );

        // Safety check: ensure results is an array before destructuring
        const results = Array.isArray(currentArea.results) ? currentArea.results : [];
        if (results.length === 0) {
          console.warn('[DrawingTool.commitDrawingRegion] currentArea.results is empty or undefined');
          return;
        }

        const [main, ...rest] = results;
        console.log('[DrawingTool.commitDrawingRegion] calling annotation.createResult...');
        const newArea = self.annotation.createResult(value, main.value.toJSON(), control, obj);
        console.log('[DrawingTool.commitDrawingRegion] newArea created:', newArea ? 'success' : 'failed');

        //when user is using two different labels tag to draw a region, the other labels will be added to the region
        if (rest.length > 0) {
          rest.forEach((r) => newArea.addResult(r.toJSON()));
        }

        currentArea.setDrawing(false);
        self.deleteRegion();
        newArea.notifyDrawingFinished();

        // Reset isNewAnnotation flag for ALL other regions before marking the new one
        if (newArea && newArea.annotation && newArea.annotation.regionStore) {
          const allRegions = newArea.annotation.regionStore.regions || [];
          allRegions.forEach(region => {
            if (region && region.id !== newArea.id && region.isNewAnnotation && region.setIsNewAnnotation) {
              region.setIsNewAnnotation(false);
              console.log('[DrawingTool.commitDrawingRegion] Reset isNewAnnotation for region:', region.id);
            }
          });
        }

        // Mark as new annotation so label changes create new regions instead of modifying this one
        if (newArea && newArea.setIsNewAnnotation) {
          newArea.setIsNewAnnotation(true);
          console.log('[DrawingTool.commitDrawingRegion] marked region as new annotation:', newArea.id);
        }

        // Save draft immediately after region is completed
        if (self.annotation && self.annotation.saveDraft) {
          console.log('[DrawingTool.commitDrawingRegion] saving draft after region completion...');
          try {
            self.annotation.saveDraft();
            console.log('[DrawingTool.commitDrawingRegion] draft save triggered');
          } catch (error) {
            console.error('[DrawingTool.commitDrawingRegion] error saving draft:', error);
          }
        }

        console.log('[DrawingTool.commitDrawingRegion] finished, returning newArea');
        return newArea;
      },
      createRegion(opts, skipAfterCreate = false) {
        const control = self.control;
        const resultValue = control.getResultValue();

        self.currentArea = self.annotation.createResult(opts, resultValue, control, self.obj, skipAfterCreate);
        self.applyActiveStates(self.currentArea);
        return self.currentArea;
      },
      deleteRegion() {
        self.currentArea = null;
        self.obj.deleteDrawingRegion();
      },
      applyActiveStates(area) {
        const activeStates = safeMobxAccess(() => self.obj.activeStates()) || [];

        activeStates.forEach((state) => {
          if (state && isSafeToUse(state)) {
            safeMobxAccess(() => area.setValue(state));
          }
        });
      },

      beforeCommitDrawing() {
        return true;
      },

      canStartDrawing() {
        const incorrectControl = self.isIncorrectControl();
        const incorrectLabel = self.isIncorrectLabel();
        const canStart = self.canStart();
        const isDrawing = self.annotation.isDrawing;
        const result = !incorrectControl && !incorrectLabel && canStart && !isDrawing;

        if (!result) {
          console.log('[DrawingTool.canStartDrawing] Checks failed:', {
            incorrectControl,
            incorrectLabel,
            canStart,
            isDrawing,
            result
          });
        }

        return result;
      },

      startDrawing(x, y) {
        try {
          safeMobxAccess(() => self.annotation?.history?.freeze());
          self.mode = "drawing";

          const regionOptions = safeMobxAccess(() => self.createRegionOptions({ x, y }));
          if (!regionOptions) {
            console.warn('[DrawingTool] Failed to create region options');
            return false;
          }

          self.currentArea = self.createDrawingRegion(regionOptions);
          return self.currentArea !== null;
        } catch (error) {
          console.error('[DrawingTool] Error starting drawing:', error);
          self.mode = "viewing";
          return false;
        }
      },
      finishDrawing() {
        console.log('[DrawingTool.finishDrawing] start, checking beforeCommitDrawing...');
        if (!self.beforeCommitDrawing()) {
          console.log('[DrawingTool.finishDrawing] beforeCommitDrawing failed, deleting region');
          self.deleteRegion();
          if (self.control.type === self.tagTypes.stateTypes) self.annotation.unselectAll(true);
          self._resetState();
        } else {
          console.log('[DrawingTool.finishDrawing] beforeCommitDrawing passed, calling _finishDrawing');
          self._finishDrawing();
        }
      },
      _finishDrawing() {
        console.log('[DrawingTool._finishDrawing] start, calling commitDrawingRegion');
        self.commitDrawingRegion();
        console.log('[DrawingTool._finishDrawing] finished commitDrawingRegion, resetting state');
        self._resetState();
      },
      _resetState() {
        self.annotation.setIsDrawing(false);
        self.annotation.history.unfreeze();
        self.mode = "viewing";
      },
    };
  });

const TwoPointsDrawingTool = DrawingTool.named("TwoPointsDrawingTool")
  .volatile(() => ({
    currentMode: 0, // DEFAULT_MODE
    modeAfterMouseMove: 0, // DEFAULT_MODE
    startPoint: null,
    endPoint: { x: 0, y: 0 },
  }))
  .views((self) => ({
    get defaultDimensions() {
      return {
        width: self.MIN_SIZE.X,
        height: self.MIN_SIZE.Y,
      };
    },
  }))
  .actions((self) => {
    const DEFAULT_MODE = 0;
    const DRAG_MODE = 1;
    const TWO_CLICKS_MODE = 2;
    const Super = {
      finishDrawing: self.finishDrawing,
    };

    return {
      updateDraw: throttle((x, y) => {
        if (self.currentMode === DEFAULT_MODE) return;
        self.draw(x, y);
      }, 48), // 3 frames, optimized enough and not laggy yet

      draw(x, y) {
        console.log('[TwoPointsDrawingTool.draw] start, getting current area...');
        const shape = self.getCurrentArea();

        console.log('[TwoPointsDrawingTool.draw] current area:', shape ? 'found' : 'not found');
        if (!shape || !isSafeToUse(shape)) return;

        const isEllipse = safeMobxAccess(() => shape.type?.includes("ellipse"), false);
        const maxStageWidth = isFF(FF_DEV_3793) ? RELATIVE_STAGE_WIDTH : safeMobxAccess(() => self.obj.stageWidth, 800);
        const maxStageHeight = isFF(FF_DEV_3793) ? RELATIVE_STAGE_HEIGHT : safeMobxAccess(() => self.obj.stageHeight, 600);

        const startX = safeMobxAccess(() => shape.startX, 0);
        const startY = safeMobxAccess(() => shape.startY, 0);
        const rotation = safeMobxAccess(() => shape.rotation, 0);

        let { x1, y1, x2, y2 } = isEllipse
          ? {
              x1: startX,
              y1: startY,
              x2: x,
              y2: y,
            }
          : Utils.Image.reverseCoordinates({ x: startX, y: startY }, { x, y });

        x1 = Math.max(0, x1);
        y1 = Math.max(0, y1);
        x2 = Math.min(maxStageWidth, x2);
        y2 = Math.min(maxStageHeight, y2);

        let [distX, distY] = [x2 - x1, y2 - y1].map(Math.abs);

        if (isEllipse) {
          distX = Math.min(distX, Math.min(x1, maxStageWidth - x1));
          distY = Math.min(distY, Math.min(y1, maxStageHeight - y1));
        }

        safeMobxAccess(() => shape.setPositionInternal(x1, y1, distX, distY, rotation));
      },

      finishDrawing(x, y) {
        console.log('[TwoPointsDrawingTool.finishDrawing] start, calling Super.finishDrawing');
        self.startPoint = null;
        Super.finishDrawing(x, y);
        self.currentMode = DEFAULT_MODE;
        self.modeAfterMouseMove = DEFAULT_MODE;
        console.log('[TwoPointsDrawingTool.finishDrawing] finished');
      },

      mousedownEv(ev, [x, y]) {
        console.log('[TwoPointsDrawingTool.mousedownEv] Entry - startPoint:', self.startPoint, 'currentMode:', self.currentMode, 'coords:', x, y);

        if (!self.canStartDrawing()) {
          console.log('[TwoPointsDrawingTool.mousedownEv] Cannot start drawing, returning');
          return;
        }
        if (!self.isAllowedInteraction(ev)) {
          console.log('[TwoPointsDrawingTool.mousedownEv] Interaction not allowed, returning');
          return;
        }

        // CRITICAL CHECK: Prevent starting drawing if tool switching is in progress
        const imageObject = self.obj;
        if (imageObject && imageObject._toolSwitchingInProgress) {
          console.log("[TwoPointsDrawingTool.mousedownEv] Tool switching in progress flag detected, clearing and accepting mousedown");
          imageObject._toolSwitchingInProgress = false;
        }

        // Reset state if we're starting fresh to avoid lingering points from tool switches
        if (self.currentMode === DEFAULT_MODE && !self.startPoint) {
          console.log("[TwoPointsDrawingTool.mousedownEv] Starting fresh drawing session");
        }

        console.log('[TwoPointsDrawingTool.mousedownEv] Setting startPoint to:', { x, y });
        self.startPoint = { x, y };
        if (self.currentMode === DEFAULT_MODE) {
          self.modeAfterMouseMove = DRAG_MODE;
          console.log('[TwoPointsDrawingTool.mousedownEv] Set modeAfterMouseMove to DRAG_MODE');
        }
      },

      mousemoveEv(_, [x, y]) {
        try {
          // console.log('[TwoPointsDrawingTool.mousemoveEv] currentMode:', self.currentMode, 'startPoint:', self.startPoint, 'coords:', x, y);

          if (self.currentMode === DEFAULT_MODE && self.startPoint) {
            if (!self.comparePointsWithThreshold(self.startPoint, { x, y })) {
              // console.log('[TwoPointsDrawingTool.mousemoveEv] Threshold exceeded, switching mode from DEFAULT to:', self.modeAfterMouseMove);
              self.currentMode = self.modeAfterMouseMove;
              if ([DRAG_MODE, TWO_CLICKS_MODE].includes(self.currentMode)) {
                // console.log('[TwoPointsDrawingTool.mousemoveEv] Starting drawing at startPoint:', self.startPoint);
                const started = self.startDrawing(self.startPoint.x, self.startPoint.y);
                if (!started || !safeMobxAccess(() => self.isDrawing, false)) {
                  // console.log('[TwoPointsDrawingTool.mousemoveEv] Failed to start drawing, resetting to DEFAULT_MODE');
                  self.currentMode = DEFAULT_MODE;
                  return;
                }
              }
            }
          }
          if (!safeMobxAccess(() => self.isDrawing, false)) {
            // console.log('[TwoPointsDrawingTool.mousemoveEv] Not drawing, returning');
            return;
          }
          if ([DRAG_MODE, TWO_CLICKS_MODE].includes(self.currentMode)) {
            // console.log('[TwoPointsDrawingTool.mousemoveEv] Updating draw');
            self.updateDraw(x, y);
          }
        } catch (error) {
          console.error('[DrawingTool TwoPoints] Error in mousemove:', error);
          self.currentMode = DEFAULT_MODE;
        }
      },

      mouseupEv(_, [x, y]) {
        console.log('[TwoPointsDrawingTool.mouseupEv] start, mode:', self.currentMode, 'isDrawing:', self.isDrawing);
        if (self.currentMode !== DRAG_MODE) return;
        self.endPoint = { x, y };
        if (!self.isDrawing) return;
        console.log('[TwoPointsDrawingTool.mouseupEv] calling draw and finishDrawing');
        self.draw(x, y);
        self.finishDrawing(x, y);
        console.log('[TwoPointsDrawingTool.mouseupEv] finished');
      },

      clickEv(ev, [x, y]) {
        if (!self.canStartDrawing()) return;
        if (!self.isAllowedInteraction(ev)) return;
        // @todo: here is a potential problem with endPoint
        // it may be incorrect due to it may be not set at this moment
        if (self.startPoint && self.endPoint && !self.comparePointsWithThreshold(self.startPoint, self.endPoint)) return;
        if (self.currentMode === DEFAULT_MODE) {
          self.modeAfterMouseMove = TWO_CLICKS_MODE;
        } else if (self.isDrawing && self.currentMode === TWO_CLICKS_MODE) {
          self.draw(x, y);
          self.finishDrawing(x, y);
          self.currentMode = DEFAULT_MODE;
        }
      },

      dblclickEv(ev, [x, y]) {
        if (!self.canStartDrawing()) return;
        if (!self.isAllowedInteraction(ev)) return;

        let dX = self.defaultDimensions.width;
        let dY = self.defaultDimensions.height;

        if (isFF(FF_DEV_3793)) {
          dX = self.obj.canvasToInternalX(dX);
          dY = self.obj.canvasToInternalY(dY);
        }

        if (self.currentMode === DEFAULT_MODE) {
          self.startDrawing(x, y);
          if (!self.isDrawing) return;
          x += dX;
          y += dY;
          self.draw(x, y);
          self.finishDrawing(x, y);
        }
      },

      // Handle tool switching - reset internal state
      handleToolSwitch(newTool) {
        console.log('[TwoPointsDrawingTool.handleToolSwitch] Before reset - startPoint:', self.startPoint, 'currentMode:', self.currentMode);
        self.startPoint = null;
        self.endPoint = { x: 0, y: 0 };
        self.currentMode = DEFAULT_MODE;
        self.modeAfterMouseMove = DEFAULT_MODE;
        console.log('[TwoPointsDrawingTool.handleToolSwitch] After reset - startPoint:', self.startPoint, 'currentMode:', self.currentMode);
      },

    };
  });

const MultipleClicksDrawingTool = DrawingTool.named("MultipleClicksMixin")
  .views(() => ({
    canStart() {
      return !this.current();
    },
  }))
  .actions((self) => {
    let startPoint = { x: 0, y: 0 };
    let pointsCount = 0;
    let lastPoint = { x: -1, y: -1 };
    let lastEvent = 0;
    const MOUSE_DOWN_EVENT = 1;
    const MOUSE_UP_EVENT = 2;
    const CLICK_EVENT = 3;
    let lastClickTs = 0;
    const Super = {
      canStartDrawing: self.canStartDrawing,
    };

    return {
      canStartDrawing() {
        return Super.canStartDrawing() && !self.annotation.regionStore.hasSelection;
      },
      nextPoint(x, y) {
        const area = self.getCurrentArea();
        const object = self.obj;

        if (area && object && object.multiImage && area.item_index !== object.currentImage) return;

        self.getCurrentArea().addPoint(x, y);
        pointsCount++;
      },
      listenForClose() {
        console.error("MultipleClicksMixin model needs to implement listenForClose method in actions");
      },
      closeCurrent() {
        console.error("MultipleClicksMixin model needs to implement closeCurrent method in actions");
      },
      finishDrawing() {
        if (!self.isDrawing) return;

        self.annotation.regionStore.selection.drawingUnselect();

        pointsCount = 0;
        self.closeCurrent();
        setTimeout(() => {
          self._finishDrawing();
        });
      },
      cleanupUncloseableShape() {
        self.deleteRegion();
        if (self.control.type === self.tagTypes.stateTypes) self.annotation.unselectAll(true);
        self._resetState();
      },
      mousedownEv(ev, [x, y]) {
        if (!self.isAllowedInteraction(ev)) return;
        lastPoint = { x, y };
        lastEvent = MOUSE_DOWN_EVENT;
      },
      mouseupEv(ev, [x, y]) {
        if (lastEvent === MOUSE_DOWN_EVENT && self.comparePointsWithThreshold(lastPoint, { x, y })) {
          self._clickEv(ev, [x, y]);
          lastEvent = MOUSE_UP_EVENT;
        }
        lastPoint = { x: -1, y: -1 };
      },
      clickEv(ev, [x, y]) {
        if (lastEvent !== MOUSE_UP_EVENT) {
          self._clickEv(ev, [x, y]);
        }
        lastEvent = CLICK_EVENT;
        lastPoint = { x: -1, y: -1 };
      },
      _clickEv(ev, [x, y]) {
        if (!self.isAllowedInteraction(ev)) return;
        if (self.current()) {
          if (
            pointsCount === 1 &&
            self.comparePointsWithThreshold(startPoint, { x, y }) &&
            ev.timeStamp - lastClickTs < 350
          ) {
            // dblclick
            self.drawDefault();
          } else {
            if (self.comparePointsWithThreshold(startPoint, { x, y })) {
              if (pointsCount > 2) {
                self.finishDrawing();
              }
            } else {
              self.nextPoint(x, y);
            }
          }
        } else {
          if (!self.canStartDrawing()) return;
          startPoint = { x, y };
          pointsCount = 1;
          lastClickTs = ev.timeStamp;
          self.startDrawing(x, y);
          self.listenForClose();
        }
      },

      drawDefault() {
        const { x, y } = startPoint;
        let dX = self.defaultDimensions.length;
        let dY = self.defaultDimensions.length;

        if (isFF(FF_DEV_3793)) {
          dX = self.obj.canvasToInternalX(dX);
          dY = self.obj.canvasToInternalY(dY);
        }

        self.nextPoint(x + dX, y);
        self.nextPoint(x + dX / 2, y + Math.sin(Math.PI / 3) * dY);
        self.finishDrawing();
      },

      // Handle tool switching - reset internal state
      handleToolSwitch(newTool) {
        console.log('[MultipleClicksDrawingTool.handleToolSwitch] Resetting state for tool switch');
        startPoint = { x: 0, y: 0 };
        pointsCount = 0;
        lastPoint = { x: -1, y: -1 };
        lastEvent = 0;
        lastClickTs = 0;
      },
    };
  });

const ThreePointsDrawingTool = DrawingTool.named("ThreePointsDrawingTool")
  .views((self) => ({
    canStart() {
      return !this.current();
    },
    get defaultDimensions() {
      return {
        width: self.MIN_SIZE.X,
        height: self.MIN_SIZE.Y,
      };
    },
  }))
  .actions((self) => {
    let points = [];
    let lastEvent = 0;
    const DEFAULT_MODE = 0;
    const MOUSE_DOWN_EVENT = 1;
    const MOUSE_UP_EVENT = 2;
    const CLICK_EVENT = 3;
    const DRAG_MODE = 4;
    const DBL_CLICK_EVENT = 5;
    let currentMode = DEFAULT_MODE;
    let startPoint = null;
    const Super = {
      finishDrawing: self.finishDrawing,
    };

    return {
      canStartDrawing() {
        return !self.isIncorrectControl();
      },
      updateDraw: (x, y) => {
        if (currentMode === DEFAULT_MODE) self.getCurrentArea()?.draw(x, y, points);
        else if (currentMode === DRAG_MODE) self.draw(x, y);
      },

      nextPoint(x, y) {
        points.push({ x, y });
        self.getCurrentArea().draw(x, y, points);
      },
      draw(x, y) {
        const shape = self.getCurrentArea();

        if (!shape) return;
        const maxStageWidth = isFF(FF_DEV_3793) ? RELATIVE_STAGE_WIDTH : self.obj.stageWidth;
        const maxStageHeight = isFF(FF_DEV_3793) ? RELATIVE_STAGE_HEIGHT : self.obj.stageHeight;

        let { x1, y1, x2, y2 } = Utils.Image.reverseCoordinates({ x: shape.startX, y: shape.startY }, { x, y });

        x1 = Math.max(0, x1);
        y1 = Math.max(0, y1);
        x2 = Math.min(maxStageWidth, x2);
        y2 = Math.min(maxStageHeight, y2);

        shape.setPositionInternal(x1, y1, x2 - x1, y2 - y1, shape.rotation);
      },

      finishDrawing(x, y) {
        if (self.isDrawing) {
          points = [];
          startPoint = null;
          currentMode = DEFAULT_MODE;
          Super.finishDrawing(x, y);
          setTimeout(() => {
            self._finishDrawing();
          });
        } else return;
      },

      mousemoveEv(_, [x, y]) {
        if (self.isDrawing) {
          if (lastEvent === MOUSE_DOWN_EVENT) {
            currentMode = DRAG_MODE;
          }

          if (currentMode === DRAG_MODE && startPoint) {
            self.startDrawing(startPoint.x, startPoint.y);
            self.updateDraw(x, y);
          } else if (currentMode === DEFAULT_MODE) {
            self.updateDraw(x, y);
          }
        }
      },
      mousedownEv(ev, [x, y]) {
        if (!self.canStartDrawing() || self.annotation.isDrawing) return;
        if (!self.isAllowedInteraction(ev)) return;
        lastEvent = MOUSE_DOWN_EVENT;
        startPoint = { x, y };
        self.mode = "drawing";
      },
      mouseupEv(_ev, [x, y]) {
        if (!self.canStartDrawing()) return;
        if (self.isDrawing) {
          if (currentMode === DRAG_MODE) {
            self.draw(x, y);
            self.finishDrawing(x, y);
          }
          lastEvent = MOUSE_UP_EVENT;
        }
      },
      clickEv(ev, [x, y]) {
        if (!self.canStartDrawing()) return;
        if (!self.isAllowedInteraction(ev)) return;
        if (currentMode === DEFAULT_MODE) {
          self._clickEv(ev, [x, y]);
        }
        lastEvent = CLICK_EVENT;
      },
      _clickEv(_ev, [x, y]) {
        if (points.length >= 2) {
          self.finishDrawing(x, y);
        } else if (points.length === 0) {
          points = [{ x, y }];
          self.startDrawing(x, y);
        } else {
          self.nextPoint(x, y);
        }
      },

      dblclickEv(ev, [x, y]) {
        lastEvent = DBL_CLICK_EVENT;
        if (!self.canStartDrawing()) return;
        if (!self.isAllowedInteraction(ev)) return;

        let dX = self.defaultDimensions.width;
        let dY = self.defaultDimensions.height;

        if (isFF(FF_DEV_3793)) {
          dX = self.obj.canvasToInternalX(dX);
          dY = self.obj.canvasToInternalY(dY);
        }

        if (currentMode === DEFAULT_MODE) {
          self.startDrawing(x, y);
          if (!self.isDrawing) return;
          x += dX;
          y += dY;
          self.draw(x, y);
          self.finishDrawing(x, y);
        }
      },

      // Handle tool switching - reset internal state
      handleToolSwitch(newTool) {
        console.log('[ThreePointsDrawingTool.handleToolSwitch] Resetting state for tool switch');
        points = [];
        lastEvent = 0;
        currentMode = DEFAULT_MODE;
        startPoint = null;
      },
    };
  });

export { DrawingTool, TwoPointsDrawingTool, MultipleClicksDrawingTool, ThreePointsDrawingTool };
