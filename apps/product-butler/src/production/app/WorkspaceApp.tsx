import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { WorkspaceClient } from "../application/WorkspaceClient";

interface WorkspaceAppProps {
  client: WorkspaceClient;
  scope: HTMLElement;
}

function applyHostAttributes(scope: HTMLElement, direction: "ltr" | "rtl", locale: string) {
  scope.setAttribute("dir", direction);
  scope.setAttribute("lang", locale);
}

function WorkspaceBoundary({ client, scope }: WorkspaceAppProps) {
  const query = useQuery({
    queryKey: ["workspace-bootstrap"],
    queryFn: () => client.load(),
  });

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
      <div className="ypw-boundary-card ypw-boundary-card--error">
        The workspace could not be initialized.
      </div>
    );
  }

  if (query.data.availability.kind !== "ready") {
    const message =
      query.data.availability.kind === "woocommerce-unavailable"
        ? "WooCommerce must be installed and active before the Product Workspace can be used."
        : "The Product Workspace frontend is unavailable in this WordPress host.";

    return (
      <section className="ypw-boundary-card" aria-labelledby="ypw-unavailable-title">
        <p className="ypw-eyebrow">Yaxii Product Workspace</p>
        <h2 id="ypw-unavailable-title">Workspace unavailable</h2>
        <p>{message}</p>
      </section>
    );
  }

  return (
    <section className="ypw-boundary-card" aria-labelledby="ypw-ready-title">
      <p className="ypw-eyebrow">Yaxii Product Workspace</p>
      <h2 id="ypw-ready-title">Frontend host ready</h2>
      <p>The production workspace boundary is connected to this WordPress admin screen.</p>
    </section>
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
