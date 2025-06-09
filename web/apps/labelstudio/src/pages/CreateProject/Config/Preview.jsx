// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { Spinner } from "../../../components";
// import { cn } from "../../../utils/bem";
// import "./Config.scss";
// import { EMPTY_CONFIG } from "./Template";
// import { API_CONFIG } from "../../../config/ApiConfig";
// import { useAPI } from "../../../providers/ApiProvider";

// const configClass = cn("configure");

// // Lazy load Label Studio with a single promise to avoid multiple loads
// // and enable as early as possible to load the dependencies once this component is mounted for the first time
// let dependencies;
// const loadDependencies = async () => {
//   if (!dependencies) {
//     dependencies = import("@humansignal/editor");
//   }
//   return dependencies;
// };

// export const Preview = ({ config, data, error, loading, project }) => {
//   // @see comment about dependencies above
//   loadDependencies();

//   const [storeReady, setStoreReady] = useState(false);
//   const lsf = useRef(null);
//   const rootRef = useRef();
//   const api = useAPI();
//   const projectRef = useRef(project);
//   projectRef.current = project;

//   const currentTask = useMemo(() => {
//     return {
//       id: 1,
//       annotations: [],
//       predictions: [],
//       data,
//     };
//   }, [data]);

//   /**
//    * Proxy urls to presign them if storage is connected
//    * @param {*} _ LS instance
//    * @param {string} url http/https are not proxied and returned as is
//    */
//   const onPresignUrlForProject = async (_, url) => {
//     const parsedUrl = new URL(url);

//     // return same url if http(s)
//     if (["http:", "https:"].includes(parsedUrl.protocol)) return url;

//     const projectId = projectRef.current.id;

//     const fileuri = btoa(url);

//     return api.api.createUrl(API_CONFIG.endpoints.presignUrlForProject, { projectId, fileuri }).url;
//   };

//   const currentConfig = useMemo(() => {
//     // empty string causes error in LSF
//     return config ?? EMPTY_CONFIG;
//   }, [config]);

//   const initLabelStudio = useCallback(async (config, task) => {
//     // wait for dependencies to load, the promise is resolved only once
//     // and is started when the component is mounted for the first time
//     await loadDependencies();

//     if (lsf.current || !task.data) return;

//     try {
//       lsf.current = new window.LabelStudio(rootRef.current, {
//         config,
//         task,
//         interfaces: [], // Rimuovo "side-column" per nascondere il panel
//         // with SharedStore we should use more late event
//         onStorageInitialized(LS) {
//           // Disabilito esplicitamente tutti i pannelli
//           LS.settings.bottomSidePanel = false;
//           LS.settings.sidebarEnabled = false;
//           LS.settings.showLabels = false;
//           LS.settings.showLineNumbers = false;
          
//           // Nascondo gli elementi del DOM se presenti
//           setTimeout(() => {
//             const sidePanel = document.querySelector('.lsf-sidebar');
//             const bottomPanel = document.querySelector('.lsf-bottombar');
//             const outliner = document.querySelector('.lsf-outliner');
            
//             if (sidePanel) sidePanel.style.display = 'none';
//             if (bottomPanel) bottomPanel.style.display = 'none';
//             if (outliner) outliner.style.display = 'none';
//           }, 100);

//           const initAnnotation = () => {
//             const as = LS.annotationStore;
//             const c = as.createAnnotation();

//             as.selectAnnotation(c.id);
//             setStoreReady(true);
//           };

//           // and even then we need to wait a little even after the store is initialized
//           setTimeout(initAnnotation);
//         },
//       });

//       lsf.current.on("presignUrlForProject", onPresignUrlForProject);
//     } catch (err) {
//       console.error(err);
//     }
//   }, []);

//   useEffect(() => {
//     const opacity = loading || error ? 0.6 : 1;
//     // to avoid rerenders and data loss we do it this way

//     document.getElementById("label-studio").style.opacity = opacity;
//   }, [loading, error]);

//   useEffect(() => {
//     initLabelStudio(currentConfig, currentTask).then(() => {
//       if (storeReady && lsf.current?.store) {
//         const store = lsf.current.store;

//         store.resetState();
//         store.assignTask(currentTask);
//         store.assignConfig(currentConfig);
//         store.initializeStore(currentTask);

//         const c = store.annotationStore.addAnnotation({
//           userGenerate: true,
//         });

//         store.annotationStore.selectAnnotation(c.id);
//         console.log("LSF updated");
//       }
//     });
//   }, [currentConfig, currentTask, storeReady]);

//   useEffect(() => {
//     return () => {
//       if (lsf.current) {
//         console.info("Destroying LSF");
//         lsf.current.destroy();
//         lsf.current = null;
//       }
//     };
//   }, []);

//   return (
//     <div className={configClass.elem("preview")}>
//       <h3>UI Preview</h3>
//       {error && (
//         <div className={configClass.elem("preview-error")}>
//           <h2>
//             {error.detail} {error.id}
//           </h2>
//           {error.validation_errors?.non_field_errors?.map?.((err) => (
//             <p key={err}>{err}</p>
//           ))}
//           {error.validation_errors?.label_config?.map?.((err) => (
//             <p key={err}>{err}</p>
//           ))}
//           {error.validation_errors?.map?.((err) => (
//             <p key={err}>{err}</p>
//           ))}
//         </div>
//       )}
//       {!data && loading && <Spinner style={{ width: "100%", height: "50vh" }} />}
//       <div id="label-studio" className={configClass.elem("preview-ui")} ref={rootRef} />
//     </div>
//   );
// };
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "../../../components";
import { cn } from "../../../utils/bem";
import "./Config.scss";
import { EMPTY_CONFIG } from "./Template";
import { API_CONFIG } from "../../../config/ApiConfig";
import { useAPI } from "../../../providers/ApiProvider";

