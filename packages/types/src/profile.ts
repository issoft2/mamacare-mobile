/**
 * Profile types — mirrors profile_service Pydantic schemas.
 */

import type { UUID, ISODateString } from "./common";

export interface Profile {
  id: UUID;
  user_id: UUID;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gestational_week: number;
  estimated_due_date: string;
  lmp_date: string | null;
  gravida: number | null;
  parity: number | null;
  blood_type: string | null;
  known_conditions: string[] | null;
  allergies: string[] | null;
  nhs_number: string | null;
  nhia_number: string | null;
  avatar_url: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateProfileRequest {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gestational_week: number;
  estimated_due_date: string;
  lmp_date?: string;
  blood_type?: string;
  known_conditions?: string[];
  allergies?: string[];
  nhs_number?: string;
  nhia_number?: string;
}

export interface UpdateProfileRequest extends Partial<CreateProfileRequest> {}

export interface CareTeamMember {
  id: UUID;
  user_id: UUID;
  role: "gp" | "obstetrician" | "midwife" | "specialist" | "other";
  full_name: string;
  practice_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_contact: "email" | "sms";
  trust_or_hospital: string | null;
  is_primary: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Appointment {
  id: UUID;
  user_id: UUID;
  care_team_member_id: UUID | null;
  appointment_type: string;
  scheduled_at: ISODateString;
  location: string | null;
  gestational_week_at_appt: number | null;
  summary_sent: boolean;
  status: "scheduled" | "completed" | "cancelled" | "missed";
  created_at: ISODateString;
  updated_at: ISODateString;
}
