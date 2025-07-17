// import { observer } from "mobx-react";
// import { types } from "mobx-state-tree";
// import React from "react";

// import LabelMixin from "../../mixins/LabelMixin";
// import Registry from "../../core/Registry";
// import SelectedModelMixin from "../../mixins/SelectedModel";
// import Types from "../../core/Types";
// import { HtxLabels, LabelsModel } from "./Labels/Labels";
// import { RectangleModel } from "./Rectangle";
// import { guidGenerator } from "../../core/Helpers";
// import ControlBase from "./Base";

// /**
//  * The `RectangleLabels` tag creates labeled rectangles. Use to apply labels to bounding box semantic segmentation tasks.
//  *
//  * Use with the following data types: image.
//  *
//  * @example
//  * <!--Basic labeling configuration for applying labels to rectangular bounding boxes on an image -->
//  * <View>
//  *   <RectangleLabels name="labels" toName="image">
//  *     <Label value="Person" />
//  *     <Label value="Animal" />
//  *   </RectangleLabels>
//  *   <Image name="image" value="$image" />
//  * </View>
//  * @name RectangleLabels
//  * @regions RectRegion
//  * @meta_title Rectangle Label Tag to Label Rectangle Bounding Box in Images
//  * @meta_description Customize Label Studio with the RectangleLabels tag and add labeled rectangle bounding boxes in images for semantic segmentation and object detection machine learning and data science projects.
//  * @param {string} name              - Name of the element
//  * @param {string} toName            - Name of the image to label
//  * @param {single|multiple=} [choice=single] - Configure whether you can select one or multiple labels
//  * @param {number} [maxUsages]               - Maximum number of times a label can be used per task
//  * @param {boolean} [showInline=true]        - Show labels in the same visual line
//  * @param {float} [opacity=0.6]      - Opacity of rectangle
//  * @param {string} [fillColor]       - Rectangle fill color in hexadecimal
//  * @param {string} [strokeColor]     - Stroke color in hexadecimal
//  * @param {number} [strokeWidth=1]   - Width of stroke
//  * @param {boolean} [canRotate=true] - Show or hide rotation control. Note that the anchor point in the results is different than the anchor point used when rotating with the rotation tool. For more information, see [Rotation](/templates/image_bbox#Rotation).
//  */

// // Store globale per SAM (sicuro, senza mobx)
// const samStore = {
//   getSamEnabled(name) {
//     try {
//       return localStorage.getItem(`sam_rectangles_${name}`) === 'true';
//     } catch (e) {
//       return false;
//     }
//   },
//   setSamEnabled(name, enabled) {
//     try {
//       if (enabled) {
//         localStorage.setItem(`sam_rectangles_${name}`, 'true');
//       } else {
//         localStorage.removeItem(`sam_rectangles_${name}`);
//       }
//     } catch (e) {
//       // Fallback
//     }
//   }
// };

// const Validation = types.model({
//   controlledTags: Types.unionTag(["Image"]),
// });

// const ModelAttrs = types.model("RectangleLabelsModel", {
//   pid: types.optional(types.string, guidGenerator),
//   type: "rectanglelabels",
//   children: Types.unionArray(["label", "header", "view", "hypertext"]),
// });

// const Composition = types.compose(
//   ControlBase,
//   LabelsModel,
//   ModelAttrs,
//   RectangleModel,
//   Validation,
//   LabelMixin,
//   SelectedModelMixin.props({ _child: "LabelModel" }),
// );

// const RectangleLabelsModel = types.compose("RectangleLabelsModel", Composition);

// // Funzione per attivare SAM Rectangle
// const activateRectangleSam = () => {
//   try {
//     const rectangleSamTool = document.querySelector('button[aria-label="rectangle-tool"].lsf-tool_smart');
//     if (rectangleSamTool) {
//       console.log('Activating Rectangle SAM tool');
//       rectangleSamTool.click();
//       return true;
//     }
//     console.warn('Rectangle SAM tool not found');
//     return false;
//   } catch (error) {
//     console.error('Error activating Rectangle SAM:', error);
//     return false;
//   }
// };

// // Funzione per attivare Rectangle normale (non SAM)
// const activateRectangleNormal = () => {
//   try {
//     // Prova diversi selettori per il tool rectangle normale
//     let rectangleNormalTool = null;
    
//     // Strategia 1: cerca rectangle tool senza .lsf-tool_smart
//     rectangleNormalTool = document.querySelector('button[aria-label="rectangle-tool"]:not(.lsf-tool_smart)');
    
//     if (!rectangleNormalTool) {
//       // Strategia 2: cerca tutti i rectangle tool e prendi quello non SAM
//       const allRectangleTools = document.querySelectorAll('button[aria-label="rectangle-tool"]');
//       for (const tool of allRectangleTools) {
//         if (!tool.classList.contains('lsf-tool_smart')) {
//           rectangleNormalTool = tool;
//           break;
//         }
//       }
//     }
    
//     if (!rectangleNormalTool) {
//       // Strategia 3: cerca nella toolbar principale (non dentro il smart tool)
//       const mainToolbar = document.querySelector('.lsf-toolbar .lsf-toolbar__group');
//       if (mainToolbar) {
//         rectangleNormalTool = mainToolbar.querySelector('button[aria-label="rectangle-tool"]');
//       }
//     }
    