const configClass = cn("configure");

// Lazy load Label Studio with a single promise to avoid multiple loads
// and enable as early as possible to load the dependencies once this component is mounted for the first time
let dependencies;
const loadDependencies = async () => {
  if (!dependencies) {
    dependencies = import("@humansignal/editor");
  }
  return dependencies;
};

export const Preview = ({ config, data, error, loading, project }) => {
  // @see comment about dependencies above
  loadDependencies();

  const [storeReady, setStoreReady] = useState(false);
  const lsf = useRef(null);
  const rootRef = useRef();
  const api = useAPI();
  const projectRef = useRef(project);
  projectRef.current = project;

  const currentTask = useMemo(() => {
    return {
      id: 1,
      annotations: [],
      predictions: [],
      data,
    };
  }, [data]);

  /**
   * Proxy urls to presign them if storage is connected
   * @param {*} _ LS instance
   * @param {string} url http/https are not proxied and returned as is
   */
  const onPresignUrlForProject = async (_, url) => {
    const parsedUrl = new URL(url);

    // return same url if http(s)
    if (["http:", "https:"].includes(parsedUrl.protocol)) return url;

    const projectId = projectRef.current.id;

    const fileuri = btoa(url);

    return api.api.createUrl(API_CONFIG.endpoints.presignUrlForProject, { projectId, fileuri }).url;
  };

  const currentConfig = useMemo(() => {
    // empty string causes error in LSF
    return config ?? EMPTY_CONFIG;
  }, [config]);

  const initLabelStudio = useCallback(async (config, task) => {
    // wait for dependencies to load, the promise is resolved only once
    // and is started when the component is mounted for the first time
    await loadDependencies();

    if (lsf.current || !task.data) return;

    try {
      lsf.current = new window.LabelStudio(rootRef.current, {
        config,
        task,
        interfaces: [], // Rimuovo "side-column" per nascondere il panel
        // with SharedStore we should use more late event
        onStorageInitialized(LS) {
          // Disabilito esplicitamente i pannelli relativi allo storico/annotazioni
          LS.settings.bottomSidePanel = false;
          LS.settings.showSubmitButton = false;
          LS.settings.showSkipButton = false;
          LS.settings.showAnnotationHistory = false;
          LS.settings.showGroundTruth = false;
          
          // Nascondo specificamente gli elementi relativi alla tabella/storico
          setTimeout(() => {
            // Nascondo il pannello delle annotazioni/storico
            const annotationPanel = document.querySelector('.lsf-annotation-tab');
            const historyPanel = document.querySelector('.lsf-history-tab');
            const bottomPanel = document.querySelector('.lsf-bottombar');
            const annotationsList = document.querySelector('.lsf-annotations-list');
            const tabsPanel = document.querySelector('.lsf-tabs');
            
            if (annotationPanel) annotationPanel.style.display = 'none';
            if (historyPanel) historyPanel.style.display = 'none';
            if (bottomPanel) bottomPanel.style.display = 'none';
            if (annotationsList) annotationsList.style.display = 'none';
            if (tabsPanel) tabsPanel.style.display = 'none';
            
            // CSS più generale per nascondere tutte le tabelle/liste di annotazioni
            const style = document.createElement('style');
            style.textContent = `
              .lsf-annotations-list,
              .lsf-annotation-tab,
              .lsf-history-tab,
              .lsf-bottombar,
              .lsf-tabs,
              [class*="annotation-list"],
              [class*="history-list"] {
                display: none !important;
              }
            `;
            document.head.appendChild(style);
          }, 100);

          const initAnnotation = () => {
            const as = LS.annotationStore;
            const c = as.createAnnotation();

            as.selectAnnotation(c.id);
            setStoreReady(true);
          };

          // and even then we need to wait a little even after the store is initialized
          setTimeout(initAnnotation);
        },
      });

      lsf.current.on("presignUrlForProject", onPresignUrlForProject);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const opacity = loading || error ? 0.6 : 1;
    // to avoid rerenders and data loss we do it this way

    document.getElementById("label-studio").style.opacity = opacity;
  }, [loading, error]);

  useEffect(() => {
    initLabelStudio(currentConfig, currentTask).then(() => {
      if (storeReady && lsf.current?.store) {
        const store = lsf.current.store;

        store.resetState();
        store.assignTask(currentTask);
        store.assignConfig(currentConfig);
        store.initializeStore(currentTask);

        const c = store.annotationStore.addAnnotation({
          userGenerate: true,
        });

        store.annotationStore.selectAnnotation(c.id);
        console.log("LSF updated");
      }
    });
  }, [currentConfig, currentTask, storeReady]);

  useEffect(() => {
    return () => {
      if (lsf.current) {
        console.info("Destroying LSF");
        lsf.current.destroy();
        lsf.current = null;
      }
    };
  }, []);

  return (
    <div className={configClass.elem("preview")}>
      <h3>UI Preview</h3>
      {error && (
        <div className={configClass.elem("preview-error")}>
          <h2>
            {error.detail} {error.id}
          </h2>
          {error.validation_errors?.non_field_errors?.map?.((err) => (
            <p key={err}>{err}</p>
          ))}
          {error.validation_errors?.label_config?.map?.((err) => (
            <p key={err}>{err}</p>
          ))}
          {error.validation_errors?.map?.((err) => (
            <p key={err}>{err}</p>
          ))}
        </div>
      )}
      {!data && loading && <Spinner style={{ width: "100%", height: "50vh" }} />}
      <div id="label-studio" className={configClass.elem("preview-ui")} ref={rootRef} />
    </div>
  );
};