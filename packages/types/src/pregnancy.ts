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
  created_at?: ISODateString;
  updated_at?: ISODateString;
}

export type PregnancyHistoryItem = Pregnancy;
