import { useMemo, useState } from "react";
import { inject, observer } from "mobx-react";

import { useWindowSize } from "../../common/Utils/useWindowSize";
import { Block, cn, Elem } from "../../utils/bem";
import { isDefined } from "../../utils/utilities";
import { Tool } from "./Tool";
import { ToolbarProvider } from "./ToolbarContext";

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
        </Block>
      </ToolbarProvider>
    );
  }),
);

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