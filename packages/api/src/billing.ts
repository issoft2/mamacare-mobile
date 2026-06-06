/**
 * packages/api/src/billing.ts
 * TanStack Query hooks for billing_service endpoints.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { Plan, SubscriptionResponse, UsageResponse } from "@safeborn/types";

export const billingKeys = {
  subscription: () => ["billing", "subscription"] as const,
  usage: () => ["billing", "usage"] as const,
};

export function useSubscription(): UseQueryResult<SubscriptionResponse> {
  return useQuery({
    queryKey: billingKeys.subscription(),
    queryFn: () => apiRequest<SubscriptionResponse>("/billing/subscription"),
  });
}

export function useSubscriptionLive(): UseQueryResult<SubscriptionResponse> {
  return useQuery({
    queryKey: [...billingKeys.subscription(), "live"],
    queryFn: () => apiRequest<SubscriptionResponse>("/billing/subscription/refresh"),
    staleTime: 0,
  });
}

export function useUsage(): UseQueryResult<UsageResponse> {
  return useQuery({
    queryKey: billingKeys.usage(),
    queryFn: () => apiRequest<UsageResponse>("/billing/usage"),
  });
}

export function useUpgradePlan(): UseMutationResult<unknown, unknown, Plan, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: Plan) =>
      apiRequest("/billing/upgrade", {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.subscription() });
      queryClient.invalidateQueries({ queryKey: billingKeys.usage() });
    },
  });
}
