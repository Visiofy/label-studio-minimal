import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { NodeViews } from "../components/Node/Node";
import { DrawingTool } from "../mixins/DrawingTool";
import { FF_DEV_3793, isFF } from "../utils/feature-flags";

const _Tool = types
  .model("KeyPointTool", {
    default: types.optional(types.boolean, true),
    group: "segmentation",
    shortcut: "K",
    smart: true,
  })
  .views(() => ({
    get tagTypes() {
      return {
        stateTypes: "keypointlabels",
        controlTagTypes: ["keypointlabels", "keypoint"],
      };
    },
    get viewTooltip() {
      return "Key Point";
    },
    get iconComponent() {
      return self.dynamic ? NodeViews.KeyPointRegionModel.altIcon : NodeViews.KeyPointRegionModel.icon;
    },
  }))
  .actions((self) => ({
    clickEv(ev, [x, y]) {
      if (!self.canStartDrawing()) return;
      if (!self.isAllowedInteraction(ev)) return;

      const c = self.control;

      if (c.type === "keypointlabels" && !c.isSelected) {
        console.log('[KeyPoint] ❌ No label selected, cannot create region');
        if (window.showLabelingWarning) {
          window.showLabelingWarning('Seleziona una label prima di posizionare un keypoint! Usa il menu o premi un tasto numerico (1-9) per selezionare una label.');
        }
        return;
      }
      if (self.annotation.isReadOnly()) return;

      // Se smartEnabled è attivo (SAM), il keypoint deve essere dynamic
      // così verrà eliminato automaticamente quando la brush suggestion viene accettata
      const isDynamic = self.dynamic || c.smartEnabled;

      const keyPoint = self.createRegion({
        ...self.control?.getSnappedPoint({
          x,
          y,
        }),
        ...(isFF(FF_DEV_3793)
          ? {
              // strokeWidth is visual only, so it's in screen dimensions in config
              width: self.obj.canvasToInternalX(Number(c.strokewidth)),
            }
          : {
              width: Number(c.strokewidth),
              coordstype: "px",
            }),
        dynamic: isDynamic,
        negative: isDynamic && ev.altKey,
      });

      keyPoint.setDrawing(false);
      keyPoint.notifyDrawingFinished();
    },
  }));

const KeyPoint = types.compose(_Tool.name, ToolMixin, BaseTool, DrawingTool, _Tool);

export { KeyPoint };
