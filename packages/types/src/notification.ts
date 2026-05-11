/**
 * Notification types — mirrors notification_service Pydantic schemas.
 */

import type { UUID, ISODateString } from "./common";

export type DevicePlatform = "ios" | "android" | "web";

export interface PushToken {
  id: UUID;
  user_id: UUID;
  fcm_token: string;
  device_platform: DevicePlatform;
  device_name: string | null;
  is_active: boolean;
  created_at: ISODateString;
}

export interface NotificationPreferences {
  id: UUID;
  user_id: UUID;
  kick_reminders: boolean;
  hydration_reminders: boolean;
  appointment_reminders: boolean;
  weekly_updates: boolean;
  agent_action_alerts: boolean;
  message_delivery_alerts: boolean;
  auto_send_without_review: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  updated_at: ISODateString;
}

export interface UpdatePreferencesRequest {
  kick_reminders?: boolean;
  hydration_reminders?: boolean;
  appointment_reminders?: boolean;
  weekly_updates?: boolean;
  agent_action_alerts?: boolean;
  message_delivery_alerts?: boolean;
  auto_send_without_review?: boolean;
  quiet_hours_start?: number;
  quiet_hours_end?: number;
}
