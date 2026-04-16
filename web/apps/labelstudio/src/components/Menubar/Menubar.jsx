import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHistory } from "react-router";
import { StaticContent } from "../../app/StaticContent/StaticContent";
import {
  IconBook,
  IconFolder,
  IconHome,
  IconPersonInCircle,
  IconPin,
  IconTerminal,
  IconDoor,
  IconGithub,
  IconSettings,
  IconSlack,
} from "@humansignal/icons";
import { Userpic, ThemeToggle } from "@humansignal/ui";
import { useConfig } from "../../providers/ConfigProvider";
import { useContextComponent, useFixedLocation } from "../../providers/RoutesProvider";
import { useCurrentUser } from "../../providers/CurrentUser";
import { cn } from "../../utils/bem";
import { absoluteURL, isDefined } from "../../utils/helpers";
import { Breadcrumbs } from "../Breadcrumbs/Breadcrumbs";
import { Dropdown } from "../Dropdown/Dropdown";
import { Hamburger } from "../Hamburger/Hamburger";
import { Menu } from "../Menu/Menu";
import { VersionNotifier, VersionProvider } from "../VersionNotifier/VersionNotifier";
import { OnboardingTour } from "../OnboardingTour/OnboardingTour";
import "./Menubar.scss";
import "./MenuContent.scss";
import "./MenuSidebar.scss";
import { FF_HOMEPAGE } from "../../utils/feature-flags";
import { pages } from "@humansignal/app-common";
import { isFF } from "../../utils/feature-flags";
import { ff } from "@humansignal/core";

export const MenubarContext = createContext();

const LeftContextMenu = ({ className }) => (
  <StaticContent id="context-menu-left" className={className}>
    {(template) => <Breadcrumbs fromTemplate={template} />}
  </StaticContent>
);

const RightContextMenu = ({ className, ...props }) => {
  const history = useHistory();
  
  const getCurrentPort = () => {
    return window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  };

  const getProjectId = () => {
    const pathMatch = window.location.pathname.match(/\/projects\/(\d+)/);
    return pathMatch ? pathMatch[1] : null;
  };

  const currentPort = getCurrentPort();
  const projectId = getProjectId();
  const exportUrl = `${window.location.protocol}//${window.location.hostname}:6001/api/export_format?source_port=${currentPort}`;

  const handleDataConfigClick = useCallback((e) => {
    e.preventDefault();

    if (!projectId) {
      console.error('No project ID found in URL');
      return;
    }

    // Capture current URL to pass as 'from' parameter
    const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
    const targetUrl = `/projects/${projectId}/settings/labeling?from=${currentUrl}`;
    window.location.href = targetUrl;
  }, [projectId]);

  const handleExportClick = useCallback((e) => {
    e.preventDefault();

    // Show loading screen
    document.body.innerHTML = `
      <div style="
        background-color: white;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        "></div>
        <p style="
          margin: 0;
          font-size: 18px;
          color: #333;

          font-weight: 500;
        ">Exporting...</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    // Redirect to export
    window.location.href = exportUrl;
  }, [exportUrl]);
  return (
    <div className={className}>
      <div className="lsf-space-ls lsf-space-ls_direction_horizontal lsf-space-ls_size_small">
        {projectId && (
          <button
            onClick={handleDataConfigClick}
            className="lsf-button-ls lsf-button-ls_size_compact lsf-button-ls_look_"
            style={{
              backgroundColor: 'white',
              color: '#333',
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              marginRight: '8px',
              cursor: 'pointer'
            }}
          >
            Data Config
          </button>
        )}

        <button
          onClick={handleExportClick}
          className="lsf-button-ls lsf-button-ls_size_compact lsf-button-ls_look_"
          style={{
            backgroundColor: 'white',
            color: '#333',
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            cursor: 'pointer'
          }}
        >
          Export
        </button>

        <OnboardingTour />
      </div>
    </div>
  );
};

export const Menubar = ({ enabled, defaultOpened, defaultPinned, children, onSidebarToggle, onSidebarPin }) => {
  const menuDropdownRef = useRef();
  const useMenuRef = useRef();
  const { user, fetch, isInProgress } = useCurrentUser();
  const location = useFixedLocation();

  const config = useConfig();
  const [sidebarOpened, setSidebarOpened] = useState(defaultOpened ?? false);
  const [sidebarPinned, setSidebarPinned] = useState(defaultPinned ?? false);
  const [PageContext, setPageContext] = useState({
    Component: null,
    props: {},
  });

  const menubarClass = cn("menu-header");
  const menubarContext = menubarClass.elem("context");
  const sidebarClass = cn("sidebar");
  const contentClass = cn("content-wrapper");
  const contextItem = menubarClass.elem("context-item");
  const showNewsletterDot = !isDefined(user?.allow_newsletters);

  const sidebarPin = useCallback(
    (e) => {
      e.preventDefault();

      const newState = !sidebarPinned;

      setSidebarPinned(newState);
      onSidebarPin?.(newState);
    },
    [sidebarPinned, onSidebarPin],
  );

  const sidebarToggle = useCallback(
    (visible) => {
      const newState = visible;

      setSidebarOpened(newState);
      onSidebarToggle?.(newState);
    },
    [onSidebarToggle],
  );

  const providerValue = useMemo(
    () => ({
      PageContext,

      setContext(ctx) {
        setTimeout(() => {
          setPageContext({
            ...PageContext,
            Component: ctx,
          });
        });
      },

      setProps(props) {
        setTimeout(() => {
          setPageContext({
            ...PageContext,
            props,
          });
        });
      },

      contextIsSet(ctx) {
        return PageContext.Component === ctx;
      },
    }),
    [PageContext],
  );

  useEffect(() => {
    if (!sidebarPinned) {
      menuDropdownRef?.current?.close();
    }
    useMenuRef?.current?.close();
  }, [location, sidebarPinned]);

  return (
    <div className={contentClass}>
      {enabled && (
        <div className={menubarClass}>
          
          <div
            className={`${menubarClass.elem("trigger")} main-menu-trigger`}
            onClick={() => window.location.pathname = '/projects/1'}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <img 
              src="https://cloud.visiofy.ai:5005/static/icons/logo/landscape-b.svg" 
              className={`${menubarClass.elem("logo")}`} 
              alt="Visiofy Logo" 
              style={{
                height: '32px',
                width: 'auto'
              }}
            />
            <Hamburger opened={sidebarOpened} />
          </div>
          
          <div className={menubarContext}>
            <LeftContextMenu className={contextItem.mod({ left: true })} />
            <RightContextMenu className={contextItem.mod({ right: true })} />
          </div>

          <div className={menubarClass.elem("spacer").toString()} />

          <div title={user?.email} className={menubarClass.elem("user")} style={{ cursor: 'default' }}>
            <Userpic user={user} isInProgress={isInProgress} />
          </div>
        </div>
      )}

      <VersionProvider>
        <div className={contentClass.elem("body")}>
          <MenubarContext.Provider value={providerValue}>
            <div className={contentClass.elem("content").mod({ withSidebar: sidebarPinned && sidebarOpened })}>
              {children}
            </div>
          </MenubarContext.Provider>
        </div>
      </VersionProvider>
    </div>
  );
};