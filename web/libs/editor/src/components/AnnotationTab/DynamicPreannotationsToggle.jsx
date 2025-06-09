// import { inject, observer } from "mobx-react";
// import { useEffect } from "react";
// import { Space } from "../../common/Space/Space";
// import { Toggle } from "@humansignal/ui";
// import ToolsManager from "../../tools/Manager";
// import { Block, Elem } from "../../utils/bem";
// import "./DynamicPreannotationsToggle.scss";

// export const DynamicPreannotationsToggle = inject("store")(
//   observer(({ store }) => {
//     // const enabled = store.hasInterface("auto-annotation") && !store.forceAutoAnnotation;
//       const enabled = true;
//     useEffect(() => {
//       if (!enabled) store.setAutoAnnotation(false);
//     }, [enabled]);

//     return enabled ? (
//       <Block name="dynamic-preannotations">
//         <Elem name="wrapper">
//           <Space spread>
//             <Toggle
//               checked={store.autoAnnotation}
//               onChange={(e) => {
//                 const checked = e.target.checked;

//                 store.setAutoAnnotation(checked);

//                 if (!checked) {
//                   ToolsManager.allInstances().forEach((inst) => inst.selectDefault());
//                 }
//               }}
//               label="Auto-Annotation"
//             />
//           </Space>
//         </Elem>
//       </Block>
//     ) : null;
//   }),
// );
import { inject, observer } from "mobx-react";
import { useEffect } from "react";
import { Space } from "../../common/Space/Space";
import { Toggle } from "@humansignal/ui";
import ToolsManager from "../../tools/Manager";
import { Block, Elem } from "../../utils/bem";
import "./DynamicPreannotationsToggle.scss";

export const DynamicPreannotationsToggle = inject("store")(
  observer(({ store }) => {
    const enabled = true;
    
    useEffect(() => {
      // ✅ INIZIA SEMPRE ATTIVO (ma può essere disattivato)
      if (!store.autoAnnotation) {
        store.setAutoAnnotation(true);
      }
    }, [enabled]);

    return enabled ? (
      <Block name="dynamic-preannotations">
        <Elem name="wrapper">
          <Space spread>
            <Toggle
              checked={store.autoAnnotation}  // ✅ USA LO STATO REALE
              onChange={(e) => {
                const checked = e.target.checked;
                
                // ✅ NESSUNA CONFERMA - CAMBIO DIRETTO
                store.setAutoAnnotation(checked);

                if (!checked) {
                  ToolsManager.allInstances().forEach((inst) => inst.selectDefault());
                }
              }}
              label="Auto-Annotation"
            />
          </Space>
        </Elem>
      </Block>
    ) : null;
  }),
);