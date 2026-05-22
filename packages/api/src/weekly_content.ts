/**
 * mobile/packages/api/src/content.ts
 *
 * React Query hooks for weekly pregnancy content.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyContentSource {
  title: string;
  url: string;
}

export interface WeeklyContent {
  week_number: number;
  trimester: number;
  title: string;
  overview: string;
  baby_size_label: string | null;
  baby_size_cm: number | null;
  baby_weight_g: number | null;
  baby_development: string | null;
  what_to_expect: string | null;
  common_symptoms: string[];
  warning_signs: string[];
  tips: string[];
  checklist_items: string[];
  sources: WeeklyContentSource[];
  content_version: string;
  reviewed_by: string | null;
}

export interface CurrentWeekResponse {
  available: boolean;
  current_week?: number;
  content?: WeeklyContent;
  reason?: "no_week_set" | "out_of_range" | "content_missing";
  message?: string;
}

export interface WeeklyContentSummary {
  week_number: number;
  trimester: number;
  title: string;
  overview: string;
  baby_size_label: string | null;
}

// ── Query keys ───────────────────────────────────────────────────────────────

export const contentKeys = {
  all: ["content"] as const,
  currentWeek: () => [...contentKeys.all, "current"] as const,
  week: (n: number) => [...contentKeys.all, "week", n] as const,
  allWeeks: () => [...contentKeys.all, "list"] as const,
};

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useCurrentWeekContent() {
  return useQuery({
    queryKey: contentKeys.currentWeek(),
    queryFn: () =>
      apiRequest<CurrentWeekResponse>("/content/weekly/current", {
        method: "GET",
      }),
    staleTime: 1000 * 60 * 60, // 1 hour — content barely changes
  });
}

export function useWeekContent(week: number) {
  return useQuery({
    queryKey: contentKeys.week(week),
    queryFn: () =>
      apiRequest<{ content: WeeklyContent }>(`/content/weekly/${week}`, {
        method: "GET",
      }),
    enabled: week >= 1 && week <= 42,
    staleTime: 1000 * 60 * 60,
  });
}

export function useAllWeeks() {
  return useQuery({
    queryKey: contentKeys.allWeeks(),
    queryFn: () =>
      apiRequest<{ weeks: WeeklyContentSummary[] }>("/content/weekly", {
        method: "GET",
      }),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours — list is very stable
  });
}