import { inject, observer } from "mobx-react";
import { getType, types } from "mobx-state-tree";
import ColorScheme from "pleasejs";

import { Tooltip } from "@humansignal/ui";
import InfoModal from "../../components/Infomodal/Infomodal";
import { Label } from "../../components/Label/Label";
import Constants from "../../core/Constants";
import { customTypes } from "../../core/CustomTypes";
import { guidGenerator } from "../../core/Helpers";
import Registry from "../../core/Registry";
import Types from "../../core/Types";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import { TagParentMixin } from "../../mixins/TagParentMixin";
import ToolsManager from "../../tools/Manager";
import Utils from "../../utils";
import { parseValue } from "../../utils/data";
import { sanitizeHtml } from "../../utils/html";

/**
 * The `Label` tag represents a single label. Use with the `Labels` tag, including `BrushLabels`, `EllipseLabels`, `HyperTextLabels`, `KeyPointLabels`, and other `Labels` tags to specify the value of a specific label.
 *
 * @example
 * <!--Basic named entity recognition labeling configuration for text-->
 * <View>
 *   <Labels name="type" toName="txt-1">
 *     <Label alias="B" value="Brand" />
 *     <Label alias="P" value="Product" />
 *   </Labels>
 *   <Text name="txt-1" value="$text" />
 * </View>
 * @name Label
 * @meta_title Label Tag for Single Label Tags
 * @meta_description Customize Label Studio with the Label tag to assign a single label to regions in a task for machine learning and data science projects.
 * @param {string} value                    - Value of the label
 * @param {boolean} [selected=false]        - Whether to preselect this label
 * @param {number} [maxUsages]              - Maximum number of times this label can be used per task
 * @param {string} [hint]                   - Hint for label on hover
 * @param {string} [hotkey]                 - Hotkey to use for the label. Automatically generated if not specified
 * @param {string} [alias]                  - Label alias
 * @param {boolean} [showAlias=false]       - Whether to show alias inside label text
 * @param {string} [aliasStyle=opacity:0.6] - CSS style for the alias
 * @param {string} [size=medium]            - Size of text in the label
 * @param {string} [background=#36B37E]     - Background color of an active label in hexadecimal
 * @param {string} [selectedColor=#ffffff]  - Color of text in an active label in hexadecimal
 * @param {symbol|word} [granularity]       - Set control based on symbol or word selection (only for Text)
 * @param {string} [html]                   - HTML code is used to display label button instead of raw text provided by `value` (should be properly escaped)
 * @param {int} [category]                  - Category is used in the export (in label-studio-converter lib) to make an order of labels for YOLO and COCO
 */
const TagAttrs = types.model({
  value: types.maybeNull(types.string),
  selected: types.optional(types.boolean, false),
  maxusages: types.maybeNull(types.string),
  alias: types.maybeNull(types.string),
  hint: types.maybeNull(types.string),
  hotkey: types.maybeNull(types.string),
  showalias: types.optional(types.boolean, false),
  aliasstyle: types.optional(types.string, "opacity: 0.6"),
  size: types.optional(types.string, "medium"),
  background: types.optional(customTypes.color, Constants.LABEL_BACKGROUND),
  selectedcolor: types.optional(customTypes.color, "#ffffff"),
  granularity: types.maybeNull(types.enumeration(["symbol", "word", "sentence", "paragraph"])),
  groupcancontain: types.maybeNull(types.string),
  html: types.maybeNull(types.string),
});

// Store globale per ricordare l'ultima selezione con gestione sicura
const globalLastSelection = {
  get labelValue() {
    try {
      return localStorage.getItem('lastSelectedLabel');
    } catch (e) {
      return this._labelValue || null;
    }
  },
  set labelValue(value) {
    try {
      if (value) {
        localStorage.setItem('lastSelectedLabel', value);
      } else {
        localStorage.removeItem('lastSelectedLabel');
      }
    } catch (e) {
      this._labelValue = value;
    }
  },
  get labelGroupName() {
    try {
      return localStorage.getItem('lastSelectedLabelGroup');
    } catch (e) {
      return this._labelGroupName || null;
    }
  },
  set labelGroupName(value) {
    try {
      if (value) {
        localStorage.setItem('lastSelectedLabelGroup', value);
      } else {
        localStorage.removeItem('lastSelectedLabelGroup');
      }
    } catch (e) {
      this._labelGroupName = value;
    }
  },
  _labelValue: null,
  _labelGroupName: null,
  _recentlyInteracted: false,
  _lastTaskId: null,
  _lastInteractionTime: 0,

  // Traccia interazioni recenti dell'utente
  setRecentInteraction() {
    this._recentlyInteracted = true;
    this._lastInteractionTime = Date.now();

    // Reset automatico dopo 1 secondo
    setTimeout(() => {
      this._recentlyInteracted = false;
    }, 1000);
  },

  get hasRecentInteraction() {
    // Considera "recente" se l'ultima interazione è stata meno di 1 secondo fa
    return this._recentlyInteracted || (Date.now() - this._lastInteractionTime < 1000);
  },

  // Verifica se siamo in un nuovo task
  isNewTask(currentTaskId) {
    if (this._lastTaskId !== currentTaskId) {
      this._lastTaskId = currentTaskId;
      return true;
    }
    return false;
  },

  // Reset esplicito per nuovi task
  resetForNewTask() {
    this._recentlyInteracted = false;
    this._lastInteractionTime = 0;
  }
};

