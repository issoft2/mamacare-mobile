/**
 * Admin/platform stats: GET /data/stats/dashboard and GET /data/stats/agent-activity.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { AgentActivityResponse, DashboardStats } from "@mumcare/types";

export const dashboardStatsKeys = {
  all: ["dashboard-stats"] as const,
  detail: () => [...dashboardStatsKeys.all, "detail"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardStatsKeys.detail(),
    queryFn: () => apiRequest<DashboardStats>("/data/stats/dashboard"),
  });
}

export const agentActivityKeys = {
  all: ["agent-activity"] as const,
  byDays: (days: number) => [...agentActivityKeys.all, days] as const,
};

export function useAgentActivity(options?: { days?: number }) {
  const days = options?.days ?? 7;
  return useQuery({
    queryKey: agentActivityKeys.byDays(days),
    queryFn: () =>
      apiRequest<AgentActivityResponse>(`/data/stats/agent-activity?days=${days}`),
  });
}
