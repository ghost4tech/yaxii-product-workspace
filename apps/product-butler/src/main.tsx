import { createRoot } from "react-dom/client";
import { WorkspaceApp } from "./production/app/WorkspaceApp";
import { createWorkspaceClient } from "./production/infrastructure/createWorkspaceClient";
import "./production/styles/tokens.css";
import "./production/styles/workspace.css";

const mount = document.getElementById("yaxii-product-workspace-app");
const scope = document.getElementById("yaxii-product-workspace");

if (!mount || !scope) {
  throw new Error("Yaxii Product Workspace mount elements are missing.");
}

createRoot(mount).render(
  <WorkspaceApp client={createWorkspaceClient(window.yaxiiProductWorkspaceConfig)} scope={scope} />,
);
