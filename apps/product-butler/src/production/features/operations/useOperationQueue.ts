import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useWorkspaceRuntime } from "../../app/WorkspaceRuntime";
import type { OperationPage } from "../../domain/products";
import { operationFilters, operationToQueueProduct, type QueueStatus } from "./operationQueue";
import { __ } from "../../core/i18n/wordpress";

export function useOperationQueue(search: string, status: QueueStatus, perPage: number) {
  const { bootstrap, client } = useWorkspaceRuntime();
  const queryClient = useQueryClient();
  const filters = operationFilters(status);
  const queryKey = ["operations", search, status, perPage] as const;
  const query = useInfiniteQuery<OperationPage>({
    enabled: bootstrap.features.operationQueue,
    getNextPageParam: (page) => page.has_more ? page.page + 1 : undefined,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => client.listOperations({
      ...filters,
      page: typeof pageParam === "number" ? pageParam : 1,
      perPage,
      search,
      signal,
    }),
    queryKey,
    refetchInterval: (state) => state.state.data?.pages.some((page) => page.counts.pending > 0) ? 5_000 : false,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["operations"] });
  const dismiss = useMutation({
    mutationFn: (operationId: string) => client.dismissOperation(operationId),
    onError: (error: Error) => toast({ description: error.message, title: __("Queue item was not dismissed", "yaxii-product-workspace"), variant: "destructive" }),
    onSettled: invalidate,
  });
  const retry = useMutation({
    mutationFn: (operationId: string) => client.retryOperation(operationId),
    onError: (error: Error) => toast({ description: error.message, title: __("Retry was not started", "yaxii-product-workspace"), variant: "destructive" }),
    onSettled: invalidate,
  });
  const reconcile = useMutation({
    mutationFn: (operationId: string) => client.getOperation(operationId),
    onError: (error: Error) => toast({ description: error.message, title: __("Operation was not reconciled", "yaxii-product-workspace"), variant: "destructive" }),
    onSettled: invalidate,
  });
  const pages = query.data?.pages ?? [];

  return {
    counts: pages[0]?.counts ?? { all: 0, draft: 0, error: 0, pending: 0, synced: 0 },
    dismiss: (operationId: string) => dismiss.mutate(operationId),
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isLoading: query.isPending,
    isError: query.isError,
    isMutating: dismiss.isPending || reconcile.isPending || retry.isPending,
    products: pages.flatMap((page) => page.items.map((item) => operationToQueueProduct(item, bootstrap))),
    reconcile: (operationId: string) => reconcile.mutate(operationId),
    retry: (operationId: string) => retry.mutate(operationId),
    total: pages[0]?.total ?? 0,
  };
}
