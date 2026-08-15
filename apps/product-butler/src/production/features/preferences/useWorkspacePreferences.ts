import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useWorkspaceRuntime } from "../../app/WorkspaceRuntime";
import {
  DEFAULT_WORKSPACE_PREFERENCES,
  type WorkspacePreferences,
} from "../../domain/products";
import { __ } from "../../core/i18n/wordpress";

const PREFERENCES_KEY = ["workspace-preferences"] as const;

export function useWorkspacePreferences() {
  const { bootstrap, client } = useWorkspaceRuntime();
  const queryClient = useQueryClient();
  const enabled = bootstrap.features.preferences;
  const query = useQuery({
    enabled,
    queryFn: () => client.getPreferences(),
    queryKey: PREFERENCES_KEY,
  });
  const mutation = useMutation({
    mutationFn: (changes: Partial<WorkspacePreferences>) => client.updatePreferences(changes),
    onMutate: (changes) => {
      queryClient.setQueryData<WorkspacePreferences>(PREFERENCES_KEY, (current) => ({
        ...DEFAULT_WORKSPACE_PREFERENCES,
        ...current,
        ...changes,
      }));
    },
    onError: (error: Error) => {
      void queryClient.invalidateQueries({ queryKey: PREFERENCES_KEY });
      toast({
        description: error.message,
        title: __("Preferences were not saved", "yaxii-product-workspace"),
        variant: "destructive",
      });
    },
    onSuccess: (preferences) => {
      queryClient.setQueryData(PREFERENCES_KEY, preferences);
    },
    scope: { id: "workspace-preferences" },
  });

  const preferences = enabled
    ? (query.data ?? DEFAULT_WORKSPACE_PREFERENCES)
    : DEFAULT_WORKSPACE_PREFERENCES;

  return {
    isLoading: query.isPending && enabled,
    isSaving: mutation.isPending,
    preferences,
    reset: () => mutation.mutate(DEFAULT_WORKSPACE_PREFERENCES),
    update: <Key extends keyof WorkspacePreferences>(key: Key, value: WorkspacePreferences[Key]) => {
      mutation.mutate({ [key]: value });
    },
  };
}
