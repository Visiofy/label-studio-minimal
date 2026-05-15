import { useMemo, useState } from "react";
import { inject, observer } from "mobx-react";

import { useWindowSize } from "../../common/Utils/useWindowSize";
import { Block, cn, Elem } from "../../utils/bem";
import { isDefined } from "../../utils/utilities";
import { Tool } from "./Tool";
import { ToolbarProvider } from "./ToolbarContext";
import { confirm } from "../../common/Modal/Modal";

import "./FlyoutMenu.scss";
import "./Tool.scss";
import "./Toolbar.scss";

export const Toolbar = inject("store")(
  observer(({ store, tools, expanded }) => {
    const [toolbar, setToolbar] = useState(null);
    const windowSize = useWindowSize();

    // Safety check: ensure tools is always an array
    const safeTools = Array.isArray(tools) ? tools : [];

    const alignment = useMemo(() => {
      if (!isDefined(toolbar)) return "right";

      const bbox = toolbar.getBoundingClientRect();

      if (bbox.left < 200) {
        return "right";
      }
      if (windowSize.width - bbox.right < 200) {
        return "left";
      }

      return "right";
    }, [toolbar, windowSize]);

    const toolGroups = safeTools
      .filter((t) => !t.dynamic)
      .reduce((res, tool) => {
        const group = res[tool.group] ?? [];

        group.push(tool);
        res[tool.group] = group;
        return res;
      }, {});

    const smartTools = safeTools.filter((t) => t.dynamic);

    return (
      <ToolbarProvider value={{ expanded, alignment }}>
        <Block ref={(el) => setToolbar(el)} name="toolbar" mod={{ alignment, expanded }}>
          {Object.entries(toolGroups).map(([name, tools], i) => {
            const visibleTools = tools.filter((t) => {
              // Lista degli strumenti da nascondere con i nomi esatti dalla console
              const hiddenTools = [
                'brushtool',
                'keypointtool',
                'rectangletool',
                'rectangle3pointtool',
                'polygontool',
                'eraser',
                'erasertool'
              ];

              const toolName = t.toolName?.toLowerCase() || '';
              const toolDisplayName = t.fullName?.toLowerCase() || '';
              const toolType = t.type?.toLowerCase() || '';
              const toolClass = t.viewClass?.name?.toLowerCase() || '';

              // FILTRO AGGRESSIVO - nascondi TUTTO quello che potrebbe essere smart
              const isSmartTool = t.dynamic ||
                                t.smart ||
                                toolName.includes('smart') ||
                                toolDisplayName.includes('smart') ||
                                toolType.includes('smart') ||
                                toolClass.includes('smart') ||
                                toolName.includes('dynamic') ||
                                toolDisplayName.includes('dynamic') ||
                                toolName.includes('auto') ||
                                toolDisplayName.includes('auto') ||
                                toolDisplayName.includes('detect') ||
                                toolName.includes('detect') ||
                                toolName.includes('ai') ||
                                toolDisplayName.includes('ai') ||
                                // Controlla anche le proprietà dell'oggetto tool con controlli sicuri
                                (t.controls && Array.isArray(t.controls) && t.controls.some(c => {
                                  if (!c) return false;
                                  const controlName = (c.name && typeof c.name === 'string') ? c.name.toLowerCase() : '';
                                  const controlType = (c.type && typeof c.type === 'string') ? c.type.toLowerCase() : '';
                                  return controlName.includes('smart') || controlType.includes('smart');
                                })) ||
                                // Controlla il nome della classe del componente con controlli sicuri
                                (t.viewClass && t.viewClass.displayName &&
                                 typeof t.viewClass.displayName === 'string' &&
                                 t.viewClass.displayName.toLowerCase().includes('smart'));

              // RETURN FALSE per nascondere, TRUE per mostrare
              // Nascondi se è nella lista hidden O se è smart O se non ha viewClass
              return t.viewClass && !hiddenTools.includes(toolName) && !isSmartTool;
            });

            // Renderizza solo se ci sono tool visibili e NON smart
            return visibleTools.length ? (
              <Elem name="group" key={`toolset-${name}-${i}`}>
                {visibleTools
                  .sort((a, b) => a.index - b.index)
                  .map((tool, i) => {
                    const ToolComponent = tool.viewClass;

                    return <ToolComponent key={`${tool.toolName}-${i}`} />;
                  })}
              </Elem>
            ) : null;
          })}
          {/* Auto-detect DISABILITATO - nascondiamo tutti i smart tool */}
          {false && store.autoAnnotation && <SmartTools tools={smartTools} />}
          {/* Null Tool: marca l'immagine come nulla (nessun oggetto di interesse) */}
          <NullTool store={store} />
        </Block>
      </ToolbarProvider>
    );
  }),
);

