import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiRequestError, apiRequest } from "@mumcare/api";

const DEFAULT_CHANNEL_ID = "default";
const PUSH_TOKEN_CACHE_PREFIX = "pushToken";
const PUSH_TOKENS_ENDPOINT = "/notifications/push-tokens";
const PUSH_TOKEN_DEACTIVATE_ENDPOINT = "/notifications/push-tokens/deactivate";
const DEFAULT_NOTIFICATION_ROUTE = "/tabs/home";
const PREFS_CACHE_KEY = "notificationPreferences";
const PUSH_EVENT_CACHE_KEY = "pushNotificationEvents";

let didConfigure = false;

type PushTokenSyncResult =
  | { status: "skipped"; reason: string }
  | { status: "denied"; reason: string }
  | { status: "cached"; token: string }
  | { status: "registered"; token: string }
  | { status: "deferred"; reason: string }
  | { status: "failed"; reason: string };

type NotificationPrefsLike = {
  hydration_reminders?: boolean;
  kick_reminders?: boolean;
  appointment_reminders?: boolean;
  weekly_updates?: boolean;
};

type PushEventType = "received" | "opened" | "routed";

export type NotificationType =
  | "daily_tracker_reminder"
  | "kick_reminder"
  | "appointment_reminder"
  | "weekly_update"
  | "unknown";

function tokenCacheKey(userId: string): string {
  return `${PUSH_TOKEN_CACHE_PREFIX}:${userId}`;
}

function prefsCacheKey(userId: string): string {
  return `${PREFS_CACHE_KEY}:${userId}`;
}

function normalizeRoute(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function fallbackRouteByType(notificationType: unknown): string {
  switch (notificationType) {
    case "daily_tracker_reminder":
    case "kick_reminder":
      return "/tabs/tracker";
    case "appointment_reminder":
      return "/profile/appointments";
    case "weekly_update":
      return "/tabs/home";
    default:
      return DEFAULT_NOTIFICATION_ROUTE;
  }
}

function normalizeNotificationType(value: unknown): NotificationType {
  if (typeof value !== "string") {
    return "unknown";
  }
  switch (value.trim()) {
    case "daily_tracker_reminder":
      return "daily_tracker_reminder";
    case "kick_reminder":
      return "kick_reminder";
    case "appointment_reminder":
      return "appointment_reminder";
    case "weekly_update":
      return "weekly_update";
    default:
      return "unknown";
  }
}

function getNotificationEnabledByPrefs(
  notificationType: NotificationType,
  prefs: NotificationPrefsLike | null
): boolean {
  if (!prefs) {
    return true;
  }

  switch (notificationType) {
    case "daily_tracker_reminder":
      return prefs.hydration_reminders !== false;
    case "kick_reminder":
      return prefs.kick_reminders !== false;
    case "appointment_reminder":
      return prefs.appointment_reminders !== false;
    case "weekly_update":
      return prefs.weekly_updates !== false;
    default:
      return true;
  }
}

function isPushTokenEndpointUnavailable(err: unknown): boolean {
  if (!(err instanceof ApiRequestError)) {
    return false;
  }
  return err.status === 404 || err.status === 405 || err.status === 501;
}

function hasGrantedNotificationPermission(value: unknown): boolean {
  const settings = value as {
    granted?: boolean;
    status?: string;
    ios?: { status?: number };
  };

  if (settings.granted === true) {
    return true;
  }
  if (settings.status === "granted") {
    return true;
  }
  // iOS provisional authorization still allows delivering notifications.
  if (settings.ios?.status === 2 || settings.ios?.status === 3) {
    return true;
  }
  return false;
}

function getExpoProjectId(): string | null {
  const fromEas = (Constants.easConfig as { projectId?: string } | null)?.projectId;
  const fromExtra = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  const projectId = (fromEas ?? fromExtra ?? "").trim();
  return projectId.length > 0 ? projectId : null;
}

export async function configurePushNotificationsAsync(): Promise<void> {
  if (didConfigure) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
      name: "General",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default",
    });
  }

  didConfigure = true;
}

export function getRouteFromNotificationResponse(
  response: Notifications.NotificationResponse | null | undefined
): string {
  const data = response?.notification?.request?.content?.data;
  const fromDeepLink = normalizeRoute((data as Record<string, unknown> | undefined)?.deep_link);
  if (fromDeepLink) {
    return fromDeepLink;
  }
  return fallbackRouteByType((data as Record<string, unknown> | undefined)?.notification_type);
}

export function getNotificationTypeFromResponse(
  response: Notifications.NotificationResponse | null | undefined
): NotificationType {
  const data = response?.notification?.request?.content?.data;
  return normalizeNotificationType((data as Record<string, unknown> | undefined)?.notification_type);
}

