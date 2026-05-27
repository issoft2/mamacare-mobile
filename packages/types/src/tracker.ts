/**
 * Tracker types — mirrors tracker_service Pydantic schemas.
 */

import type { UUID, ISODateString } from "./common";

export interface KickSession {
  id: UUID;
  user_id: UUID;
  gestational_week: number;
  kick_count: number;
  started_at: ISODateString;
  ended_at: ISODateString | null;
  duration_minutes: number | null;
  concern_flagged: boolean;
  created_at: ISODateString;
}

export interface HydrationLog {
  id: UUID;
  user_id: UUID;
  log_date: ISODateString;
  glasses_count: number;
  target_glasses: number;
  created_at: ISODateString;
}

export type SleepDurationBand = "under_4h" | "4_6h" | "6_8h" | "over_8h";
export type SleepQuality = "poor" | "fair" | "good";

export interface SleepLog {
  id: UUID;
  user_id: UUID;
  log_date: ISODateString;
  duration_band: SleepDurationBand;
  quality: SleepQuality;
  notes: string | null;
  created_at: ISODateString;
}

export type Mood = "happy" | "neutral" | "anxious" | "low";

export interface MoodLog {
  id: UUID;
  user_id: UUID;
  log_date: ISODateString;
  mood: Mood;
  notes: string | null;
  streak_alert_sent: boolean;
  created_at: ISODateString;
}

export interface FolicAcidLog {
  id: UUID;
  user_id: UUID;
  log_date: ISODateString;
  taken: boolean;
  created_at: ISODateString;
}
