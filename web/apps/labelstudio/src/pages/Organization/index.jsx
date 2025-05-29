// import { SidebarMenu } from "../../components/SidebarMenu/SidebarMenu";
// import { PeoplePage } from "./PeoplePage/PeoplePage";
// import { WebhookPage } from "../WebhookPage/WebhookPage";

// const ALLOW_ORGANIZATION_WEBHOOKS = window.APP_SETTINGS.flags?.allow_organization_webhooks;

// const MenuLayout = ({ children, ...routeProps }) => {
//   const menuItems = [PeoplePage];

//   if (ALLOW_ORGANIZATION_WEBHOOKS) {
//     menuItems.push(WebhookPage);
//   }
//   return <SidebarMenu menuItems={menuItems} path={routeProps.match.url} children={children} />;
// };

// const organizationPages = {};

// if (ALLOW_ORGANIZATION_WEBHOOKS) {
//   organizationPages[WebhookPage] = WebhookPage;
// }

// export const OrganizationPage = {
//   title: "Organization",
//   path: "/organization",
//   exact: true,
//   layout: MenuLayout,
//   component: PeoplePage,
//   pages: organizationPages,
// };
import { SidebarMenu } from "../../components/SidebarMenu/SidebarMenu";
import { PeoplePage } from "./PeoplePage/PeoplePage";
import { WebhookPage } from "../WebhookPage/WebhookPage";
import { useEffect } from "react";
import { useHistory } from "react-router";

const ALLOW_ORGANIZATION_WEBHOOKS = window.APP_SETTINGS.flags?.allow_organization_webhooks;

const MenuLayout = ({ children, ...routeProps }) => {
  const menuItems = [PeoplePage];

  if (ALLOW_ORGANIZATION_WEBHOOKS) {
    menuItems.push(WebhookPage);
  }
  return <SidebarMenu menuItems={menuItems} path={routeProps.match.url} children={children} />;
};

const OrganizationRedirect = () => {
  const history = useHistory();
  
  useEffect(() => {
    console.log('OrganizationPage: redirecting to /projects/1');
    history.replace('/projects/1');
  }, [history]);
  
  return null;
};

const organizationPages = {};

if (ALLOW_ORGANIZATION_WEBHOOKS) {
  organizationPages[WebhookPage] = WebhookPage;
}

export const OrganizationPage = {
  title: "Organization",
  path: "/organization",
  exact: true,
  layout: MenuLayout,
  component: OrganizationRedirect, // ✅ CAMBIA DA PeoplePage A OrganizationRedirect
  pages: organizationPages,
};