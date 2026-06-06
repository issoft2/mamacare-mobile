import type { UUID, ISODateString } from "./common";

export type PregnancyStatus = "active" | "archived" | "completed";

export interface Pregnancy {
  id: UUID;
  user_id?: UUID;
  status: PregnancyStatus;
  estimated_due_date: ISODateString;
  baby_nickname?: string | null;
  gestational_week?: number | null;
  delivery_date?: ISODateString | null;
  pregnancy_number?: number;
  lmp_date?: ISODateString | null;
  gravida?: number | null;
  parity?: number | null;
  conception_date?: ISODateString | null;
  is_multiple_gestation?: boolean;
  started_at?: ISODateString;
  ended_at?: ISODateString | null;
  created_at?: ISODateString;
  updated_at?: ISODateString;
}

export type PregnancyHistoryItem = Pregnancy;

export interface CreatePregnancyInput {
  baby_nickname?: string;
  estimated_due_date?: string;
  lmp_date?: string;
  conception_date?: string;
  gestational_week?: number;
  is_multiple_gestation?: boolean;
  gravida?: number;
  parity?: number;
}

export type UpdatePregnancyInput = Partial<CreatePregnancyInput> & {
  status?: PregnancyStatus;
  delivery_date?: string | null;
};

export interface PregnancySummary {
  pregnancy: Pregnancy;
  total_symptoms: number;
  total_appointments: number;
  total_kick_sessions: number;
  total_hydration_logs: number;
  total_sleep_logs: number;
  total_mood_logs: number;
  total_folic_acid_logs: number;
  total_chat_sessions: number;
}
