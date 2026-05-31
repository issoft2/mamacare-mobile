/**
 * Auth types — mirrors Clerk JWT claims and user model.
 */

import type { UUID, ISODateString, Jurisdiction, Language } from "./common";

export type Plan = "Free" | "Standard" | "Premium";
export type PlanStatus = "Active" | "Trialing" | "Past_due" | "Cancelled" | "Paused";

export interface ClerkTokenData {
  clerk_user_id: string;
  plan: Plan;
  plan_status: PlanStatus;
}

export interface User {
  id: UUID;
  clerk_user_id: string;
  jurisdiction: Jurisdiction;
  preferred_language: Language;
  account_status: "Active" | "Suspended" | "Pending_deletion";
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface PlanLimits {
  care_team_members: number | null;
  messages_per_session: number | null;
  agent_triage: boolean;
  pre_appointment_summaries: boolean;
}

export interface Subscription {
  plan: Plan;
  plan_status: PlanStatus;
  is_active: boolean;
  limits: PlanLimits;
}
