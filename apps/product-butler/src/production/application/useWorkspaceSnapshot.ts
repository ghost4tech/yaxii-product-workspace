import { useQuery } from "@tanstack/react-query";
import type { WorkspaceClient } from "./WorkspaceClient";

export function useWorkspaceSnapshot(client: WorkspaceClient) {
  return useQuery({
    queryKey: ["workspace-bootstrap"],
    queryFn: () => client.load(),
  });
}
