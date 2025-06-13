import { observer } from "mobx-react";
import { types } from "mobx-state-tree";
import { useEffect, useRef } from "react";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { HtxLabels, LabelsModel } from "./Labels/Labels";
import { KeyPointModel } from "./KeyPoint";
import ControlBase from "./Base";

/**
 * The `KeyPointLabels` tag creates labeled keypoints. Use to apply labels to identified key points, such as identifying facial features for a facial recognition labeling project.
 *
 * Use with the following data types: image.
 * @example
 * <!--Basic keypoint image labeling configuration for multiple regions-->
 * <View>
 *   <KeyPointLabels name="kp-1" toName="img-1">
 *     <Label value="Face" />
 *     <Label value="Nose" />
 *   </KeyPointLabels>
 *   <Image name="img-1" value="$img" />
 * </View>
 * @name KeyPointLabels
 * @regions KeyPointRegion
 * @meta_title Keypoint Label Tag for Labeling Keypoints
 * @meta_description Customize Label Studio with the KeyPointLabels tag to label keypoints for computer vision machine learning and data science projects.
 * @param {string} name                  - Name of the element
 * @param {string} toName                - Name of the image to label
 * @param {single|multiple=} [choice=single] - Configure whether you can select one or multiple labels
 * @param {number} [maxUsages]           - Maximum number of times a label can be used per task
 * @param {boolean} [showInline=true]    - Show labels in the same visual line
 * @param {float=} [opacity=0.9]         - Opacity of the keypoint
 * @param {number=} [strokeWidth=1]      - Width of the stroke
 * @param {pixel|none} [snap=none]       - Snap keypoint to image pixels
 *
 */

const Validation = types.model({
  controlledTags: Types.unionTag(["Image"]),
});

const ModelAttrs = types
  .model("KeyPointLabelsModel", {
    type: "keypointlabels",
    children: Types.unionArray(["label", "header", "view", "hypertext"]),
  })
  .views((self) => ({
    get hasStates() {
      const states = self.states();
      return states && states.length > 0;
    },

    get hasLabels() {
      return self.children && self.children.some(child => child.type === 'label');
    },

    get isReady() {
      // Verifica che il componente sia pronto per la selezione
      return self.children && self.children.length > 0 && self.annotation;
    },
  }))
  .volatile(() => ({
    _selectionInitialized: false,
  }))
  .actions((self) => ({
    afterCreate() {
      // Non fare nulla qui - la selezione verrà gestita nel componente React
    },
    
    initializeSelection() {
      // Previeni inizializzazioni multiple
      if (self._selectionInitialized) return;
      
      // Verifica che ci siano label disponibili
      if (!self.hasLabels) return;
      
      // Se c'è già una selezione, non fare nulla
      if (self.selectedLabels && self.selectedLabels.length > 0) {
        self._selectionInitialized = true;
        return;
      }

      const storageKey = `keypointlabel_last_selected_${self.name}`;
      const lastSelectedValue = localStorage.getItem(storageKey);
      
      let labelToSelect = null;
      
      // Prova a trovare l'ultima label selezionata
      if (lastSelectedValue) {
        labelToSelect = self.children.find(child => 
          child.type === 'label' && child.value === lastSelectedValue
        );
      }
      
      // Se non trovata, prendi la prima disponibile
      if (!labelToSelect) {
        labelToSelect = self.children.find(child => child.type === 'label');
      }
      
      // Seleziona la label
      if (labelToSelect && labelToSelect.setSelected) {
        labelToSelect.setSelected(true);
        self._selectionInitialized = true;
      }
    },

    resetSelectionState() {
      self._selectionInitialized = false;
    },
    
    onLabelSelected(labelValue) {
      const storageKey = `keypointlabel_last_selected_${self.name}`;
      localStorage.setItem(storageKey, labelValue);
    },
  }));

const Composition = types.compose(
  ControlBase,
  LabelsModel,
  ModelAttrs,
  KeyPointModel,
  Validation,
  LabelMixin,
  SelectedModelMixin.props({ _child: "LabelModel" }),
);

const KeyPointLabelsModel = types.compose("KeyPointLabelsModel", Composition);

const HtxKeyPointLabels = observer(({ item }) => {
  const initializationAttempted = useRef(false);
  const lastTaskId = useRef(null);

  useEffect(() => {
    const currentTaskId = item.annotation?.task?.id;
    
    // Reset quando cambia il task
    if (currentTaskId !== lastTaskId.current) {
      initializationAttempted.current = false;
      lastTaskId.current = currentTaskId;
      if (item.resetSelectionState) {
        item.resetSelectionState();
      }
    }

    // Esci se non siamo pronti
    if (!item.isReady) return;

    // Esci se abbiamo già tentato l'inizializzazione per questo task
    if (initializationAttempted.current) return;

    // Funzione per tentare l'inizializzazione
    const attemptInitialization = () => {
      if (!item.selectedLabels || item.selectedLabels.length === 0) {
        if (item.initializeSelection) {
          item.initializeSelection();
          initializationAttempted.current = true;
          return true;
        }
      } else {
        // Se c'è già una selezione, marca come completato
        initializationAttempted.current = true;
        return true;
      }
      return false;
    };

    // Primo tentativo immediato
    if (attemptInitialization()) return;

    // Se fallisce, usa un singolo retry con breve delay
    const retryTimeout = setTimeout(() => {
      attemptInitialization();
    }, 50);

    return () => clearTimeout(retryTimeout);
  }, [item, item.isReady, item.annotation?.task?.id]);

  // Salva la selezione quando cambia
  useEffect(() => {
    if (item.selectedLabels && item.selectedLabels.length > 0) {
      const selectedLabel = item.selectedLabels[0];
      if (selectedLabel && selectedLabel.value && item.onLabelSelected) {
        item.onLabelSelected(selectedLabel.value);
      }
    }
  }, [item.selectedLabels, item]);

  return <HtxLabels item={item} />;
});

Registry.addTag("keypointlabels", KeyPointLabelsModel, HtxKeyPointLabels);

export { HtxKeyPointLabels, KeyPointLabelsModel };