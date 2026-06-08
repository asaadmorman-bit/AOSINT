import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * useResolveAlert — optimistically marks an OsintAlert as resolved.
 * Rolls back on error.
 */
export function useResolveAlert(queryKey = ["osint-alerts"]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.OsintAlert.update(id, { status, resolved_at: new Date().toISOString() }),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old = []) =>
        old.map(alert => alert.id === id ? { ...alert, status } : alert)
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * useCreateAlert — optimistically inserts a new OsintAlert into the list.
 * Rolls back on error.
 */
export function useCreateAlert(queryKey = ["osint-alerts"]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertData) => base44.entities.OsintAlert.create(alertData),

    onMutate: async (alertData) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      const optimistic = {
        ...alertData,
        id: `optimistic-${Date.now()}`,
        created_date: new Date().toISOString(),
        status: alertData.status || "new",
      };
      queryClient.setQueryData(queryKey, (old = []) => [optimistic, ...old]);
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * useUpdateIndicatorStatus — optimistically updates a ThreatIndicator's status.
 */
export function useUpdateIndicatorStatus(queryKey = ["indicators"]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.ThreatIndicator.update(id, { status }),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old = []) =>
        old.map(ind => ind.id === id ? { ...ind, status } : ind)
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}