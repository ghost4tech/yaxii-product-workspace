import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { WorkspaceClient } from "../application/WorkspaceClient";
import { useWorkspaceSnapshot } from "../application/useWorkspaceSnapshot";
import { UnavailableState } from "../components/UnavailableState";
import { WorkspaceRoot } from "./WorkspaceRoot";

interface WorkspaceAppProps {
  client: WorkspaceClient;
  scope: HTMLElement;
}

function applyHostAttributes(scope: HTMLElement, direction: "ltr" | "rtl", locale: string) {
  scope.setAttribute("dir", direction);
  scope.setAttribute("lang", locale);
}

function WorkspaceBoundary({ client, scope }: WorkspaceAppProps) {
  const query = useWorkspaceSnapshot(client);

  useEffect(() => {
    if (query.data) {
      applyHostAttributes(scope, query.data.bootstrap.direction, query.data.bootstrap.locale);
    }
  }, [query.data, scope]);

  if (query.isPending) {
    return <div className="ypw-boundary-card">Loading Yaxii Product Workspace...</div>;
  }

  if (query.isError || !query.data) {
    return (
      <div className="ypw-boundary-card ypw-boundary-card--error" role="alert">
        The workspace could not be initialized. No product operation was attempted.
      </div>
    );
  }

  if (query.data.availability.kind !== "ready") {
    return <UnavailableState availability={query.data.availability} />;
  }

  const portalRoot = scope.querySelector<HTMLElement>("#yaxii-product-workspace-portals");
  if (!portalRoot) {
    return (
      <div className="ypw-boundary-card ypw-boundary-card--error" role="alert">
        The plugin-owned portal boundary is missing. No product operation was attempted.
      </div>
    );
  }

  return <WorkspaceRoot portalRoot={portalRoot} scope={scope} snapshot={query.data} />;
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
