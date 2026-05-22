/**
 * Chat types — mirrors chat_service Pydantic schemas.
 */

import type { UUID, ISODateString } from "./common";

export interface ChatSession {
  id: UUID;
  user_id: UUID;
  title: string | null;
  gestational_week: number;
  message_count: number;
  symptom_log_id: UUID | null;
  status: "active" | "closed";
  closed_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ChatMessage {
  id: UUID;
  session_id: UUID;
  user_id: UUID;
  role: "user" | "assistant";
  content: string;
  input_guardrail_violation: string | null;
  output_guardrail_violation: string | null;
  was_fallback_response: boolean;
  anthropic_model: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  created_at: ISODateString;
}

export interface ChatSessionDetail {
  session: ChatSession;
  messages: ChatMessage[];
}

export interface CreateSessionRequest {
  gestational_week: number;
  symptom_log_id?: UUID;
}

export interface SendMessageRequest {
  content: string;
}
