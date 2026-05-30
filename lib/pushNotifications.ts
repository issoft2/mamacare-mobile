import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiRequestError, apiRequest } from "@mumcare/api";

const DEFAULT_CHANNEL_ID = "default";
const PUSH_TOKEN_CACHE_PREFIX = "pushToken";
const PUSH_TOKEN_ID_CACHE_PREFIX = "pushTokenId";
const PUSH_TOKENS_ENDPOINT = "/notifications/push-tokens";
const PUSH_TOKEN_DEACTIVATE_ENDPOINTS = [
  "/notifications/push-tokens/deactivate",
  "/notifications/push-token/deactivate",
  "/notifications/push_tokens/deactivate",
] as const;
const DEFAULT_NOTIFICATION_ROUTE = "/tabs/home";
const PREFS_CACHE_KEY = "notificationPreferences";
const PUSH_EVENT_CACHE_KEY = "pushNotificationEvents";

let didConfigure = false;
let notificationsModulePromise: Promise<typeof import("expo-notifications")> | null = null;

async function getNotificationsModuleAsync() {
  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications");
  }
  return notificationsModulePromise;
}

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

function tokenIdCacheKey(userId: string): string {
  return `${PUSH_TOKEN_ID_CACHE_PREFIX}:${userId}`;
}

export function isExpoGoEnvironment(): boolean {
  // Expo Go reports appOwnership as "expo".
  return Constants.appOwnership === "expo";
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

function formatPushApiError(err: unknown): string {
  if (err instanceof ApiRequestError) {
    const field = (err.body?.error as { field?: string } | undefined)?.field;
    const fieldSuffix = field ? ` field=${field}` : "";
    return `status=${err.status} code=${err.code}${fieldSuffix} message=${err.message}`;
  }
  return err instanceof Error ? err.message : "unknown_error";
}

async function tryRegisterPushTokenAsync(params: {
  token: string;
  platform: "ios" | "android";
}): Promise<
  | { ok: true; tokenId: string | null }
  | { ok: false; reason: string; endpointUnavailable: boolean }
> {
  const appVersion = Constants.expoConfig?.version ?? "unknown";
  const deviceName =
    typeof Constants.deviceName === "string" && Constants.deviceName.trim().length > 0
      ? Constants.deviceName.trim()
      : null;
  const payload = {
    token: params.token,
    device_platform: params.platform,
    device_name: deviceName,
    app_version: appVersion,
    is_active: true,
  } as const;

  const attemptErrors: string[] = [];
  try {
    const response = await apiRequest<{ id?: string } | unknown>(PUSH_TOKENS_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const tokenId =
      response && typeof response === "object" && "id" in response &&
      typeof (response as { id?: unknown }).id === "string"
        ? (response as { id: string }).id
        : null;
    return { ok: true, tokenId };
  } catch (err) {
    attemptErrors.push(`POST ${PUSH_TOKENS_ENDPOINT} -> ${formatPushApiError(err)}`);
    return {
      ok: false,
      reason: attemptErrors.join(" | "),
      endpointUnavailable: isPushTokenEndpointUnavailable(err),
    };
  }
}

function isExpoPushToken(value: string): boolean {
  return /^ExponentPushToken\[[^\]]+\]$/.test(value) || /^ExpoPushToken\[[^\]]+\]$/.test(value);
}

async function tryDeactivatePushTokenAsync(token: string): Promise<void> {
  const payloadVariants = [
    { fcm_token: token, token },
    { token },
  ] as const;
  const methods = ["POST", "PATCH", "DELETE"] as const;

  for (const endpoint of PUSH_TOKEN_DEACTIVATE_ENDPOINTS) {
    for (const method of methods) {
      for (const body of payloadVariants) {
        try {
          await apiRequest(endpoint, {
            method,
            body: JSON.stringify(body),
          });
          return;
        } catch {
          // Try next shape/endpoint/method.
        }
      }
    }
  }
}

