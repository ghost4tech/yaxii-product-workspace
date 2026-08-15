import { useQuery } from "@tanstack/react-query";
import { useWorkspaceRuntime } from "../../app/WorkspaceRuntime";

export function useOperationSummary() {
  const { bootstrap, client } = useWorkspaceRuntime();
  const query = useQuery({
    enabled: bootstrap.features.operationQueue,
    queryFn: ({ signal }) => client.listOperations({ page: 1, perPage: 10, signal, state: "all" }),
    queryKey: ["operations", "summary"],
    refetchInterval: (state) => (state.state.data?.counts.pending ?? 0) > 0 ? 5_000 : false,
  });
  return query.data?.counts ?? { all: 0, draft: 0, error: 0, pending: 0, synced: 0 };
}
