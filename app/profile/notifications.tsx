/**
 * mobile/app/profile/notifications.tsx
 *
 * Notification preferences screen.
 *
 * Designed with emotional UX principles for pregnant users:
 *  - Soft cream background reduces visual stress
 *  - Conversational, warm copy (not tech-speak)
 *  - Grouped into 3 clear sections: Daily care / Your care team / From your assistant
 *  - "Pause all" master toggle gives the user control on hard days
 *  - Inline status banners (no jarring native alerts)
 *  - Auto-save on toggle with revert on error
 *  - Fetches existing preferences so the screen reflects reality
 */

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/clerk-expo";

import { apiRequest } from "@mumcare/api";
import { colors, spacing, typography } from "@mumcare/ui";
import { getErrorMessage } from "@/lib/errors";
import { resolveCurrentGestationalWeek } from "@/lib/gestationalWeek";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

// ── Types ────────────────────────────────────────────────────────────────────

type PrefKey =
  | "kick_reminders"
  | "hydration_reminders"
  | "appointment_reminders"
  | "weekly_updates"
  | "agent_action_alerts"
  | "message_delivery_alerts";

type Preferences = Record<PrefKey, boolean>;
type QuietHourKey = "quiet_hours_start" | "quiet_hours_end";

type NotificationSettings = Preferences & {
  auto_send_without_review: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
};

interface PrefItem {
  key: PrefKey;
  label: string;
  description: string;
}

interface PrefGroup {
  title: string;
  intro: string;
  items: PrefItem[];
}

// ── Configuration ────────────────────────────────────────────────────────────

const GROUPS: PrefGroup[] = [
  {
    title: "Daily care",
    intro: "Gentle reminders to help your day.",
    items: [
      {
        key: "kick_reminders",
        label: "Baby movement check-ins",
        description:
          "A daily nudge to count kicks, when your baby is most active.",
      },
      {
        key: "hydration_reminders",
        label: "Daily tracker reminders",
        description:
          "Gentle prompts for your daily check-ins like hydration, folic acid intake, rest, symptoms, and mood.",
      },
    ],
  },
  {
    title: "Your care team",
    intro: "Updates about appointments and the people supporting you.",
    items: [
      {
        key: "appointment_reminders",
        label: "Upcoming appointments",
        description: "A heads-up before each visit, so nothing sneaks up.",
      },
      {
        key: "message_delivery_alerts",
        label: "When we reach your care team",
        description:
          "Quiet confirmation when a message is sent on your behalf.",
      },
    ],
  },
  {
    title: "From your assistant",
    intro: "Updates and check-ins from mumcare itself.",
    items: [
      {
        key: "weekly_updates",
        label: "Weekly pregnancy notes",
        description:
          "What's happening this week, written in plain language.",
      },
      {
        key: "agent_action_alerts",
        label: "When we step in to help",
        description:
          "If mumcare takes an action for you, we'll let you know.",
      },
    ],
  },
];

const ALL_KEYS: PrefKey[] = GROUPS.flatMap((g) => g.items.map((i) => i.key));

const DEFAULT_PREFS: Preferences = {
  kick_reminders: false,
  hydration_reminders: false,
  appointment_reminders: false,
  weekly_updates: false,
  agent_action_alerts: false,
  message_delivery_alerts: false,
};

const DEFAULT_SETTINGS: NotificationSettings = {
  ...DEFAULT_PREFS,
  auto_send_without_review: false,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

const CREAM = AUTH_UI.warmBackground;
const PREFS_CACHE_KEY = "notificationPreferences";
const MIN_WEEK_FOR_KICK_REMINDERS = 16;
let runtimePrefsCache: NotificationSettings | null = null;
let runtimePrefsCacheKey: string | null = null;

function normalizeSettings(
  input?: Partial<NotificationSettings> | null
): NotificationSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(input ?? {}),
  };
}

