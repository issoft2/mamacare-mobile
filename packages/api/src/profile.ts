/**
 * packages/api/src/profile.ts
 * TanStack Query hooks for profile_service endpoints.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiRequestError } from "./client";
import type {
  Appointment,
  CareTeamMember,
  CreateProfileRequest,
  Profile,
  UpdateProfileRequest,
} from "@mumcare/types";

export type ConsentTier = "marketing" | "system_improvement" | "anon_commercial" | "model_training";

export type ConsentEventPayload = {
  user_id: string;
  clerk_user_id: string;
  consent_tier: ConsentTier;
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

export async function postConsentEvents(events: ConsentEventPayload[]): Promise<void> {
  await Promise.all(
    events.map((payload) =>
      apiRequest<void>("/data/consent", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    )
  );
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
