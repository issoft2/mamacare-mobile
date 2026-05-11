/**
 * Symptom types — mirrors symptom_service Pydantic schemas.
 */

import type { UUID, ISODateString } from "./common";

export type Severity = "mild" | "moderate" | "severe" | "unspecified";
export type UrgencyTier = "none" | "log_only" | "notify_midwife" | "notify_doctor" | "emergency_advised";
export type OnsetDuration = "just_started" | "few_hours" | "since_yesterday" | "ongoing";

export interface SymptomEntry {
  id: UUID;
  log_id: UUID;
  user_id: UUID;
  symptom_code: string;
  symptom_label: string;
  body_area_code: string | null;
  onset_duration: OnsetDuration | null;
  created_at: ISODateString;
}

export interface SymptomLog {
  id: UUID;
  user_id: UUID;
  gestational_week: number;
  source: "chat" | "builder" | "manual" | "agent";
  severity: Severity;
  urgency_score: number | null;
  urgency_tier: UrgencyTier | null;
  free_text_notes: string | null;
  ai_chat_summary: string | null;
  home_remedies_shown: string[] | null;
  action_taken: string | null;
  notified_doctor: boolean;
  notified_at: ISODateString | null;
  version: number;
  parent_log_id: UUID | null;
  is_current: boolean;
  symptoms: SymptomEntry[];
  created_at: ISODateString;
}

/** Summary row from GET /symptoms/logs (codes only, no full entry objects). */
export interface SymptomLogListItem {
  id: UUID;
  user_id: UUID;
  gestational_week: number;
  source: "chat" | "builder" | "manual" | "agent";
  severity: Severity;
  urgency_score: number | null;
  urgency_tier: UrgencyTier | null;
  notified_doctor: boolean;
  is_current: boolean;
  symptom_codes: string[];
  created_at: ISODateString;
}

export interface SymptomLogListPage {
  items: SymptomLogListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface SubmitSymptomRequest {
  symptoms: {
    symptom_code: string;
    symptom_label: string;
    body_area_code?: string;
    onset_duration?: OnsetDuration;
  }[];
  severity: Severity;
  free_text_notes?: string;
  gestational_week: number;
  source?: "builder" | "manual";
}

export interface SymptomPatternItem {
  symptom_code: string;
  symptom_label: string;
  occurrence_count: number;
  first_seen_at: ISODateString;
  last_seen_at: ISODateString;
  alert: boolean;
  alert_message: string | null;
}

export interface SymptomPatternsResponse {
  patterns: SymptomPatternItem[];
  period_days: number;
  has_alerts: boolean;
}