async function patchDeactivateByIdAsync(tokenId: string): Promise<void> {
  await apiRequest(`/notifications/push-tokens/${tokenId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: false }),
  });
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

  if (isExpoGoEnvironment()) {
    didConfigure = true;
    return;
  }

  const Notifications = await getNotificationsModuleAsync();

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
  response: {
    notification?: {
      request?: {
        content?: { data?: Record<string, unknown> };
      };
    };
  } | null | undefined
): string {
  const data = response?.notification?.request?.content?.data;
  const fromDeepLink = normalizeRoute((data as Record<string, unknown> | undefined)?.deep_link);
  if (fromDeepLink) {
    return fromDeepLink;
  }
  return fallbackRouteByType((data as Record<string, unknown> | undefined)?.notification_type);
}

export function getNotificationTypeFromResponse(
  response: {
    notification?: {
      request?: {
        content?: { data?: Record<string, unknown> };
      };
    };
  } | null | undefined
): NotificationType {
  const data = response?.notification?.request?.content?.data;
  return normalizeNotificationType((data as Record<string, unknown> | undefined)?.notification_type);
}

export function getRouteFromNotification(
  notification: {
    request?: {
      content?: { data?: Record<string, unknown> };
    };
  } | null | undefined
): string {
  const data = notification?.request?.content?.data;
  const fromDeepLink = normalizeRoute((data as Record<string, unknown> | undefined)?.deep_link);
  if (fromDeepLink) {
    return fromDeepLink;
  }
  return fallbackRouteByType((data as Record<string, unknown> | undefined)?.notification_type);
}

export function getNotificationTypeFromNotification(
  notification: {
    request?: {
      content?: { data?: Record<string, unknown> };
    };
  } | null | undefined
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

  if (isExpoGoEnvironment()) {
    return {
      status: "skipped",
      reason:
        "Remote push notifications are not supported in Expo Go on SDK 53+. Use a development build.",
    };
  }

  await configurePushNotificationsAsync();

  const Notifications = await getNotificationsModuleAsync();

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
  let token: string;
  try {
    const tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    token = tokenResponse.data;
  } catch (err) {
    return {
      status: "failed",
      reason: `Failed to fetch Expo push token: ${formatPushApiError(err)}`,
    };
  }

  const cacheKey = tokenCacheKey(userId);
  const tokenIdKey = tokenIdCacheKey(userId);
  const cachedToken = await AsyncStorage.getItem(cacheKey);
  const wasCached = cachedToken === token;

  if (!isExpoPushToken(token)) {
    return {
      status: "failed",
      reason: "Push token format is invalid for notifications API (expected ExpoPushToken/ExponentPushToken).",
    };
  }

  try {
    const registration = await tryRegisterPushTokenAsync({
      token,
      platform: Platform.OS === "ios" ? "ios" : "android",
    });
    if (!registration.ok) {
      if (registration.endpointUnavailable) {
        return {
          status: "deferred",
          reason: "Push token endpoint is not available yet.",
        };
      }
      return {
        status: "failed",
        reason: `All push token registration attempts failed: ${registration.reason}`,
      };
    }

    await AsyncStorage.setItem(cacheKey, token);
    if (registration.tokenId) {
      await AsyncStorage.setItem(tokenIdKey, registration.tokenId);
    }
    if (wasCached) {
      return { status: "cached", token };
    }
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
  const tokenIdKey = tokenIdCacheKey(userId);
  const token = await AsyncStorage.getItem(cacheKey);
  const tokenId = await AsyncStorage.getItem(tokenIdKey);
  if (!token) {
    return;
  }

  try {
    if (tokenId) {
      try {
        await patchDeactivateByIdAsync(tokenId);
      } catch {
        await tryDeactivatePushTokenAsync(token);
      }
    } else {
      await tryDeactivatePushTokenAsync(token);
    }
  } catch (err) {
    if (!isPushTokenEndpointUnavailable(err)) {
      // eslint-disable-next-line no-console
      console.warn("Failed to deactivate push token:", err);
    }
  } finally {
    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(tokenIdKey);
  }
}

export async function signOutWithPushCleanup(params: {
  userId: string | null | undefined;
  signOut: () => Promise<void> | void;
}): Promise<void> {
  await deactivateDevicePushTokenForUserAsync(params.userId);
  await params.signOut();
}
