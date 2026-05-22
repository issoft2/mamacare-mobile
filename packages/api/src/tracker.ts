/**
 * packages/api/src/tracker.ts
 * TanStack Query hooks for tracker_service endpoints.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type {
  HydrationLog,
  KickSession,
  MoodLog,
  Mood,
  SleepDurationBand,
  SleepLog,
  SleepQuality,
} from "@mumcare/types";

export const trackerKeys = {
  kicks: () => ["tracker", "kicks"] as const,
  hydration: () => ["tracker", "hydration"] as const,
  sleep: () => ["tracker", "sleep"] as const,
  mood: () => ["tracker", "mood"] as const,
};

export function useKickSessions() {
  return useQuery({
    queryKey: trackerKeys.kicks(),
    queryFn: () => apiRequest<KickSession[]>("/tracker/kicks"),
  });
}

export function useStartKickSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gestational_week: number) =>
      apiRequest<KickSession>("/tracker/kicks", {
        method: "POST",
        body: JSON.stringify({ gestational_week }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trackerKeys.kicks() }),
  });
}

export function useLogKick(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (kicks_to_add: number = 1) =>
      apiRequest<KickSession>(`/tracker/kicks/${sessionId}/log`, {
        method: "POST",
        body: JSON.stringify({ kicks_to_add }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trackerKeys.kicks() }),
  });
}

export function useEndKickSession(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiRequest<KickSession>(`/tracker/kicks/${sessionId}/end`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trackerKeys.kicks() }),
  });
}

export function useHydrationLogs() {
  return useQuery({
    queryKey: trackerKeys.hydration(),
    queryFn: () => apiRequest<HydrationLog[]>("/tracker/hydration"),
  });
}

export function useLogHydration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { glasses_count: number; target_glasses?: number }) =>
      apiRequest<HydrationLog>("/tracker/hydration", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trackerKeys.hydration() }),
  });
}

export function useSleepLogs() {
  return useQuery({
    queryKey: trackerKeys.sleep(),
    queryFn: () => apiRequest<SleepLog[]>("/tracker/sleep"),
  });
}

export function useLogSleep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { duration_band: SleepDurationBand; quality: SleepQuality; notes?: string }) =>
      apiRequest<SleepLog>("/tracker/sleep", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trackerKeys.sleep() }),
  });
}

export function useMoodLogs() {
  return useQuery({
    queryKey: trackerKeys.mood(),
    queryFn: () => apiRequest<MoodLog[]>("/tracker/mood"),
  });
}

export function useLogMood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { mood: Mood; notes?: string }) =>
      apiRequest<MoodLog>("/tracker/mood", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trackerKeys.mood() }),
  });
}
