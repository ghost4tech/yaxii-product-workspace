import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-800.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/jetbrains-mono/latin-600.css";
import { createRoot } from "react-dom/client";
import { WorkspaceApp } from "./production/app/WorkspaceApp";
import { createWorkspaceClient } from "./production/infrastructure/createWorkspaceClient";
import "./production/styles/tokens.css";
import "./index.css";
import "./production/styles/components.css";
import "./production/styles/preferences.css";
import "./production/styles/rich-text.css";

const mount = document.getElementById("yaxii-product-workspace-app");
const scope = document.getElementById("yaxii-product-workspace");

if (!mount || !scope) {
  throw new Error("Yaxii Product Workspace mount elements are missing.");
}

createRoot(mount).render(
  <WorkspaceApp client={createWorkspaceClient(window.yaxiiProductWorkspaceConfig)} scope={scope} />,
);
