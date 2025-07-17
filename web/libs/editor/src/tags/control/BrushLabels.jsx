// import React from "react";
// import { observer } from "mobx-react";
// import { types } from "mobx-state-tree";

// import LabelMixin from "../../mixins/LabelMixin";
// import Registry from "../../core/Registry";
// import SelectedModelMixin from "../../mixins/SelectedModel";
// import Types from "../../core/Types";
// import { BrushModel } from "./Brush";
// import { HtxLabels, LabelsModel } from "./Labels/Labels";
// import ControlBase from "./Base";

// /**
//  * The `BrushLabels` tag for image segmentation tasks is used in the area where you want to apply a mask or use a brush to draw a region on the image.
//  *
//  * Use with the following data types: image.
//  * @example
//  * <!--Basic image segmentation labeling configuration-->
//  * <View>
//  *   <BrushLabels name="labels" toName="image">
//  *     <Label value="Person" />
//  *     <Label value="Animal" />
//  *   </BrushLabels>
//  *   <Image name="image" value="$image" />
//  * </View>
//  * @name BrushLabels
//  * @regions BrushRegion
//  * @meta_title Brush Label Tag for Image Segmentation Labeling
//  * @meta_description Customize Label Studio with brush label tags for image segmentation labeling for machine learning and data science projects.
//  * @param {string} name                      - Name of the element
//  * @param {string} toName                    - Name of the image to label
//  * @param {single|multiple=} [choice=single] - Configure whether the data labeler can select one or multiple labels
//  * @param {number} [maxUsages]               - Maximum number of times a label can be used per task
//  * @param {boolean} [showInline=true]        - Show labels in the same visual line
//  */

// // Store globale per SAM (sicuro, senza mobx)
// const samStore = {
//   getSamEnabled(name) {
//     try {
//       return localStorage.getItem(`sam_brush_${name}`) === 'true';
//     } catch (e) {
//       return false;
//     }
//   },
//   setSamEnabled(name, enabled) {
//     try {
//       if (enabled) {
//         localStorage.setItem(`sam_brush_${name}`, 'true');
//       } else {
//         localStorage.removeItem(`sam_brush_${name}`);
//       }
//     } catch (e) {
//       // Fallback
//     }
//   }
// };

// const Validation = types.model({
//   controlledTags: Types.unionTag(["Image"]),
// });

// const ModelAttrs = types.model("BrushLabelsModel", {
//   type: "brushlabels",
//   children: Types.unionArray(["label", "header", "view", "hypertext"]),
// });

// const BrushLabelsModel = types.compose(
//   "BrushLabelsModel",
//   ControlBase,
//   LabelsModel,
//   ModelAttrs,
//   BrushModel,
//   Validation,
//   LabelMixin,
//   SelectedModelMixin.props({ _child: "LabelModel" }),
// );

// // Funzione per attivare SAM Brush
// const activateBrushSam = () => {
//   try {
//     const brushSamTool = document.querySelector('button[aria-label="brush-tool"].lsf-tool_smart');
//     if (brushSamTool) {
//       console.log('Activating Brush SAM tool');
//       brushSamTool.click();
//       return true;
//     }
//     console.warn('Brush SAM tool not found');
//     return false;
//   } catch (error) {
//     console.error('Error activating Brush SAM:', error);
//     return false;
//   }
// };

// // Funzione per attivare Brush normale (non SAM)
// const activateBrushNormal = () => {
//   try {
//     // Prova diversi selettori per il tool brush normale
//     let brushNormalTool = null;
    
//     // Strategia 1: cerca brush tool senza .lsf-tool_smart
//     brushNormalTool = document.querySelector('button[aria-label="brush-tool"]:not(.lsf-tool_smart)');
    
//     if (!brushNormalTool) {
//       // Strategia 2: cerca tutti i brush tool e prendi quello non SAM
//       const allBrushTools = document.querySelectorAll('button[aria-label="brush-tool"]');
//       for (const tool of allBrushTools) {
//         if (!tool.classList.contains('lsf-tool_smart')) {
//           brushNormalTool = tool;
//           break;
//         }
//       }
//     }
    
//     if (!brushNormalTool) {
//       // Strategia 3: cerca nella toolbar principale (non dentro il smart tool)
//       const mainToolbar = document.querySelector('.lsf-toolbar .lsf-toolbar__group');
//       if (mainToolbar) {
//         brushNormalTool = mainToolbar.querySelector('button[aria-label="brush-tool"]');
//       }
//     }
    
//     if (brushNormalTool) {
//       console.log('Activating normal Brush tool');
//       console.log('Normal tool element:', brushNormalTool);
//       brushNormalTool.click();
//       return true;
//     }
    
//     // Debug: mostra tutti i tool brush disponibili
//     console.warn('Normal Brush tool not found. Available brush tools:');
//     const allTools = document.querySelectorAll('button[aria-label="brush-tool"]');
//     allTools.forEach((tool, i) => {
//       console.log(`Tool ${i}:`, {
//         classes: tool.className,
//         parent: tool.parentElement?.className,
//         isSmart: tool.classList.contains('lsf-tool_smart')
//       });
//     });
    
//     return false;
//   } catch (error) {
//     console.error('Error activating normal Brush tool:', error);
//     return false;
//   }
// };

// // Checkbox semplice per SAM
// const PredictionSamCheckbox = ({ groupName }) => {
//   const [isEnabled, setIsEnabled] = React.useState(samStore.getSamEnabled(groupName));

