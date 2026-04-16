/**
 * Libraries
 */
import React, { Component } from "react";
import { Modal, Result, Spin } from "antd";
import { getEnv, getRoot, isAlive } from "mobx-state-tree";
import { observer, Provider } from "mobx-react";

const safeMobxAccess = (fn, fallback = null) => {
  try {
    return fn();
  } catch (error) {
    if (error.message && error.message.includes('no longer part of a state tree')) {
      console.warn('[SafeMobX App] Attempted access to destroyed MobX object:', error.message.substring(0, 100));
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

/**
 * Core
 */
import Tree from "../../core/Tree";
import { CommentsOverlay } from "../InteractiveOverlays/CommentsOverlay";
import { TreeValidation } from "../TreeValidation/TreeValidation";

/**
 * Tags
 */
import "../../tags/object";
import "../../tags/control";
import "../../tags/visual";

/**
 * Utils and common components
 */
import { Space } from "../../common/Space/Space";
import { Button } from "../../common/Button/Button";
import { Block, Elem } from "../../utils/bem";
import { isSelfServe } from "../../utils/billing";
import {
  FF_BULK_ANNOTATION,
  FF_DEV_3873,
  FF_LSDV_4620_3_ML,
  FF_PER_FIELD_COMMENTS,
  FF_SIMPLE_INIT,
  isFF,
} from "../../utils/feature-flags";
import { sanitizeHtml } from "../../utils/html";
import { reactCleaner } from "../../utils/reactCleaner";
import { guidGenerator } from "../../utils/unique";
import { isDefined, sortAnnotations } from "../../utils/utilities";
import { ToastProvider, ToastViewport } from "@humansignal/ui/lib/toast/toast";

/**
 * Components
 */
import { Annotation } from "./Annotation";
import { BottomBar } from "../BottomBar/BottomBar";
import Debug from "../Debug";
import Grid from "./Grid";
import { InstructionsModal } from "../InstructionsModal/InstructionsModal";
import { RelationsOverlay } from "../InteractiveOverlays/RelationsOverlay";
import Segment from "../Segment/Segment";
import Settings from "../Settings/Settings";
import { SidePanels } from "../SidePanels/SidePanels";
import { SideTabsPanels } from "../SidePanels/TabPanels/SideTabsPanels";
import { TopBar } from "../TopBar/TopBar";

/**
 * Styles
 */
import "./App.scss";

/**
 * App
 */
class App extends Component {
  relationsRef = React.createRef();
  labelingConfigChecked = false; // Flag to check only once

  componentDidMount() {
    // Hack to activate app hotkeys
    window.blur();
    document.body.focus();

    // Note: Labeling configuration check is now handled in DataManager
    // before task is opened, so we don't need to check here
  }

  componentDidUpdate(prevProps) {
    // Check when task first becomes available - use safe MobX access
    try {
      const prevStore = prevProps?.store;
      const currentStore = this.props?.store;

      if (!currentStore || !isSafeToUse(currentStore)) {
        return;
      }

      const prevTask = prevStore ? safeMobxAccess(() => prevStore.task) : null;
      const currentTask = safeMobxAccess(() => currentStore.task);

      if (!prevTask && currentTask && !this.labelingConfigChecked) {
        console.log('[App] Task loaded (labeling check moved to DataManager)');
        this.labelingConfigChecked = true;
        // this.checkLabelingConfigurationViaAPI(); // DISABLED - check moved to DataManager
      }
    } catch (error) {
      // Ignore MobX errors during component updates
      console.warn('[App] Safe error during componentDidUpdate:', error.message?.substring(0, 100));
    }
  }

  async checkLabelingConfigurationViaAPI() {
    try {
      console.log('[App] Fetching project info via API');

      // Try to get project ID from various sources
      const projectId = this.props?.store?.task?.project_id
                     || this.props?.store?.project?.id
                     || window.location.pathname.match(/\/projects\/(\d+)/)?.[1]
                     || 1; // fallback to 1

      console.log('[App] Project ID:', projectId);

      // Fetch project info from API
      const response = await fetch(`/api/projects/${projectId}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('[App] Failed to fetch project info:', response.status);
        return;
      }

      const projectData = await response.json();
      console.log('[App] Project data received:', projectData);
      console.log('[App] config_has_control_tags:', projectData.config_has_control_tags);

      // Check if labels are configured
      if (projectData.config_has_control_tags === false) {
        console.log('[App] ⚠️ No labels configured - checking if already warned');

        // Check if user already saw the warning this session
        const warningShownKey = `label_config_warning_shown_${projectId}`;
        const alreadyShown = sessionStorage.getItem(warningShownKey);

        if (alreadyShown === 'true') {
          console.log('[App] User already saw warning this session, skipping');
          return;
        }

        console.log('[App] Showing warning immediately');

        // Set flag immediately when showing modal (not just on OK)
        sessionStorage.setItem(warningShownKey, 'true');
        console.log('[App] Setting sessionStorage flag:', warningShownKey);

        // Show warning immediately (no delay)
        Modal.confirm({
          title: "You're almost there!",
          content: "Before you can annotate the data, set up labeling configuration by adding labels to your dataset metadata.",
          okText: "Go to Labeling Settings",
          cancelText: "Cancel",
          onOk() {
            const settingsUrl = window.location.origin + '/projects/' + projectId + '/settings/labeling';
            window.location.href = settingsUrl;
          },
        });
      } else {
        console.log('[App] ✅ Labels are configured');
      }
    } catch (error) {
      console.error('[App] Error checking labeling configuration via API:', error);
    }
  }

  renderSuccess() {
    return (
      <Block name="editor">
        <Result status="success" title={getEnv(this.props.store).messages.DONE} />
      </Block>
    );
  }

  renderNoAnnotation() {
    return (
      <Block name="editor">
        <Result status="success" title={getEnv(this.props.store).messages.NO_COMP_LEFT} />
      </Block>
    );
  }

  renderNothingToLabel(store) {
    return (
      <Block
        name="editor"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          paddingBottom: "30vh",
        }}
      >
        <Result status="success" title={getEnv(this.props.store).messages.NO_NEXT_TASK} />
        <Block name="sub__result">All tasks in the queue have been completed</Block>
        {store.taskHistory.length > 0 && (
          <Button onClick={(e) => store.prevTask(e, true)} look="outlined" style={{ margin: "16px 0" }}>
            Go to Previous Task
          </Button>
        )}
      </Block>
    );
  }

  renderNoAccess() {
    return (
      <Block name="editor">
        <Result status="warning" title={getEnv(this.props.store).messages.NO_ACCESS} />
      </Block>
    );
  }

  renderConfigValidationException(store) {
    return (
      <Block name="main-view">
        <Elem name="annotation">
          <TreeValidation errors={this.props.store.annotationStore.validation} />
        </Elem>
        {!isFF(FF_DEV_3873) && store.hasInterface("infobar") && <Elem name="infobar">Task #{store.task.id}</Elem>}
      </Block>
    );
  }

  renderLoader() {
    return <Result icon={<Spin size="large" />} />;
  }

  _renderAll(obj) {
    if (obj.length === 1) return <Segment annotation={obj[0]}>{[Tree.renderItem(obj[0].root)]}</Segment>;
    const renderAllClassName = cn("renderall").toClassName();
    const fadeClassName = cn("fade").toClassName();
    return (
      <div className={renderAllClassName}>
        {obj.map((c, i) => (
          <div key={`all-${i}`} className={fadeClassName}>
            <Segment annotation={c}>{[Tree.renderItem(c.root)]}</Segment>
          </div>
        ))}
      </div>
    );
  }

  _renderUI(root, as) {
    if (as.viewingAll) return this.renderAllAnnotations();

    return (
      <Block key={(as.selectedHistory ?? as.selected)?.id} name="main-view" onScrollCapture={this._notifyScroll}>
        <Elem name="annotation">
          {<Annotation root={root} annotation={as.selected} />}
          {this.renderRelations(as.selected)}
          {isFF(FF_PER_FIELD_COMMENTS) && this.renderCommentsOverlay(as.selected)}
        </Elem>
        {!isFF(FF_DEV_3873) && getRoot(as).hasInterface("infobar") && this._renderInfobar(as)}
      </Block>
    );
  }

  _renderInfobar(as) {
    const { id, queue } = getRoot(as).task;

    return (
      <Elem name="infobar" tag={Space} size="small">
        <span>Task #{id}</span>

        {queue && <span>{queue}</span>}
      </Elem>
    );
  }

  renderAllAnnotations() {
    const as = this.props.store.annotationStore;
    const entities = [...as.annotations, ...as.predictions];

    if (isFF(FF_SIMPLE_INIT)) {
      // the same sorting we have in AnnotationsCarousel, so we'll see the same order in both places
      sortAnnotations(entities);
    }

    return <Grid store={as} annotations={entities} root={as.root} />;
  }

  renderRelations(selectedStore) {
    const store = selectedStore.relationStore;
    const taskData = this.props.store.task?.data;

    return (
      <RelationsOverlay
        key={guidGenerator()}
        store={store}
        ref={this.relationsRef}
        tags={selectedStore.names}
        taskData={taskData}
      />
    );
  }

  renderCommentsOverlay(selectedAnnotation) {
    const { store } = this.props;
    const { commentStore } = store;

    if (!store.hasInterface("annotations:comments") || !commentStore.isCommentable) return null;
    return <CommentsOverlay commentStore={commentStore} annotation={selectedAnnotation} />;
  }

  render() {
    const { store } = this.props;

    // Controllo preventivo per evitare errori MobX durante la distruzione
    try {
      if (!store || !isSafeToUse(store)) {
        return this.renderLoader();
      }
    } catch (error) {
      console.warn('[App] Store validation failed, showing loader');
      return this.renderLoader();
    }

    const as = safeMobxAccess(() => store?.annotationStore);
    const root = safeMobxAccess(() => as?.selected?.root);
    const settings = safeMobxAccess(() => store?.settings, {});

    // Forza sempre un reload quando si naviga verso MyFirstProject per consistenza
    // con Settings/Projects che già fanno il reload
    const shouldForceReload = window.location.pathname.includes('MyFirstProject') ||
                              window.location.hash.includes('MyFirstProject');

    if (shouldForceReload && !window.location.href.includes('reloaded=true')) {
      console.log('[App] Forcing reload for MyFirstProject navigation consistency');

      // Aggiungi parametro per evitare loop infinito di reload
      const separator = window.location.href.includes('?') ? '&' : '?';
      window.location.href = window.location.href + separator + 'reloaded=true';

      return this.renderLoader();
    }

    const isLoading = safeMobxAccess(() => store?.isLoading, false);
    const noTask = safeMobxAccess(() => store?.noTask, false);
    const noAccess = safeMobxAccess(() => store?.noAccess, false);
    const labeledSuccess = safeMobxAccess(() => store?.labeledSuccess, false);

    if (isLoading) return this.renderLoader();

    if (noTask) return this.renderNothingToLabel(store);

    if (noAccess) return this.renderNoAccess();

    if (labeledSuccess) return this.renderSuccess();

    if (!root) return this.renderNoAnnotation();

    const viewingAll = safeMobxAccess(() => as?.viewingAll, false);
    const awaitingSuggestions = safeMobxAccess(() => store.awaitingSuggestions, false);
    const validation = safeMobxAccess(() => as?.validation);
    const selectedHistoryRoot = safeMobxAccess(() => as?.selectedHistory?.root);

    // tags can be styled in config when user is awaiting for suggestions from ML backend
    const mainContent = (
      <Block name="main-content" mix={awaitingSuggestions ? ["requesting"] : []}>
        {validation === null
          ? this._renderUI(selectedHistoryRoot ?? root, as)
          : this.renderConfigValidationException(store)}
      </Block>
    );

    const hasAnnotationBulkInterface = safeMobxAccess(() => store?.hasInterface("annotation:bulk"), false);
    const isBulkMode = isFF(FF_BULK_ANNOTATION) && !isSelfServe() && hasAnnotationBulkInterface;
    const newUIEnabled = isFF(FF_DEV_3873);
    const fullscreen = safeMobxAccess(() => settings?.fullscreen, false);

    return (
      <Block
        name="editor"
        mod={{ fullscreen }}
        ref={isFF(FF_LSDV_4620_3_ML) ? reactCleaner(this) : null}
      >
        <Settings store={store} />
        <Provider store={store}>
          <ToastProvider>
            {newUIEnabled ? (
              <InstructionsModal
                visible={safeMobxAccess(() => store?.showingDescription, false)}
                onCancel={() => safeMobxAccess(() => store?.toggleDescription())}
                title={safeMobxAccess(() => store?.hasInterface("review"), false) ? "Review Instructions" : "Labeling Instructions"}
              >
                {safeMobxAccess(() => store?.description, "")}
              </InstructionsModal>
            ) : (
              <>
                {safeMobxAccess(() => store?.showingDescription, false) && (
                  <Segment>
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(safeMobxAccess(() => store?.description, "")) }} />
                  </Segment>
                )}
              </>
            )}

            {isDefined(store) && safeMobxAccess(() => store?.hasInterface("topbar"), false) && <TopBar store={store} />}
            <Block
              name="wrapper"
              mod={{
                viewAll: viewingAll,
                bsp: safeMobxAccess(() => settings.effectiveBottomSidePanel, false),
                showingBottomBar: newUIEnabled,
              }}
            >
              {newUIEnabled ? (
                isBulkMode ? (
                  <>
                    {mainContent}
                    {safeMobxAccess(() => store?.hasInterface("topbar"), false) && <BottomBar store={store} />}
                  </>
                ) : (
                  <SideTabsPanels
                    panelsHidden={viewingAll}
                    currentEntity={safeMobxAccess(() => as?.selectedHistory ?? as?.selected) || safeMobxAccess(() => as?.selected)}
                    regions={safeMobxAccess(() => as?.selected?.regionStore) || {}}
                    showComments={safeMobxAccess(() => store?.hasInterface("annotations:comments"), false)}
                    focusTab={safeMobxAccess(() => store?.commentStore?.tooltipMessage, null) ? "comments" : null}
                  >
                    {mainContent}
                    {safeMobxAccess(() => store?.hasInterface("topbar"), false) && <BottomBar store={store} />}
                  </SideTabsPanels>
                )
              ) : isBulkMode ? (
                mainContent
              ) : (
                <SidePanels
                  panelsHidden={viewingAll}
                  currentEntity={safeMobxAccess(() => as?.selectedHistory ?? as?.selected) || safeMobxAccess(() => as?.selected)}
                  regions={safeMobxAccess(() => as?.selected?.regionStore) || {}}
                >
                  {mainContent}
                </SidePanels>
              )}
            </Block>
            <ToastViewport />
          </ToastProvider>
        </Provider>
        {store.hasInterface("debug") && <Debug store={store} />}
      </Block>
    );
  }

  _notifyScroll = () => {
    if (this.relationsRef.current) {
      this.relationsRef.current.onResize();
    }
  };
}

export default observer(App);
