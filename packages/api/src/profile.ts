/**
 * packages/api/src/profile.ts
 * TanStack Query hooks for profile_service endpoints.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryResult, type UseMutationResult } from "@tanstack/react-query";
import { apiRequest, ApiRequestError } from "./client";
import type {
  Appointment,
  CareTeamMember,
  CreateProfileRequest,
  Profile,
  UpdateProfileRequest,
  Pregnancy,
  PregnancyHistoryItem,
  CreatePregnancyInput,
  UpdatePregnancyInput,
  PregnancySummary,
} from "@safeborn/types";

export type ConsentTier = "marketing" | "system_improvement" | "anon_commercial" | "model_training";
type BackendConsentTier = ConsentTier | Uppercase<ConsentTier>;

export type ConsentEventPayload = {
  user_id: string;
  clerk_user_id: string;
  consent_tier: BackendConsentTier;
  action: "granted" | "withdrawn";
  consent_text_version: string;
  jurisdiction: "NG" | "GB";
  ip_address: string;
  captured_at: string;
  documentType: "privacy" | "terms";
  language: string;
  appVersion: string;
  source: "onboarding" | "setting";
};

const CONSENT_TIER_FALLBACKS: Record<ConsentTier, BackendConsentTier[]> = {
  marketing: ["marketing", "MARKETING"],
  system_improvement: ["system_improvement", "SYSTEM_IMPROVEMENT"],
  anon_commercial: ["anon_commercial", "ANON_COMMERCIAL"],
  model_training: ["model_training", "MODEL_TRAINING"],
};

async function postSingleConsentEvent(payload: ConsentEventPayload): Promise<void> {
  const tier = payload.consent_tier.toLowerCase() as ConsentTier;
  const fallbackTiers = CONSENT_TIER_FALLBACKS[tier] ?? [payload.consent_tier];
  let lastError: unknown = null;

  for (const consentTier of fallbackTiers) {
    try {
      await apiRequest<void>("/data/consent", {
        method: "POST",
        body: JSON.stringify({ ...payload, consent_tier: consentTier }),
      });
      return;
    } catch (err) {
      lastError = err;
      const isTierValidationError =
        err instanceof ApiRequestError &&
        err.code === "VALIDATION_ERROR" &&
        err.body?.error?.field === "consent_tier";

      if (!isTierValidationError) {
        throw err;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to post consent event.");
}

export async function postConsentEvents(events: ConsentEventPayload[]): Promise<void> {
  await Promise.all(events.map((payload) => postSingleConsentEvent(payload)));
}

export function useAddCareTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CareTeamMember, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
      apiRequest<CareTeamMember>("/profile/care-team", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.careTeam() }),
  });
}

export const profileKeys = {
  all: ["profile"] as const,
  detail: () => [...profileKeys.all, "detail"] as const,
  careTeam: () => [...profileKeys.all, "care-team"] as const,
  appointments: () => [...profileKeys.all, "appointments"] as const,
};

export const pregnancyKeys = {
  all:     ["pregnancy"] as const,
  list:    () => [...pregnancyKeys.all, "list"] as const,
  active:  () => [...pregnancyKeys.all, "active"] as const,
  history: () => [...pregnancyKeys.all, "history"] as const,
  detail:  (id: string) => [...pregnancyKeys.all, id] as const,
  summary: (id: string) => [...pregnancyKeys.all, id, "summary"] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: () => apiRequest<Profile>("/profile"),
    // Missing profile (404) is a valid state — do not keep retrying.
    retry: (failureCount, err) => {
      if (err instanceof ApiRequestError && err.isNotFound) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useActivePregnancy() {
  return useQuery<Pregnancy | null>({
    queryKey: pregnancyKeys.active(),
    queryFn: async () => {
      try {
        return await apiRequest<Pregnancy>("/profile/pregnancies/current");
      } catch (err) {
        if (err instanceof ApiRequestError && err.isNotFound) {
          return null;
        }
        throw err;
      }
    },
    retry: (failureCount, err) => {
      if (err instanceof ApiRequestError && err.isNotFound) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function usePregnancyHistory() {
  return useQuery({
    queryKey: pregnancyKeys.history(),
    queryFn: async () => {
      try {
        return await apiRequest<PregnancyHistoryItem[]>("/profile/pregnancies");
      } catch (err) {
        if (err instanceof ApiRequestError && err.isNotFound) {
          return [];
        }
        throw err;
      }
    },
    retry: false,
  });
}

/** @deprecated Use useCreatePregnancy for all new code. Kept for backward compat. */
export function useStartNewPregnancy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<Pregnancy>("/pregnancies/new", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pregnancyKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      queryClient.invalidateQueries({ queryKey: ["tracker"] });
      queryClient.invalidateQueries({ queryKey: ["symptoms"] });
      queryClient.invalidateQueries({ queryKey: ["chat"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useCreatePregnancy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePregnancyInput) =>
      apiRequest<Pregnancy>("/profile/pregnancies", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pregnancyKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      queryClient.invalidateQueries({ queryKey: ["tracker"] });
      queryClient.invalidateQueries({ queryKey: ["symptoms"] });
      queryClient.invalidateQueries({ queryKey: ["chat"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useGetPregnancies() {
  return useQuery({
    queryKey: pregnancyKeys.list(),
    queryFn: () => apiRequest<Pregnancy[]>("/profile/pregnancies"),
    retry: false,
  });
}

export function useUpdatePregnancy(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePregnancyInput) =>
      apiRequest<Pregnancy>(`/profile/pregnancies/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pregnancyKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useGetPregnancySummary(id: string) {
  return useQuery({
    queryKey: pregnancyKeys.summary(id),
    queryFn: () => apiRequest<PregnancySummary>(`/profile/pregnancies/${id}/summary`),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProfileRequest) =>
      apiRequest<Profile>("/profile", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.all }),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      apiRequest<Profile>("/profile", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.all }),
  });
}

export function useCareTeam() {
  return useQuery({
    queryKey: profileKeys.careTeam(),
    queryFn: () => apiRequest<CareTeamMember[]>("/profile/care-team"),
  });
}

export function useAppointments() {
  return useQuery({
    queryKey: profileKeys.appointments(),
    queryFn: () => apiRequest<Appointment[]>("/profile/appointments"),
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      appointment_type: string;
      scheduled_at: string;
      location?: string | null;
      care_team_member_id?: string | null;
    }) =>
      apiRequest<Appointment>("/profile/appointments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.appointments() }),
  });
}
