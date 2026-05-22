/**
 * Admin / platform stats (data service).
 */

export interface DashboardStats {
  registered_users: number;
  symptom_logs_7d: number;
  agent_runs_7d: number;
  active_users_30d: number;
  ai_tokens_month: number;
}

export interface AgentActivityDay {
  /** YYYY-MM-DD, UTC */
  date: string;
  runs: number;
  /** urgency_tier = notify_* or emergency_advised */
  escalated: number;
}

export interface AgentActivityResponse {
  items: AgentActivityDay[];
}
