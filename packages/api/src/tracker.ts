/**
 * packages/api/src/tracker.ts
 * TanStack Query hooks for tracker_service endpoints.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";
import { useProfile } from "./profile";
import type {
  DailyTrackerReminderStatus,
  FolicAcidLog,
  FolicAcidTodayStatus,
  HydrationLog,
  KickSession,
  MoodLog,
  Mood,
  SleepDurationBand,
  SleepLog,
  SleepQuality,
} from "@safeborn/types";

export const trackerKeys = {
  kicks: () => ["tracker", "kicks"] as const,
  hydration: () => ["tracker", "hydration"] as const,
  folicAcid: () => ["tracker", "folic-acid"] as const,
  sleep: () => ["tracker", "sleep"] as const,
  mood: () => ["tracker", "mood"] as const,
  dailyTrackerReminderStatus: () => ["tracker", "daily-reminder-status"] as const,
};

export function useDailyTrackerReminderStatus() {
  return useQuery({
    queryKey: trackerKeys.dailyTrackerReminderStatus(),
    queryFn: () =>
      apiRequest<DailyTrackerReminderStatus>("/notifications/daily-tracker/status", {
        method: "GET",
      }),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useKickSessions() {
  return useQuery({
    queryKey: trackerKeys.kicks(),
    queryFn: () => apiRequest<KickSession[]>("/tracker/kicks"),
  });
}

export function useStartKickSession() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: (gestational_week: number) => {
      if (!profile) return Promise.reject(new Error("onboarding_required"));
      return apiRequest<KickSession>("/tracker/kicks", {
        method: "POST",
        body: JSON.stringify({ gestational_week }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trackerKeys.kicks() }),
  });
}

export function useLogKick(sessionId: string) {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: (kicks_to_add: number = 1) => {
      if (!profile) return Promise.reject(new Error("onboarding_required"));
      return apiRequest<KickSession>(`/tracker/kicks/${sessionId}/log`, {
        method: "POST",
        body: JSON.stringify({ kicks_to_add }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trackerKeys.kicks() }),
  });
}

export function useEndKickSession(sessionId: string) {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: () => {
      if (!profile) return Promise.reject(new Error("onboarding_required"));
      return apiRequest<KickSession>(`/tracker/kicks/${sessionId}/end`, { method: "POST" });
    },
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
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: (data: { glasses_count: number; target_glasses?: number; log_date?: string }) => {
      if (!profile) return Promise.reject(new Error("onboarding_required"));
      return apiRequest<HydrationLog>("/tracker/hydration", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trackerKeys.hydration() }),
  });
}

export function useFolicAcidLogs() {
  return useQuery({
    queryKey: trackerKeys.folicAcid(),
    queryFn: () => apiRequest<FolicAcidLog[]>("/tracker/folic-acid"),
  });
}

export function useTodayFolicAcidLog() {
  return useQuery({
    queryKey: [...trackerKeys.folicAcid(), 'today'] as const,
    queryFn: () => apiRequest<FolicAcidTodayStatus | null>('/tracker/folic-acid/today'),
  });
}

export function useLogFolicAcid() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: (data: { taken: boolean; log_date?: string }) => {
      if (!profile) return Promise.reject(new Error("onboarding_required"));
      return apiRequest<FolicAcidLog>("/tracker/folic-acid", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trackerKeys.folicAcid() }),
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
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: (data: { duration_band: SleepDurationBand; quality: SleepQuality; notes?: string; log_date?: string }) => {
      if (!profile) return Promise.reject(new Error("onboarding_required"));
      return apiRequest<SleepLog>("/tracker/sleep", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
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
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: (data: { mood: Mood; notes?: string; log_date?: string }) => {
      if (!profile) return Promise.reject(new Error("onboarding_required"));
      return apiRequest<MoodLog>("/tracker/mood", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trackerKeys.mood() }),
  });
}
