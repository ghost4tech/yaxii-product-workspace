import { useQuery } from "@tanstack/react-query";
import { useWorkspaceRuntime } from "../../app/WorkspaceRuntime";

export function useOperationPulse() {
  const { bootstrap, client } = useWorkspaceRuntime();
  return useQuery({
    enabled: bootstrap.features.operationQueue,
    queryFn: () => client.getOperationSummary(),
    queryKey: ["operations", "pulse"],
  });
}