const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    type: "label",
    visible: types.optional(types.boolean, true),
    _value: types.optional(types.string, ""),
    parentTypes: Types.tagsTypes([
      "Labels",
      "EllipseLabels",
      "RectangleLabels",
      "PolygonLabels",
      "KeyPointLabels",
      "BrushLabels",
      "HyperTextLabels",
      "TimelineLabels",
      "TimeSeriesLabels",
      "ParagraphLabels",
    ]),
  })
  .volatile((self) => {
    return {
      initiallySelected: self.selected,
      isEmpty: false,
    };
  })
  .views((self) => ({
    get maxUsages() {
      return Number(self.maxusages || self.parent?.maxusages);
    },

    usedAlready() {
      const regions = self.annotation.regionStore.regions;
      const used = regions.reduce((s, r) => s + r.hasLabel(self.value), 0);
      return used;
    },

    canBeUsed(count = 1) {
      if (!self.maxUsages) return true;
      return self.usedAlready() + count <= self.maxUsages;
    },

    // Controlla se questa label era l'ultima selezionata globalmente
    wasLastSelected() {
      return globalLastSelection.labelValue === self.value && 
             globalLastSelection.labelGroupName === self.parent?.name;
    },
  }))
  .actions((self) => ({
    setEmpty() {
      self.isEmpty = true;
    },

    // Salva questa selezione come ultima selezione globale
    saveAsLastSelection() {
      globalLastSelection.labelValue = self.value;
      globalLastSelection.labelGroupName = self.parent?.name;
    },

    // Tenta di ripristinare l'ultima selezione solo se appropriato
    tryRestoreLastSelection() {
      // Non ripristinare se l'utente ha interagito di recente
      if (globalLastSelection.hasRecentInteraction) {
        return;
      }

      const currentTaskId = self.annotation?.task?.id;
      const isNewTask = globalLastSelection.isNewTask(currentTaskId);

      // Solo per nuovi task
      if (isNewTask && self.wasLastSelected() && !self.selected && !self.initiallySelected) {
        if (self.parent && !self.annotation?.isReadOnly()) {
          try {
            // Reset per il nuovo task
            globalLastSelection.resetForNewTask();

            if (self.parent.shouldBeUnselected) {
              self.parent.unselectAll();
            }
            self.setSelected(true);
          } catch (error) {
            console.warn('Error restoring last selection:', error);
          }
        }
      }
    },

    /**
     * Select label
     */
    toggleSelected() {
      // Traccia che l'utente ha interagito di recente
      globalLastSelection.setRecentInteraction();
      let sameObjectSelectedRegions = [];

      if (self.annotation.selectedDrawingRegions.length > 0) {
        sameObjectSelectedRegions = self.annotation.selectedDrawingRegions.filter((region) => {
          return region.parent?.name === self.parent?.toname;
        });
      } else if (self.annotation.selectedRegions.length > 0) {
        sameObjectSelectedRegions = self.annotation.selectedRegions.filter((region) => {
          return region.parent?.name === self.parent?.toname;
        });
      }

      const affectedRegions = sameObjectSelectedRegions.filter((region) => {
        return !region.isReadOnly();
      });

      if (self.annotation.isReadOnly()) return;

      if (sameObjectSelectedRegions.length > 0 && affectedRegions.length === 0) return;

      if (
        !!affectedRegions.length &&
        !self.selected &&
        !self.canBeUsed(affectedRegions.filter((region) => region.results).length)
      ) {
        InfoModal.warning(`You can't use ${self.value} more than ${self.maxUsages} time(s)`);
        return;
      }

      const labels = self.parent;

      const applicableRegions = affectedRegions.filter((region) => {
        if (
          labels.selectedLabels.length === 1 &&
          self.selected &&
          region.labelings.length === 1 &&
          (!labels?.allowempty || self.isEmpty)
        )
          return false;

        if (self.selected) return true;
        if (labels.type === "labels") return true;
        if (labels.type.includes(region.type.replace(/region$/, ""))) return true;
        if (labels.type.includes(region.results[0].type)) return true;

        return false;
      });

      if (sameObjectSelectedRegions.length > 0 && applicableRegions.length === 0) return;

      if (!labels.selectedLabels.length && !self.selected) {
        const manager = ToolsManager.getInstance({ name: self.parent.toname });
        const tool = Object.values(self.parent?.tools || {})[0];

        const selectedTool = manager.findSelectedTool();
        const sameType = tool && selectedTool ? getType(selectedTool).name === getType(tool).name : false;
        const sameLabel = selectedTool ? tool?.control?.name === selectedTool?.control?.name : false;
        const isNotSameTool = selectedTool && (!sameType || !sameLabel);

        if (tool && (isNotSameTool || !selectedTool)) {
          manager.selectTool(tool, true);
        }
      }

      if (self.isEmpty) {
        const selected = self.selected;
        labels.unselectAll();
        self.setSelected(!selected);
      } else {
        if (!labels.shouldBeUnselected) {
          self.setSelected(!self.selected);
        }

        if (labels.shouldBeUnselected) {
          if (!self.selected) {
            labels.unselectAll();
            self.setSelected(!self.selected);
          } else {
            labels.unselectAll();
          }
        }
      }

      // Salva la selezione corrente come ultima selezione globale
      if (self.selected) {
        self.saveAsLastSelection();
      }

      if (labels.allowempty && !self.isEmpty) {
        if (applicableRegions.length) {
          labels.findLabel().setSelected(!labels.selectedValues()?.length);
        } else {
          if (self.selected) {
            labels.findLabel().setSelected(false);
          }
        }
      }

      applicableRegions.forEach((region) => {
        if (region) {
          // Se la regione è appena stata creata (isNewAnnotation = true),
          // non cambiare il label. Questo previene il cambio accidentale del label
          // quando si preme un tasto numerico subito dopo aver creato l'annotazione.
          if (region.isNewAnnotation) {
            console.log('[Label] Skipping label change for newly created region:', region.id);
            return; // Skip this region
          }

          region.setValue(self.parent);
          region.notifyDrawingFinished();
          region.updateSpans?.();
        }
      });
    },

    setVisible(val) {
      self.visible = val;
    },

    setSelected(value) {
      self.selected = value;
      if (value) {
        self.saveAsLastSelection();
      }
    },

    onHotKey() {
      return self.onLabelInteract();
    },

    onClick() {
      self.onLabelInteract();
      return false;
    },

    onLabelInteract() {
      return self.toggleSelected();
    },

    _updateBackgroundColor(val) {
      if (self.background === Constants.LABEL_BACKGROUND) {
        // Raccogli tutti i colori già usati dalle label esistenti nello stesso gruppo
        const usedColors = new Set();
        let myIndex = 0;

        if (self.parent && self.parent.children) {
          self.parent.children.forEach((label, index) => {
            if (label === self) {
              myIndex = index;
            }
            if (label && label !== self && label.background && label.background !== Constants.LABEL_BACKGROUND) {
              usedColors.add(label.background.toLowerCase());
            }
          });
        }

        console.log(`[Label] Label "${val}" at index ${myIndex}, existing colors:`, Array.from(usedColors));

        // Strategia: usa l'indice della label come base per il seed
        // Questo garantisce che label create in momenti diversi abbiano colori diversi
        let newColor = ColorScheme.make_color({ seed: `${val}_${myIndex}` })[0];
        let attempt = myIndex;
        const maxAttempts = 50;

        // Prova con seed diversi fino a trovare un colore libero
        while (usedColors.has(newColor.toLowerCase()) && attempt < maxAttempts) {
          attempt++;
          newColor = ColorScheme.make_color({ seed: `${val}_${attempt}` })[0];
          console.log(`[Label] Attempt ${attempt}: generated color ${newColor}`);
        }

        // Se dopo maxAttempts non troviamo un colore libero, usa random
        if (usedColors.has(newColor.toLowerCase())) {
          console.log(`[Label] Max attempts reached, using random color`);
          newColor = ColorScheme.make_color({ seed: `random_${Math.random()}` })[0];
        }

        console.log(`[Label] Assigning color ${newColor} to label "${val}"`);
        self.background = newColor;
      }
    },

    afterCreate() {
      self._updateBackgroundColor(self._value || self.value);
      
      // Tenta di ripristinare l'ultima selezione con diversi tentativi
      setTimeout(() => {
        self.tryRestoreLastSelection();
      }, 100);
      
      setTimeout(() => {
        self.tryRestoreLastSelection();
      }, 500);
    },

    updateValue(store) {
      self._value = parseValue(self.value, store.task.dataObj) || Constants.EMPTY_LABEL;
    },
  }));

const LabelModel = types.compose("LabelModel", TagParentMixin, TagAttrs, ProcessAttrsMixin, Model, AnnotationMixin);

const HtxLabelView = inject("store")(
  observer(({ item, store }) => {
    const hotkey =
      (store.settings.enableTooltips || store.settings.enableLabelTooltips) &&
      store.settings.enableHotkeys &&
      item.hotkey;

    const label = (
      <Label
        color={item.background}
        margins
        empty={item.isEmpty}
        hotkey={hotkey}
        hidden={!item.visible}
        selected={item.selected}
        onClick={item.onClick}
      >
        {item.html ? (
          <div title={item._value} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.html) }} />
        ) : (
          item._value
        )}
        {item.showalias === true && item.alias && (
          <span style={Utils.styleToProp(item.aliasstyle)}>&nbsp;{item.alias}</span>
        )}
      </Label>
    );

    return item.hint ? <Tooltip title={item.hint}>{label}</Tooltip> : label;
  }),
);

Registry.addTag("label", LabelModel, HtxLabelView);

export { HtxLabelView, LabelModel };