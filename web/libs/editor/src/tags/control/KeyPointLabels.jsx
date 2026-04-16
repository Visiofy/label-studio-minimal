import { observer } from "mobx-react";
import { types } from "mobx-state-tree";
import React from "react";
import { isAlive } from "mobx-state-tree";

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

// Funzione per attivare sempre SAM KeyPoint
const activateKeypointSam = () => {
  try {
    const keypointSamTool = document.querySelector('button[aria-label="key-point-tool"].lsf-tool_smart');
    if (keypointSamTool) {
      keypointSamTool.click();
      return true;
    }
    console.warn('KeyPoint SAM tool not found');
    return false;
  } catch (error) {
    console.error('Error activating KeyPoint SAM:', error);
    return false;
  }
};

// Componente KeyPointLabels che attiva sempre SAM
// ==========================================
// FIX COMPLETO per KeyPointLabels.js
// ==========================================

const SamKeyPointLabels = ({ item }) => {
  const containerRef = React.useRef(null);
  const activationTimeoutRef = React.useRef(null);

  // Funzione per trovare tutte le label nell'interfaccia (globali)
  const getAllLabelsInOrder = () => {
    // Trova tutti i gruppi di label nell'ordine in cui appaiono nel DOM
    const allLabelGroups = document.querySelectorAll('[class*="labels"], .lsf-labels');
    const allLabels = [];
    
    allLabelGroups.forEach(group => {
      const labelsInGroup = group.querySelectorAll('.lsf-label');
      labelsInGroup.forEach(label => allLabels.push(label));
    });
    
    // Se non troviamo gruppi, cerca tutte le label direttamente
    if (allLabels.length === 0) {
      const directLabels = document.querySelectorAll('.lsf-label');
      directLabels.forEach(label => allLabels.push(label));
    }

    return allLabels;
  };

  // Funzione per verificare se una label appartiene al gruppo KeyPoint
  const isKeyPointLabel = (label) => {
    const ourContainer = containerRef.current;
    if (!ourContainer) return false;
    
    // Verifica se la label è nel nostro container
    const isInOurContainer = ourContainer.contains(label);
    
    // Verifica anche tramite attributi o classi del parent
    const isKeyPointByContext = label.closest('[class*="keypoint"]') !== null ||
                               label.closest('[data-type*="keypoint"]') !== null;

    return isInOurContainer || isKeyPointByContext;
  };

  // Funzione di attivazione SAM
  const activateKeypointSam = React.useCallback(async () => {
    
    const samSelectors = [
      'button[aria-label="key-point-tool"].lsf-tool_smart',
      'button.lsf-tool_smart[aria-label*="key-point"]',
      'button.lsf-tool_smart[aria-label*="keypoint"]',
      '.lsf-tool_smart:has([aria-label*="key-point"])',
      'button[data-tool*="keypoint"].lsf-tool_smart',
      '.lsf-tool.lsf-tool_smart[aria-label*="KeyPoint"]'
    ];
    
    for (const selector of samSelectors) {
      try {
        const samTool = document.querySelector(selector);
        if (samTool) {
          
          const isActive = samTool.classList.contains('lsf-tool_active') || 
                          samTool.getAttribute('aria-pressed') === 'true';
          
          if (isActive) {
            return true;
          }
          
          samTool.click();
          
          setTimeout(() => {
            const nowActive = samTool.classList.contains('lsf-tool_active') || 
                             samTool.getAttribute('aria-pressed') === 'true';
          }, 100);
          
          return true;
        }
      } catch (e) {
      }
    }
    
    console.warn('❌ No SAM tool found');
    return false;
  }, []);

  // Event listener per keybinding GLOBALI
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if user is typing in an input field or textarea
      const activeElement = document.activeElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      );

      // If user is typing, don't intercept the key
      if (isTyping) {
        return;
      }

      if (event.key >= '1' && event.key <= '9' && 
          !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
        
        const keyNumber = parseInt(event.key);
        
        // Trova tutte le label nell'interfaccia
        const allLabels = getAllLabelsInOrder();
        
        if (keyNumber > allLabels.length) {
          return;
        }
        
        const targetLabel = allLabels[keyNumber - 1];
        
        if (!targetLabel) {
          return;
        }
        
        
        // Verifica se questa label appartiene al gruppo KeyPoint
        if (isKeyPointLabel(targetLabel)) {
          
          // Monitora quando questa label viene selezionata
          const checkSelectionAndActivate = (attempt = 1, maxAttempts = 5) => {
            const isSelected = targetLabel.classList.contains('lsf-label_selected');
            
            
            if (isSelected) {
              
              // Attiva SAM con un piccolo delay per sicurezza
              setTimeout(() => {
                activateKeypointSam();
              }, 150);
              
              return true;
            }
            
            if (attempt < maxAttempts) {
              const delay = 50 * attempt; // Delay progressivo
              setTimeout(() => {
                checkSelectionAndActivate(attempt + 1, maxAttempts);
              }, delay);
            } else {
              // Prova comunque ad attivare SAM nel caso sia un timing issue
              activateKeypointSam();
            }
            
            return false;
          };
          
          // Inizia il controllo
          checkSelectionAndActivate();
          
        } else {
        }
      }
    };

    const groupName = item.name; // Store name to avoid accessing destroyed object
    document.addEventListener('keydown', handleKeyDown, { passive: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [item.name, activateKeypointSam]);

  // Listener per i click diretti sulle nostre label
  React.useEffect(() => {
    const handleLabelClick = (event) => {
      const labelElement = event.target.closest('.lsf-label');
      if (!labelElement) return;
      
      const ourContainer = containerRef.current;
      if (!ourContainer || !ourContainer.contains(labelElement)) {
        return;
      }
      
      
      setTimeout(() => {
        activateKeypointSam();
      }, 100);
    };

    document.addEventListener('click', handleLabelClick, true);

    return () => {
      document.removeEventListener('click', handleLabelClick, true);
    };
  }, [item.name, activateKeypointSam]);

  // Debug helper component (rimuovi in produzione)
  const DebugHelper = () => (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      zIndex: 9999,
      backgroundColor: '#333',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <div><strong>KeyPoint Group:</strong> {item.name}</div>
      <div><strong>Our Labels:</strong> {containerRef.current?.querySelectorAll('.lsf-label').length || 0}</div>
      <button 
        onClick={() => {
          const allLabels = getAllLabelsInOrder();
          allLabels.forEach((label, index) => {
          });
        }}
        style={{ marginTop: '5px', fontSize: '10px' }}
      >
        Debug All Labels
      </button>
      <button 
        onClick={activateKeypointSam}
        style={{ marginTop: '5px', marginLeft: '5px', fontSize: '10px' }}
      >
        Test SAM
      </button>
    </div>
  );

  return (
    <div ref={containerRef}>
      <HtxLabels item={item} />
      {process.env.NODE_ENV === 'development' && <DebugHelper />}
    </div>
  );
};

const HtxKeyPointLabels = observer(({ item }) => {
  // Hide native KeyPointLabels component - custom menu handles this
  return null;
});

Registry.addTag("keypointlabels", KeyPointLabelsModel, HtxKeyPointLabels);

export { HtxKeyPointLabels, KeyPointLabelsModel };