export function getRouteFromNotification(
  notification: Notifications.Notification | null | undefined
): string {
  const data = notification?.request?.content?.data;
  const fromDeepLink = normalizeRoute((data as Record<string, unknown> | undefined)?.deep_link);
  if (fromDeepLink) {
    return fromDeepLink;
  }
  return fallbackRouteByType((data as Record<string, unknown> | undefined)?.notification_type);
}

export function getNotificationTypeFromNotification(
  notification: Notifications.Notification | null | undefined
): NotificationType {
  const data = notification?.request?.content?.data;
  return normalizeNotificationType((data as Record<string, unknown> | undefined)?.notification_type);
}

export async function shouldShowForegroundBannerForUserAsync(params: {
  userId: string | null | undefined;
  notificationType: NotificationType;
}): Promise<boolean> {
  if (!params.userId) {
    return true;
  }

  try {
    const scoped = await AsyncStorage.getItem(prefsCacheKey(params.userId));
    const raw = scoped ?? (await AsyncStorage.getItem(PREFS_CACHE_KEY));
    if (!raw) {
      return true;
    }
    const parsed = JSON.parse(raw) as NotificationPrefsLike;
    return getNotificationEnabledByPrefs(params.notificationType, parsed);
  } catch {
    return true;
  }
}

export async function recordPushNotificationEventAsync(params: {
  event: PushEventType;
  notificationType: NotificationType;
  route: string;
}): Promise<void> {
  try {
    const existingRaw = await AsyncStorage.getItem(PUSH_EVENT_CACHE_KEY);
    const existing = existingRaw ? (JSON.parse(existingRaw) as Array<Record<string, unknown>>) : [];
    const next = [
      {
        event: params.event,
        notification_type: params.notificationType,
        route: params.route,
        at: new Date().toISOString(),
      },
      ...existing,
    ].slice(0, 50);
    await AsyncStorage.setItem(PUSH_EVENT_CACHE_KEY, JSON.stringify(next));
  } catch {
    // non-blocking telemetry cache
  }
}

export async function registerDevicePushTokenForUserAsync(
  userId: string
): Promise<PushTokenSyncResult> {
  if (Platform.OS === "web") {
    return { status: "skipped", reason: "Web push is not part of native push setup." };
  }

  await configurePushNotificationsAsync();

  const existing = await Notifications.getPermissionsAsync();
  let isGranted = hasGrantedNotificationPermission(existing);
  if (!isGranted) {
    const requested = await Notifications.requestPermissionsAsync();
    isGranted = hasGrantedNotificationPermission(requested);
  }

  if (!isGranted) {
    return { status: "denied", reason: "Notification permission was not granted." };
  }

  const projectId = getExpoProjectId();
  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();
  const token = tokenResponse.data;

  const cacheKey = tokenCacheKey(userId);
  const cachedToken = await AsyncStorage.getItem(cacheKey);
  if (cachedToken === token) {
    return { status: "cached", token };
  }

  try {
    await apiRequest(PUSH_TOKENS_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({
        fcm_token: token,
        device_platform: Platform.OS === "ios" ? "ios" : "android",
        device_name: null,
        is_active: true,
      }),
    });
    await AsyncStorage.setItem(cacheKey, token);
    return { status: "registered", token };
  } catch (err) {
    if (isPushTokenEndpointUnavailable(err)) {
      return {
        status: "deferred",
        reason: "Push token endpoint is not available yet.",
      };
    }
    return {
      status: "failed",
      reason: err instanceof Error ? err.message : "Unknown push token registration error.",
    };
  }
}

export async function deactivateDevicePushTokenForUserAsync(
  userId: string | null | undefined
): Promise<void> {
  if (!userId || Platform.OS === "web") {
    return;
  }

  const cacheKey = tokenCacheKey(userId);
  const token = await AsyncStorage.getItem(cacheKey);
  if (!token) {
    return;
  }

  try {
    await apiRequest(PUSH_TOKEN_DEACTIVATE_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ fcm_token: token }),
    });
  } catch (err) {
    if (!isPushTokenEndpointUnavailable(err)) {
      // eslint-disable-next-line no-console
      console.warn("Failed to deactivate push token:", err);
    }
  } finally {
    await AsyncStorage.removeItem(cacheKey);
  }
}

export async function signOutWithPushCleanup(params: {
  userId: string | null | undefined;
  signOut: () => Promise<void> | void;
}): Promise<void> {
  await deactivateDevicePushTokenForUserAsync(params.userId);
  await params.signOut();
}
