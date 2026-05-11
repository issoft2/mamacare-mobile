/**
 * Billing types — mirrors billing_service Pydantic schemas.
 */

import type { Plan, PlanStatus, PlanLimits } from "./auth";

export interface SubscriptionResponse {
  plan: Plan;
  plan_status: PlanStatus;
  is_active: boolean;
  limits: PlanLimits;
}

export interface UsageResponse {
  plan: Plan;
  usage: {
    care_team_members: { current: number; limit: number | null; at_limit: boolean };
    symptom_logs: { current: number; limit: number | null };
    active_chat_sessions: { current: number; limit: number | null };
  };
  features: {
    agent_triage: boolean;
    pre_appointment_summaries: boolean;
    messages_per_session: number | null;
  };
}

export interface PlanChangeRequest {
  plan: Plan;
}