function pickKnownSettings(
  input?: Partial<NotificationSettings> | null
): Partial<NotificationSettings> {
  if (!input) {
    return {};
  }

  const knownBooleanKeys: Array<PrefKey | "auto_send_without_review"> = [
    ...ALL_KEYS,
    "auto_send_without_review",
  ];

  const next: Partial<NotificationSettings> = {};

  knownBooleanKeys.forEach((key) => {
    const value = input[key];
    if (typeof value === "boolean") {
      next[key] = value;
    }
  });

  const start = input.quiet_hours_start;
  if (typeof start === "number" || start === null) {
    next.quiet_hours_start = start;
  }

  const end = input.quiet_hours_end;
  if (typeof end === "number" || end === null) {
    next.quiet_hours_end = end;
  }

  return next;
}

function formatHour(hour: number | null): string {
  if (hour == null) {
    return "Not set";
  }

  const normalized = ((hour % 24) + 24) % 24;
  const suffix = normalized >= 12 ? "PM" : "AM";
  const h12 = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${h12}:00 ${suffix}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const scopedCacheKey = userId ? `${PREFS_CACHE_KEY}:${userId}` : PREFS_CACHE_KEY;

  const [prefs, setPrefs] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [gestationalWeek, setGestationalWeek] = useState<number | null>(null);

  function readWebPrefsCache(key: string): NotificationSettings | null {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
      return normalizeSettings(parsed);
    } catch {
      return null;
    }
  }

  function writeWebPrefsCache(key: string, next: NotificationSettings) {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Ignore localStorage failures and rely on AsyncStorage/runtime cache.
    }
  }

  async function savePrefsToCache(next: NotificationSettings) {
    runtimePrefsCache = next;
    runtimePrefsCacheKey = scopedCacheKey;
    writeWebPrefsCache(scopedCacheKey, next);

    try {
      await AsyncStorage.setItem(scopedCacheKey, JSON.stringify(next));
    } catch {
      // Non-blocking: remote source of truth is still attempted.
    }
  }

  async function loadPrefsFromCache(): Promise<NotificationSettings | null> {
    if (runtimePrefsCache && runtimePrefsCacheKey === scopedCacheKey) {
      return runtimePrefsCache;
    }

    try {
      const raw = await AsyncStorage.getItem(scopedCacheKey);
      if (!raw) {
        // Migrate legacy global cache key for backward compatibility.
        const legacyRaw = await AsyncStorage.getItem(PREFS_CACHE_KEY);
        if (legacyRaw) {
          const legacyParsed = normalizeSettings(
            JSON.parse(legacyRaw) as Partial<NotificationSettings>
          );
          await AsyncStorage.setItem(scopedCacheKey, JSON.stringify(legacyParsed));
          runtimePrefsCache = legacyParsed;
          runtimePrefsCacheKey = scopedCacheKey;
          return legacyParsed;
        }

        const scopedWeb = readWebPrefsCache(scopedCacheKey);
        if (scopedWeb) {
          runtimePrefsCache = scopedWeb;
          runtimePrefsCacheKey = scopedCacheKey;
          return scopedWeb;
        }

        const legacyWeb = readWebPrefsCache(PREFS_CACHE_KEY);
        if (legacyWeb) {
          writeWebPrefsCache(scopedCacheKey, legacyWeb);
          runtimePrefsCache = legacyWeb;
          runtimePrefsCacheKey = scopedCacheKey;
          return legacyWeb;
        }

        return null;
      }

      const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
      const next = normalizeSettings(parsed);
      runtimePrefsCache = next;
      runtimePrefsCacheKey = scopedCacheKey;
      return next;
    } catch {
      const scopedWeb = readWebPrefsCache(scopedCacheKey);
      if (scopedWeb) {
        runtimePrefsCache = scopedWeb;
        runtimePrefsCacheKey = scopedCacheKey;
        return scopedWeb;
      }
      const legacyWeb = readWebPrefsCache(PREFS_CACHE_KEY);
      if (legacyWeb) {
        runtimePrefsCache = legacyWeb;
        runtimePrefsCacheKey = scopedCacheKey;
      }
      return legacyWeb;
    }
  }

  // Load existing preferences on mount
  useEffect(() => {
    (async () => {
      const cached = await loadPrefsFromCache();
      const basePrefs = cached ?? DEFAULT_SETTINGS;
      setPrefs(basePrefs);

      try {
        const data = await apiRequest<Partial<NotificationSettings>>(
          "/notifications/preferences",
          { method: "GET" }
        );
        const serverPrefs = pickKnownSettings(data);
        const hasServerPrefs = Object.keys(serverPrefs).length > 0;

        // If we already have local user choices, keep them as the display source of truth.
        const next = cached
          ? basePrefs
          : hasServerPrefs
            ? normalizeSettings(serverPrefs)
            : basePrefs;

        setPrefs(next);
        await savePrefsToCache(next);
      } catch (err) {
        // If the user has never set preferences, the API may 404.
        // Keep cached values when available; otherwise all switches stay off.
      }

      try {
        const profile = await apiRequest<{
          gestational_week?: number | null;
          estimated_due_date?: string | null;
          lmp_date?: string | null;
        }>("/profile", {
          method: "GET",
        });
        const week = resolveCurrentGestationalWeek(profile);
        if (typeof week === "number") {
          setGestationalWeek(week);
        }
      } catch {
        // Keep week unknown if profile is unavailable.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allMuted = ALL_KEYS.every((k) => !prefs[k]);
  const canToggleKickReminder =
    gestationalWeek != null && gestationalWeek >= MIN_WEEK_FOR_KICK_REMINDERS;

  async function persistChange(next: NotificationSettings) {
    setError("");
    try {
      await apiRequest("/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify(next),
      });
      await savePrefsToCache(next);
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Couldn't save right now."));
      return false;
    }
  }

  async function handleToggle(key: PrefKey, next: boolean) {
    const prev = prefs[key];
    const optimistic = { ...prefs, [key]: next };
    setPrefs(optimistic);
    await savePrefsToCache(optimistic);
    setSavingKey(key);

    const ok = await persistChange(optimistic);

    setSavingKey(null);

    if (ok) {
      setSavedKey(key);
      setTimeout(() => {
        setSavedKey((current) => (current === key ? null : current));
      }, 1800);
    } else {
      // Revert the toggle on error
      const reverted = { ...optimistic, [key]: prev };
      setPrefs(reverted);
      await savePrefsToCache(reverted);
    }
  }

  async function handlePauseAll(pauseAll: boolean) {
    const next = ALL_KEYS.reduce((acc, k) => {
      acc[k] = !pauseAll;
      return acc;
    }, { ...prefs } as NotificationSettings);

    const prev = prefs;
    setPrefs(next);
    await savePrefsToCache(next);
    setSavingKey("__all__");

    const ok = await persistChange(next);
    setSavingKey(null);

    if (ok) {
      setSavedKey("__all__");
      setTimeout(() => {
        setSavedKey((current) =>
          current === "__all__" ? null : current
        );
      }, 1800);
    } else {
      setPrefs(prev);
      await savePrefsToCache(prev);
    }
  }

  async function handleAutoSendWithoutReview(next: boolean) {
    const optimistic: NotificationSettings = {
      ...prefs,
      auto_send_without_review: next,
    };
    setPrefs(optimistic);
    await savePrefsToCache(optimistic);
    setSavingKey("auto_send_without_review");

    const ok = await persistChange(optimistic);
    setSavingKey(null);

    if (ok) {
      setSavedKey("auto_send_without_review");
      setTimeout(() => {
        setSavedKey((current) =>
          current === "auto_send_without_review" ? null : current
        );
      }, 1800);
      return;
    }

    const reverted: NotificationSettings = {
      ...optimistic,
      auto_send_without_review: prefs.auto_send_without_review,
    };
    setPrefs(reverted);
    await savePrefsToCache(reverted);
  }

  async function handleAdjustQuietHour(key: QuietHourKey, direction: 1 | -1) {
    const current = prefs[key] ?? (key === "quiet_hours_start" ? 22 : 7);
    const nextValue = (current + direction + 24) % 24;
    const optimistic: NotificationSettings = {
      ...prefs,
      [key]: nextValue,
    };

    setPrefs(optimistic);
    await savePrefsToCache(optimistic);
    setSavingKey(key);

    const ok = await persistChange(optimistic);
    setSavingKey(null);

    if (ok) {
      setSavedKey(key);
      setTimeout(() => {
        setSavedKey((currentKey) => (currentKey === key ? null : currentKey));
      }, 1800);
      return;
    }

    setPrefs(prefs);
    await savePrefsToCache(prefs);
  }

  async function handleClearQuietHours() {
    const optimistic: NotificationSettings = {
      ...prefs,
      quiet_hours_start: null,
      quiet_hours_end: null,
    };

    setPrefs(optimistic);
    await savePrefsToCache(optimistic);
    setSavingKey("quiet_hours");

    const ok = await persistChange(optimistic);
    setSavingKey(null);

    if (ok) {
      setSavedKey("quiet_hours");
      setTimeout(() => {
        setSavedKey((current) => (current === "quiet_hours" ? null : current));
      }, 1800);
      return;
    }

    setPrefs(prefs);
    await savePrefsToCache(prefs);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={AUTH_UI.linkBerry} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.bgOverlay}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/tabs/profile")}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={AUTH_UI.textHeading} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>How should we reach you?</Text>
        <Text style={styles.subtitle}>
          Turn things on or off any time. Your changes save as you go.
        </Text>

        {/* ── Status banners ── */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle"
              size={18}
              color={AUTH_UI.redAlertText}
              style={{ marginRight: spacing[2] }}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {savingKey && !error ? (
          <View style={styles.savingBanner}>
            <ActivityIndicator
              size="small"
              color={colors.navy[500]}
              style={{ marginRight: spacing[2] }}
            />
            <Text style={styles.savingText}>Saving your preference…</Text>
          </View>
        ) : null}

        {savedKey && !savingKey && !error ? (
          <View style={styles.successBanner}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={AUTH_UI.greenSuccessText}
              style={{ marginRight: spacing[2] }}
            />
            <Text style={styles.successText}>Saved</Text>
          </View>
        ) : null}

        {/* ── Pause-all card ── */}
        <View style={styles.pauseCard}>
          <View style={styles.pauseRow}>
            <View style={{ flex: 1, paddingRight: spacing[3] }}>
              <Text style={styles.pauseTitle}>
                {allMuted ? "Everything's paused" : "Pause everything"}
              </Text>
              <Text style={styles.pauseHint}>
                {allMuted
                  ? "Turn this back off when you're ready."
                  : "Quiet all notifications for now. You can resume any time."}
              </Text>
            </View>
            <Switch
              value={allMuted}
              onValueChange={(v) => handlePauseAll(v)}
              trackColor={{ false: colors.rose[100], true: colors.rose[400] }}
              thumbColor={allMuted ? colors.rose[500] : colors.white}
              ios_backgroundColor={colors.rose[100]}
            />
          </View>
        </View>

        {/* ── Preference groups ── */}
        {GROUPS.map((group) => (
          <View key={group.title} style={styles.section}>
            <Text style={styles.sectionLabel}>{group.title}</Text>
            <Text style={styles.sectionHint}>{group.intro}</Text>

            <View style={styles.groupCard}>
              {group.items.map((item, idx) => (
                (() => {
                  const isKickReminder = item.key === "kick_reminders";
                  const isKickLocked = isKickReminder && !canToggleKickReminder;

                  return (
                <View
                  key={item.key}
                  style={[
                    styles.row,
                    idx < group.items.length - 1 && styles.rowDivider,
                  ]}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={styles.rowDescription}>
                      {item.description}
                    </Text>
                    {isKickLocked ? (
                      <Text style={styles.rowNote}>
                        {gestationalWeek == null
                          ? `Available from week ${MIN_WEEK_FOR_KICK_REMINDERS} of pregnancy.`
                          : `Available from week ${MIN_WEEK_FOR_KICK_REMINDERS}. You are currently week ${gestationalWeek}.`}
                      </Text>
                    ) : null}
                  </View>
                  <Switch
                    value={isKickLocked ? false : (prefs[item.key] ?? false)}
                    onValueChange={(v) => handleToggle(item.key, v)}
                    trackColor={{
                      false: colors.rose[100],
                      true: colors.rose[400],
                    }}
                    thumbColor={
                      isKickLocked
                        ? colors.rose[200]
                        : prefs[item.key]
                          ? colors.rose[500]
                          : colors.white
                    }
                    ios_backgroundColor={colors.rose[100]}
                    disabled={savingKey === item.key || isKickLocked}
                  />
                </View>
                  );
                })()
              ))}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Message safety</Text>
          <Text style={styles.sectionHint}>
            Choose whether mumcare should always ask before sending messages.
          </Text>

          <View style={styles.groupCard}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Review before sending</Text>
                <Text style={styles.rowDescription}>
                  Keep this on if you want to approve messages before they go out.
                </Text>
              </View>
              <Switch
                value={!prefs.auto_send_without_review}
                onValueChange={(reviewEnabled) =>
                  handleAutoSendWithoutReview(!reviewEnabled)
                }
                trackColor={{
                  false: colors.rose[100],
                  true: colors.rose[400],
                }}
                thumbColor={!prefs.auto_send_without_review ? colors.rose[500] : colors.white}
                ios_backgroundColor={colors.rose[100]}
                disabled={savingKey === "auto_send_without_review"}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quiet hours</Text>
          <Text style={styles.sectionHint}>
            Silence non-urgent notifications during your rest window.
          </Text>
          <Text style={styles.quietHourSummary}>
            {prefs.quiet_hours_start != null && prefs.quiet_hours_end != null
              ? `Active window: ${formatHour(prefs.quiet_hours_start)} - ${formatHour(prefs.quiet_hours_end)}`
              : "No quiet hours set yet."}
          </Text>

          <View style={styles.groupCard}>
            <View style={styles.quietHourRow}>
              <Text style={styles.quietHourLabel}>Start</Text>
              <View style={styles.quietHourControls}>
                <TouchableOpacity
                  style={styles.hourButton}
                  onPress={() => handleAdjustQuietHour("quiet_hours_start", -1)}
                  activeOpacity={0.84}
                  disabled={Boolean(savingKey)}
                >
                  <Ionicons name="remove" size={18} color={AUTH_UI.linkBerry} />
                </TouchableOpacity>
                <Text style={styles.hourValue}>{formatHour(prefs.quiet_hours_start)}</Text>
                <TouchableOpacity
                  style={styles.hourButton}
                  onPress={() => handleAdjustQuietHour("quiet_hours_start", 1)}
                  activeOpacity={0.84}
                  disabled={Boolean(savingKey)}
                >
                  <Ionicons name="add" size={18} color={AUTH_UI.linkBerry} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.quietHourRow, styles.rowDivider]}>
              <Text style={styles.quietHourLabel}>End</Text>
              <View style={styles.quietHourControls}>
                <TouchableOpacity
                  style={styles.hourButton}
                  onPress={() => handleAdjustQuietHour("quiet_hours_end", -1)}
                  activeOpacity={0.84}
                  disabled={Boolean(savingKey)}
                >
                  <Ionicons name="remove" size={18} color={AUTH_UI.linkBerry} />
                </TouchableOpacity>
                <Text style={styles.hourValue}>{formatHour(prefs.quiet_hours_end)}</Text>
                <TouchableOpacity
                  style={styles.hourButton}
                  onPress={() => handleAdjustQuietHour("quiet_hours_end", 1)}
                  activeOpacity={0.84}
                  disabled={Boolean(savingKey)}
                >
                  <Ionicons name="add" size={18} color={AUTH_UI.linkBerry} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.clearQuietHoursButton}
              onPress={handleClearQuietHours}
              activeOpacity={0.86}
              disabled={Boolean(savingKey)}
            >
              <Text style={styles.clearQuietHoursText}>Clear quiet hours</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </LinearGradient>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  bgOverlay: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CREAM,
  },

  // Header
  header: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[2],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    backgroundColor: AUTH_UI.textWhite,
  },

  // Content
  content: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },

  // Titles
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: AUTH_UI.textHeading,
    marginBottom: spacing[2],
    letterSpacing: -0.5,
    fontFamily: FONT_WARM_SERIF,
  },
  subtitle: {
    fontSize: 16,
    color: AUTH_UI.textBlack,
    marginBottom: spacing[5],
    lineHeight: 24,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  // Banners (reused pattern from medical screen)
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AUTH_UI.redAlertBg,
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  errorText: {
    flex: 1,
    color: AUTH_UI.redAlertText,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.4,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  savingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.rose[100],
  },
  savingText: {
    color: AUTH_UI.textBlack,
    fontSize: typography.fontSize.sm,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AUTH_UI.greenSuccessBg,
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  successText: {
    color: AUTH_UI.greenSuccessText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  // Pause-all card
  pauseCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rose[100],
    borderRadius: 16,
    padding: spacing[4],
    marginBottom: spacing[6],
  },
  pauseRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pauseTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AUTH_UI.textHeading,
    marginBottom: 2,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  pauseHint: {
    fontSize: typography.fontSize.xs,
    color: AUTH_UI.textBlack,
    lineHeight: typography.fontSize.xs * 1.5,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  // Sections
  section: {
    marginBottom: spacing[8],
  },
  sectionLabel: {
    fontSize: 24,
    fontWeight: "800",
    color: AUTH_UI.textHeading,
    marginBottom: spacing[1],
    letterSpacing: -0.3,
    fontFamily: FONT_WARM_SERIF,
  },
  sectionHint: {
    fontSize: typography.fontSize.sm,
    color: AUTH_UI.textBlack,
    marginBottom: spacing[3],
    lineHeight: typography.fontSize.sm * 1.5,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  // Group card
  groupCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rose[100],
    borderRadius: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.rose[50],
  },
  rowText: {
    flex: 1,
    paddingRight: spacing[4],
  },
  rowLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: "700",
    color: AUTH_UI.textHeading,
    marginBottom: 2,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  rowDescription: {
    fontSize: typography.fontSize.xs,
    color: AUTH_UI.textBlack,
    lineHeight: typography.fontSize.xs * 1.5,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  rowNote: {
    fontSize: typography.fontSize.xs,
    color: AUTH_UI.linkBerry,
    marginTop: 6,
    lineHeight: typography.fontSize.xs * 1.4,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  quietHourRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  quietHourLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: "700",
    color: AUTH_UI.textHeading,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  quietHourControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  hourButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.rose[200],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AUTH_UI.textWhite,
  },
  hourValue: {
    minWidth: 68,
    textAlign: "center",
    fontSize: typography.fontSize.sm,
    fontWeight: "700",
    color: AUTH_UI.textBlack,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  clearQuietHoursButton: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    marginTop: spacing[1],
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.rose[200],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AUTH_UI.textWhite,
  },
  clearQuietHoursText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "700",
    color: AUTH_UI.linkBerry,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  quietHourSummary: {
    fontSize: typography.fontSize.xs,
    color: AUTH_UI.textBlack,
    marginBottom: spacing[3],
    fontFamily: FONT_FRIENDLY_SANS,
  },
});