const NullTool = observer(({ store }) => {
  const [nullAnnotationId, setNullAnnotationId] = useState(null);

  const annotation = store.annotationStore?.selected;
  const annotationId = annotation?.id;
  const regionCount = annotation?.regionStore?.regions?.length ?? 0;

  // Check if tag_null Choices control has __null__ selected
  // NOTE: c.sel is the reactive MobX state; c.selected is the static XML attribute (always false)
  const tagNullControl = annotation?.names?.get('tag_null');
  const isNullChoiceSelected = tagNullControl?.children?.some(c => c.value === '__null__' && c.sel) ?? false;

  const active = (isNullChoiceSelected || (nullAnnotationId === annotationId)) && regionCount === 0;

  const doMarkNull = () => {
    const ann = store.annotationStore?.selected;

    if (!ann) return;
    try {
      ann.deleteAllRegions({ deleteReadOnly: true });
      // Mark as null via hidden tag_null Choices
      const ctrl = ann.names?.get('tag_null');
      if (ctrl) {
        const nullChoice = ctrl.children?.find(c => c.value === '__null__');
        if (nullChoice?.setSelected) {
          nullChoice.setSelected(true);
          // Persist the result so it gets saved in the annotation
          ctrl.updateResult?.();
        }
      }
      setNullAnnotationId(ann.id);
    } catch(e) { console.error('[NullTool] doMarkNull error:', e); }
  };

  const handleNull = () => {
    const ann = store.annotationStore?.selected;

    if (!ann) return;

    if (active) {
      // Toggle off: deseleziona __null__ e aggiorna il result
      const ctrl = ann.names?.get('tag_null');
      if (ctrl) {
        ctrl.resetSelected?.();
        ctrl.updateResult?.();
      }
      setNullAnnotationId(null);
      return;
    }

    const hasRegions = (ann.regionStore?.regions?.length ?? 0) > 0;

    if (hasRegions) {
      confirm({
        title: "Mark this image as null?",
        body: "When the image is marked as null, it will be considered annotated without objects. The existing annotations will be deleted.",
        okText: "Yes",
        cancelText: "No",
        onOk: doMarkNull,
      });
    } else {
      doMarkNull();
    }
  };

  return (
    <Elem name="group">
      <Tool
        label="Null Tool"
        shortcut="n"
        ariaLabel="null-tool"
        active={active}
        onClick={handleNull}
        icon={
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
            <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="2.5" />
            <line x1="8.5" y1="23.5" x2="23.5" y2="8.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        }
      />
    </Elem>
  );
});

const SmartTools = observer(({ tools }) => {
  // Safety check: ensure tools is always an array
  const safeTools = Array.isArray(tools) ? tools : [];

  const [selectedIndex, setSelectedIndex] = useState(
    Math.max(
      safeTools.findIndex((t) => t.selected),
      0,
    ),
  );

  const selected = useMemo(() => safeTools[selectedIndex], [selectedIndex, safeTools]);

  const hasSelected = safeTools.some((t) => t.selected);

  return (
    safeTools.length > 0 && (
      <Elem name="group">
        <Tool
          smart
          label="Auto-Detect"
          active={hasSelected}
          icon={selected.iconClass}
          shortcut="M"
          extra={
            safeTools.length > 1 ? (
              <Elem name="smart">
                {safeTools.map((t, i) => {
                  const ToolView = t.viewClass;

                  return (
                    <div
                      key={`${i}`}
                      onClickCapture={(e) => {
                        e.preventDefault();
                        setSelectedIndex(i);
                        t.manager.selectTool(t, true);
                      }}
                    >
                      <ToolView />
                    </div>
                  );
                })}
              </Elem>
            ) : null
          }
          controls={selected.controls}
          onClick={(e) => {
            let nextIndex = selectedIndex + 1;

            // if that's a smart button in extra block, it's already selected
            // if it's a hotkey handler, there are no `e` event
            if (e?.target?.closest(`.${cn("tool").elem("extra")}`)) return;

            if (!hasSelected) nextIndex = 0;
            else if (nextIndex >= safeTools.length) nextIndex = 0;

            const nextTool = safeTools[nextIndex];

            setSelectedIndex(nextIndex);
            nextTool.manager.selectTool(nextTool, true);
          }}
        />
      </Elem>
    )
  );
});