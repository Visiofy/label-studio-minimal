import { observer } from "mobx-react";
import { types } from "mobx-state-tree";
import React from "react";

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
      console.log('Activating KeyPoint SAM tool');
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
    
    console.log(`📋 Found ${allLabels.length} total labels in interface:`, 
                allLabels.map((label, index) => ({
                  index: index + 1,
                  text: label.textContent?.trim(),
                  isKeyPoint: label.closest('[class*="keypoint"]') !== null,
                  group: label.closest('[class*="labels"]')?.className || 'unknown'
                })));
    
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
    
    console.log(`🔍 Checking if label "${label.textContent?.trim()}" is KeyPoint:`, {
      isInOurContainer,
      isKeyPointByContext,
      result: isInOurContainer || isKeyPointByContext
    });
    
    return isInOurContainer || isKeyPointByContext;
  };

  // Funzione di attivazione SAM
  const activateKeypointSam = React.useCallback(async () => {
    console.log('🚀 Activating KeyPoint SAM...');
    
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
          console.log(`✅ Found SAM tool: ${selector}`);
          
          const isActive = samTool.classList.contains('lsf-tool_active') || 
                          samTool.getAttribute('aria-pressed') === 'true';
          
          if (isActive) {
            console.log('✅ SAM tool already active');
            return true;
          }
          
          console.log('🔄 Clicking SAM tool...');
          samTool.click();
          
          setTimeout(() => {
            const nowActive = samTool.classList.contains('lsf-tool_active') || 
                             samTool.getAttribute('aria-pressed') === 'true';
            console.log(nowActive ? '✅ SAM activated!' : '❌ SAM activation failed');
          }, 100);
          
          return true;
        }
      } catch (e) {
        console.log(`❌ Selector failed: ${selector}`);
      }
    }
    
    console.warn('❌ No SAM tool found');
    return false;
  }, []);

  // Event listener per keybinding GLOBALI
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key >= '1' && event.key <= '9' && 
          !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
        
        const keyNumber = parseInt(event.key);
        console.log(`🎯 Global keybinding ${keyNumber} pressed`);
        
        // Trova tutte le label nell'interfaccia
        const allLabels = getAllLabelsInOrder();
        
        if (keyNumber > allLabels.length) {
          console.log(`❌ Keybinding ${keyNumber} out of range (${allLabels.length} total labels)`);
          return;
        }
        
        const targetLabel = allLabels[keyNumber - 1];
        
        if (!targetLabel) {
          console.log(`❌ No label found for keybinding ${keyNumber}`);
          return;
        }
        
        console.log(`📍 Keybinding ${keyNumber} targets label: "${targetLabel.textContent?.trim()}"`);
        
        // Verifica se questa label appartiene al gruppo KeyPoint
        if (isKeyPointLabel(targetLabel)) {
          console.log(`✅ This is a KeyPoint label! Will activate SAM when selected.`);
          
          // Monitora quando questa label viene selezionata
          const checkSelectionAndActivate = (attempt = 1, maxAttempts = 5) => {
            const isSelected = targetLabel.classList.contains('lsf-label_selected');
            
            console.log(`🔍 Check ${attempt}/${maxAttempts}: Label selected = ${isSelected}`);
            
            if (isSelected) {
              console.log(`🎉 KeyPoint label "${targetLabel.textContent?.trim()}" is now selected!`);
              console.log(`🚀 Activating SAM for KeyPoint group: ${item.name}`);
              
              // Attiva SAM con un piccolo delay per sicurezza
              setTimeout(() => {
                activateKeypointSam();
              }, 150);
              
              return true;
            }
            
            if (attempt < maxAttempts) {
              const delay = 50 * attempt; // Delay progressivo
              console.log(`⏳ Label not selected yet, retrying in ${delay}ms...`);
              setTimeout(() => {
                checkSelectionAndActivate(attempt + 1, maxAttempts);
              }, delay);
            } else {
              console.log(`⚠️ Label never got selected after ${maxAttempts} attempts`);
              // Prova comunque ad attivare SAM nel caso sia un timing issue
              console.log(`🔄 Attempting SAM activation anyway...`);
              activateKeypointSam();
            }
            
            return false;
          };
          
          // Inizia il controllo
          checkSelectionAndActivate();
          
        } else {
          console.log(`ℹ️ Not a KeyPoint label (belongs to different group), ignoring.`);
        }
      }
    };

    console.log(`🎧 KeyPoint group "${item.name}" listening for global keybindings...`);
    document.addEventListener('keydown', handleKeyDown, { passive: true });

    return () => {
      console.log(`🔇 KeyPoint group "${item.name}" stopped listening for keybindings`);
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
      
      console.log(`🖱️ Direct click on KeyPoint label: "${labelElement.textContent?.trim()}"`);
      console.log(`🚀 Activating SAM for group: ${item.name}`);
      
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
          console.log('=== ALL LABELS DEBUG ===');
          allLabels.forEach((label, index) => {
            console.log(`${index + 1}: "${label.textContent?.trim()}" - KeyPoint: ${isKeyPointLabel(label)}`);
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
  return <SamKeyPointLabels item={item} />;
});

Registry.addTag("keypointlabels", KeyPointLabelsModel, HtxKeyPointLabels);

export { HtxKeyPointLabels, KeyPointLabelsModel };