import { SidebarMenu } from "../../components/SidebarMenu/SidebarMenu";
import { WebhookPage } from "../WebhookPage/WebhookPage";
import { DangerZone } from "./DangerZone";
import { GeneralSettings } from "./GeneralSettings";
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
        GeneralSettings,
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
    console.log('SettingsLayoutManager - Current path:', location.pathname);
    
    // Se siamo su /settings/labeling, NON fare il redirect - lascia che LabelingSettings gestisca
    if (location.pathname.endsWith('/settings/labeling')) {
      console.log('Path is /settings/labeling - skipping redirect');
      return;
    }
    
    // Per TUTTE le altre route che iniziano con /settings, fai il redirect
    if (location.pathname.includes('/settings')) {
      console.log('Redirecting all other /settings routes to export endpoint');
      
      const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
      const exportUrl = `http://192.168.2.136:6001/api/export_format?source_port=${currentPort}`;
      
      // Aggiungi un piccolo delay per debug
      setTimeout(() => {
        console.log('Executing redirect to:', exportUrl);
        window.location.href = exportUrl;
      }, 100);
      
      return;
    }
  }, [location.pathname]);

  // Per tutte le altre route /settings, il redirect dovrebbe già essere avvenuto nell'useEffect
  // Ma se arriviamo qui, renderizza i children
  console.log('Rendering children for path:', location.pathname);
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
  component: GeneralSettings,
  pages,
};