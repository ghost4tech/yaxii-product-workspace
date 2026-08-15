import { useQuery } from "@tanstack/react-query";
import type { WorkspaceClient } from "./WorkspaceClient";

export function useWorkspaceSnapshot(client: WorkspaceClient) {
  return useQuery({
    queryKey: ["yaxii-product-workspace", "snapshot"],
    queryFn: () => client.load(),
  });
}
