import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import App from "@/App";
import type { WorkspaceClient } from "../application/WorkspaceClient";
import { useWorkspaceSnapshot } from "../application/useWorkspaceSnapshot";
import { PortalProvider } from "../components/PortalProvider";
import { UnavailableState } from "../components/UnavailableState";
import { toLanguageTag } from "../core/i18n/locale";
import { WorkspaceRuntimeProvider } from "./WorkspaceRuntime";

interface WorkspaceAppProps {
  client: WorkspaceClient;
  scope: HTMLElement;
}

function WorkspaceBoundary({ client, scope }: WorkspaceAppProps) {
  const query = useWorkspaceSnapshot(client);

  useEffect(() => {
    if (!query.data) {
      return;
    }
    scope.setAttribute("dir", query.data.bootstrap.direction);
    scope.setAttribute("lang", toLanguageTag(query.data.bootstrap.locale));
  }, [query.data, scope]);

  if (query.isPending) {
    return <div className="panel m-4 p-5 text-sm">Loading Yaxii Product Workspace…</div>;
  }

  if (query.isError || !query.data) {
    return <UnavailableState availability={{ kind: "host-unavailable" }} />;
  }

  if (query.data.availability.kind !== "ready") {
    return (
      <UnavailableState
        availability={query.data.availability}
        locale={query.data.bootstrap.locale}
      />
    );
  }

  const portalRoot = scope.querySelector<HTMLElement>("#yaxii-product-workspace-portals");
  if (!portalRoot) {
    return <UnavailableState availability={{ kind: "host-unavailable" }} />;
  }

  return (
    <WorkspaceRuntimeProvider scope={scope}>
      <PortalProvider container={portalRoot}>
        <App />
      </PortalProvider>
    </WorkspaceRuntimeProvider>
  );
}

export function WorkspaceApp(props: WorkspaceAppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceBoundary {...props} />
    </QueryClientProvider>
  );
}
