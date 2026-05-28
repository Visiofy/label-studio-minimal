import { SidebarMenu } from "../../components/SidebarMenu/SidebarMenu";
import { WebhookPage } from "../WebhookPage/WebhookPage";
import { DangerZone } from "./DangerZone";
import { AnnotationSettings } from "./AnnotationSettings";
import { MachineLearningSettings } from "./MachineLearningSettings/MachineLearningSettings";
import { PredictionsSettings } from "./PredictionsSettings/PredictionsSettings";
import { StorageSettings } from "./StorageSettings/StorageSettings";
import { LabelingSettings } from "./LabelingSettings"; // IMPORTA IL FILE CHE HAI FORNITO
import { isInLicense, LF_CLOUD_STORAGE_FOR_MANAGERS } from "../../utils/license-flags";
import { useEffect } from "react";
import { useHistory, useLocation } from "react-router";

const isAllowCloudStorage = !isInLicense(LF_CLOUD_STORAGE_FOR_MANAGERS);

export const MenuLayout = ({ children, ...routeProps }) => {
  return (
    <SidebarMenu
      menuItems={[
        LabelingSettings,
        AnnotationSettings,
        MachineLearningSettings,
        PredictionsSettings,
        isAllowCloudStorage && StorageSettings,
        WebhookPage,
        DangerZone,
      ].filter(Boolean)}
      path={routeProps.match.url}
      children={children}
    />
  );
};

// Layout che reindirizza TUTTE le /settings TRANNE /settings/labeling
const SettingsLayoutManager = ({ children, ...routeProps }) => {
  const history = useHistory();
  const location = useLocation();
  
  useEffect(() => {
    const isLabelingPage = location.pathname.endsWith('/settings/labeling');
    const searchParams = new URLSearchParams(location.search);
    const isFromBreadcrumb = searchParams.get('from') === 'breadcrumb';

    if (isLabelingPage || isFromBreadcrumb) {
      console.log('Skipping redirect (labeling page or from breadcrumb)');
      return;
    }

    if (location.pathname.includes('/settings')) {
      const currentPort = window.location.port || window.location.host.split(".")[0].split("-")[1];
      
      console.log('=== PORT DETECTION ===');
      console.log('Current URL:', window.location.href);
      console.log('Current port:', currentPort);
      
      if (!currentPort) {
        console.error('No port found in current URL!');
        return;
      }
      
      const exportUrl = window.location.port
        ? `${window.location.protocol}//${window.location.hostname}:6001/api/export_format?source_port=${currentPort}`
        : `https://label-studio.visiofy.ai/api/export_format?source_port=${currentPort}`;
      
      console.log('Export URL:', exportUrl);

      setTimeout(() => {
        console.log('Redirecting to export endpoint:', exportUrl);
        window.location.href = exportUrl;
      }, 100);
    }
  }, [location.pathname, location.search]);

  return children;
};

 

const pages = {
  LabelingSettings, // AGGIUNTO
  AnnotationSettings,
  MachineLearningSettings,
  PredictionsSettings,
  WebhookPage,
  DangerZone,
};

if (isAllowCloudStorage) {
  pages.StorageSettings = StorageSettings;
}

export const SettingsPage = {
  title: "Settings",
  path: "/settings",
  exact: false,
  layout: SettingsLayoutManager,
  component: null,  // Removed duplicate LabelingSettings - it's handled by SidebarMenu
  pages,
};