//   const toggleSam = () => {
//     console.log('=== TOGGLE SAM CALLED ==='); // Debug principale
//     const newState = !isEnabled;
//     console.log(`Current: ${isEnabled}, New: ${newState}`); // Debug stati
    
//     setIsEnabled(newState);
//     samStore.setSamEnabled(groupName, newState);
//     console.log(`Prediction SAM for Brush "${groupName}": ${newState ? 'enabled' : 'disabled'}`);
    
//     // Test immediato senza setTimeout
//     if (newState) {
//       console.log('→ Should activate SAM');
//       activateBrushSam();
//     } else {
//       console.log('→ Should activate NORMAL');
//       activateBrushNormal();
//     }
//   };

//   // Listener per i click sulle label - MA SOLO per questo gruppo
//   React.useEffect(() => {
//     const handleLabelClick = (event) => {
//       // Verifica se il click è su una label
//       const labelElement = event.target.closest('.lsf-label');
//       if (!labelElement) return;
      
//       // IMPORTANTE: Verifica che la label appartenga a QUESTO gruppo Brush
//       // Trova il container padre che contiene sia le label che la checkbox
//       const brushContainer = labelElement.closest('div:has(.lsf-labels)');
//       const samCheckbox = brushContainer?.querySelector('input[type="checkbox"]');
//       const samCheckboxLabel = brushContainer?.querySelector('label:has(input[type="checkbox"])');
      
//       // Se non trova la checkbox SAM o non contiene "Brush", non è questo gruppo
//       if (!samCheckboxLabel || !samCheckboxLabel.textContent.includes('Brush')) {
//         return; // Non fare nulla, non è un click su una label di Brush
//       }
      
//       console.log('Brush label clicked, SAM enabled:', isEnabled);
      
//       // Aspetta che la label sia selezionata e poi attiva il tool appropriato
//       setTimeout(() => {
//         if (isEnabled) {
//           activateBrushSam();
//         } else {
//           activateBrushNormal();
//         }
//       }, 200);
//     };

//     // Aggiungi listener globale per click
//     document.addEventListener('click', handleLabelClick);

//     return () => {
//       document.removeEventListener('click', handleLabelClick);
//     };
//   }, [isEnabled, groupName]); // Dipende anche da groupName

//   return (
//     <div style={{ 
//       marginTop: '8px',
//       padding: '4px 8px',
//       backgroundColor: '#f8f9fa',
//       borderRadius: '4px',
//       border: '1px solid #e9ecef'
//     }}>
//       <label style={{ 
//         display: 'flex', 
//         alignItems: 'center', 
//         fontSize: '13px', 
//         cursor: 'pointer',
//         fontWeight: '500',
//         margin: 0
//       }}>
//         <input
//           type="checkbox"
//           checked={isEnabled}
//           onChange={toggleSam}
//           style={{ 
//             marginRight: '6px',
//             cursor: 'pointer'
//           }}
//         />
//          Prediction SAM
//         {isEnabled && (
//           <span style={{ 
//             marginLeft: '8px',
//             fontSize: '11px', 
//             color: '#28a745',
//             fontWeight: '500'
//           }}>
//             ✓ Attivo
//           </span>
//         )}
//       </label>
//     </div>
//   );
// };

// const HtxBrushLabels = observer(({ item }) => {
//   return (
//     <div>
//       <HtxLabels item={item} />
//       <PredictionSamCheckbox groupName={item.name} />
//     </div>
//   );
// });

// Registry.addTag("brushlabels", BrushLabelsModel, HtxBrushLabels);

// export { HtxBrushLabels, BrushLabelsModel };

import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { BrushModel } from "./Brush";
import { HtxLabels, LabelsModel } from "./Labels/Labels";
import ControlBase from "./Base";

/**
 * The `BrushLabels` tag for image segmentation tasks is used in the area where you want to apply a mask or use a brush to draw a region on the image.
 *
 * Use with the following data types: image.
 * @example
 * <!--Basic image segmentation labeling configuration-->
 * <View>
 *   <BrushLabels name="labels" toName="image">
 *     <Label value="Person" />
 *     <Label value="Animal" />
 *   </BrushLabels>
 *   <Image name="image" value="$image" />
 * </View>
 * @name BrushLabels
 * @regions BrushRegion
 * @meta_title Brush Label Tag for Image Segmentation Labeling
 * @meta_description Customize Label Studio with brush label tags for image segmentation labeling for machine learning and data science projects.
 * @param {string} name                      - Name of the element
 * @param {string} toName                    - Name of the image to label
 * @param {single|multiple=} [choice=single] - Configure whether the data labeler can select one or multiple labels
 * @param {number} [maxUsages]               - Maximum number of times a label can be used per task
 * @param {boolean} [showInline=true]        - Show labels in the same visual line
 */

const Validation = types.model({
  controlledTags: Types.unionTag(["Image"]),
});

const ModelAttrs = types.model("BrushLabelsModel", {
  type: "brushlabels",
  children: Types.unionArray(["label", "header", "view", "hypertext"]),
});

const BrushLabelsModel = types.compose(
  "BrushLabelsModel",
  ControlBase,
  LabelsModel,
  ModelAttrs,
  BrushModel,
  Validation,
  LabelMixin,
  SelectedModelMixin.props({ _child: "LabelModel" }),
);

const HtxBrushLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag("brushlabels", BrushLabelsModel, HtxBrushLabels);

export { HtxBrushLabels, BrushLabelsModel };
