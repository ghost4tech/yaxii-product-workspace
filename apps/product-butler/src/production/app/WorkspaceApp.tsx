import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DirectionProvider } from "@radix-ui/react-direction";
import { useEffect, useState } from "react";
import workspaceLogo from "../../../../../assets/img/yaxii-product-workspace-logo.svg";
import App from "@/App";
import type { WorkspaceClient } from "../application/WorkspaceClient";
import { useWorkspaceSnapshot } from "../application/useWorkspaceSnapshot";
import { PortalProvider } from "../components/PortalProvider";
import { UnavailableState } from "../components/UnavailableState";
import { toLanguageTag } from "../core/i18n/locale";
import { WorkspaceRuntimeProvider } from "./WorkspaceRuntime";
import { __ } from "../core/i18n/wordpress";

interface WorkspaceAppProps {
  client: WorkspaceClient;
  scope: HTMLElement;
}

function WorkspaceLoading() {
  return (
    <div className="workspace-shell flex min-h-screen items-center justify-center bg-background px-6" role="status" aria-label={__("Loading Yaxii Product Workspace", "yaxii-product-workspace")}>
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <img src={workspaceLogo} alt="" className="h-11 w-11" />
          <span className="absolute -inset-2 -z-10 rounded-2xl bg-primary/10 motion-safe:animate-pulse" aria-hidden="true" />
        </div>
        <p className="mt-4 text-[13px] font-semibold">Yaxii Product Workspace</p>
        <div className="mt-3 h-1 w-20 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className="h-full w-full rounded-full bg-primary/70 motion-safe:animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function WorkspaceBoundary({ client, scope }: WorkspaceAppProps) {
  const query = useWorkspaceSnapshot(client);

  useEffect(() => {
    if (!query.data) {
      return;
    }
    scope.setAttribute("dir", query.data.bootstrap.direction);
    scope.setAttribute("lang", toLanguageTag(query.data.bootstrap.locale));
    const portalRoot = scope.querySelector<HTMLElement>("#yaxii-product-workspace-portals");
    portalRoot?.setAttribute("dir", query.data.bootstrap.direction);
    portalRoot?.setAttribute("lang", toLanguageTag(query.data.bootstrap.locale));
  }, [query.data, scope]);

  if (query.isPending) {
    return <WorkspaceLoading />;
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
    <WorkspaceRuntimeProvider bootstrap={query.data.bootstrap} client={client} scope={scope}>
      <DirectionProvider dir={query.data.bootstrap.direction}>
        <PortalProvider container={portalRoot}>
          <App />
        </PortalProvider>
      </DirectionProvider>
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