//     if (rectangleNormalTool) {
//       console.log('Activating normal Rectangle tool');
//       console.log('Normal tool element:', rectangleNormalTool);
//       rectangleNormalTool.click();
//       return true;
//     }
    
//     // Debug: mostra tutti i tool rectangle disponibili
//     console.warn('Normal Rectangle tool not found. Available rectangle tools:');
//     const allTools = document.querySelectorAll('button[aria-label="rectangle-tool"]');
//     allTools.forEach((tool, i) => {
//       console.log(`Tool ${i}:`, {
//         classes: tool.className,
//         parent: tool.parentElement?.className,
//         isSmart: tool.classList.contains('lsf-tool_smart')
//       });
//     });
    
//     return false;
//   } catch (error) {
//     console.error('Error activating normal Rectangle tool:', error);
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
//     console.log(`Prediction SAM for Rectangles "${groupName}": ${newState ? 'enabled' : 'disabled'}`);
    
//     // Test immediato senza setTimeout
//     if (newState) {
//       console.log('→ Should activate SAM');
//       activateRectangleSam();
//     } else {
//       console.log('→ Should activate NORMAL');
//       activateRectangleNormal();
//     }
//   };

//   // Listener per i click sulle label - MA SOLO per questo gruppo
//   React.useEffect(() => {
//     const handleLabelClick = (event) => {
//       // Verifica se il click è su una label
//       const labelElement = event.target.closest('.lsf-label');
//       if (!labelElement) return;
      
//       // IMPORTANTE: Verifica che la label appartenga a QUESTO gruppo Rectangle
//       // Trova il container padre che contiene sia le label che la checkbox
//       const rectangleContainer = labelElement.closest('div:has(.lsf-labels)');
//       const samCheckbox = rectangleContainer?.querySelector('input[type="checkbox"]');
//       const samCheckboxLabel = rectangleContainer?.querySelector('label:has(input[type="checkbox"])');
      
//       // Se non trova la checkbox SAM o non contiene "Rectangles", non è questo gruppo
//       if (!samCheckboxLabel || !samCheckboxLabel.textContent.includes('Rectangles')) {
//         return; // Non fare nulla, non è un click su una label di Rectangle
//       }
      
//       console.log('Rectangle label clicked, SAM enabled:', isEnabled);
      
//       // Aspetta che la label sia selezionata e poi attiva il tool appropriato
//       setTimeout(() => {
//         if (isEnabled) {
//           activateRectangleSam();
//         } else {
//           activateRectangleNormal();
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

// const HtxRectangleLabels = observer(({ item }) => {
//   return (
//     <div>
//       <HtxLabels item={item} />
//       <PredictionSamCheckbox groupName={item.name} />
//     </div>
//   );
// });

// Registry.addTag("rectanglelabels", RectangleLabelsModel, HtxRectangleLabels);

// export { HtxRectangleLabels, RectangleLabelsModel };

import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { HtxLabels, LabelsModel } from "./Labels/Labels";
import { RectangleModel } from "./Rectangle";
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";

/**
 * The `RectangleLabels` tag creates labeled rectangles. Use to apply labels to bounding box semantic segmentation tasks.
 *
 * Use with the following data types: image.
 *
 * @example
 * <!--Basic labeling configuration for applying labels to rectangular bounding boxes on an image -->
 * <View>
 *   <RectangleLabels name="labels" toName="image">
 *     <Label value="Person" />
 *     <Label value="Animal" />
 *   </RectangleLabels>
 *   <Image name="image" value="$image" />
 * </View>
 * @name RectangleLabels
 * @regions RectRegion
 * @meta_title Rectangle Label Tag to Label Rectangle Bounding Box in Images
 * @meta_description Customize Label Studio with the RectangleLabels tag and add labeled rectangle bounding boxes in images for semantic segmentation and object detection machine learning and data science projects.
 * @param {string} name              - Name of the element
 * @param {string} toName            - Name of the image to label
 * @param {single|multiple=} [choice=single] - Configure whether you can select one or multiple labels
 * @param {number} [maxUsages]               - Maximum number of times a label can be used per task
 * @param {boolean} [showInline=true]        - Show labels in the same visual line
 * @param {float} [opacity=0.6]      - Opacity of rectangle
 * @param {string} [fillColor]       - Rectangle fill color in hexadecimal
 * @param {string} [strokeColor]     - Stroke color in hexadecimal
 * @param {number} [strokeWidth=1]   - Width of stroke
 * @param {boolean} [canRotate=true] - Show or hide rotation control. Note that the anchor point in the results is different than the anchor point used when rotating with the rotation tool. For more information, see [Rotation](/templates/image_bbox#Rotation).
 */

const Validation = types.model({
  controlledTags: Types.unionTag(["Image"]),
});

const ModelAttrs = types.model("RectangleLabelsModel", {
  pid: types.optional(types.string, guidGenerator),
  type: "rectanglelabels",
  children: Types.unionArray(["label", "header", "view", "hypertext"]),
});

const Composition = types.compose(
  ControlBase,
  LabelsModel,
  ModelAttrs,
  RectangleModel,
  Validation,
  LabelMixin,
  SelectedModelMixin.props({ _child: "LabelModel" }),
);

const RectangleLabelsModel = types.compose("RectangleLabelsModel", Composition);

const HtxRectangleLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag("rectanglelabels", RectangleLabelsModel, HtxRectangleLabels);

export { HtxRectangleLabels, RectangleLabelsModel };
