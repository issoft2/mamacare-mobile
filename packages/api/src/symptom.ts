/**
 * packages/api/src/symptom.ts
 * TanStack Query hooks for symptom_service endpoints.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type {
  SubmitSymptomRequest,
  SymptomLog,
  SymptomLogListPage,
  SymptomPatternsResponse,
} from "@safeborn/types";

export const symptomKeys = {
  all: ["symptoms"] as const,
  logs: (filters?: object) => [...symptomKeys.all, "logs", filters] as const,
  log: (id: string) => [...symptomKeys.all, "log", id] as const,
  patterns: () => [...symptomKeys.all, "patterns"] as const,
};

export function useSymptomLogs(
  limit = 20,
  offset = 0,
  severity: string | null = null
) {
  const queryKey = symptomKeys.logs({ limit, offset, severity: severity ?? null });
  return useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (severity) {
        params.set("severity", severity);
      }
      return apiRequest<SymptomLogListPage>(`/symptoms/logs?${params.toString()}`);
    },
  });
}

export function useSymptomLog(id: string) {
  return useQuery({
    queryKey: symptomKeys.log(id),
    queryFn: () => apiRequest<SymptomLog>(`/symptoms/logs/${id}`),
    enabled: !!id,
  });
}

export function useSubmitSymptom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitSymptomRequest) =>
      apiRequest<SymptomLog>("/symptoms/logs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: symptomKeys.all });
    },
  });
}

export function useSymptomPatterns(periodDays = 7) {
  return useQuery({
    queryKey: symptomKeys.patterns(),
    queryFn: () =>
      apiRequest<SymptomPatternsResponse>(
        `/symptoms/patterns?period_days=${periodDays}`
      ),
  });
}
