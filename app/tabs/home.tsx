/**
 * mobile/app/tabs/home.tsx
 * Refined for High Depth & Emotional Presence
 *
 * Care grid:
 *  - Hydration  — glasses progress bar
 *  - Mood       — today's mood
 *  - Rest       — sleep quality colour coded (<4h/4-6h/6-8h/8h+)
 *  - Symptoms   — today's log count + severity badge (replaces Next Visit)
 *
 * Next Visit — dismissible banner at top of screen when appointment exists
 */

import { useUser } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import {
  apiRequest,
  useAppointments,
  useDailyTrackerReminderStatus,
  useTodayFolicAcidLog,
  useHydrationLogs,
  useKickSessions,
  useLogFolicAcid,
  useMoodLogs,
  useProfile,
  useSleepLogs,
  useSymptomLogs,
  useLogHydration,
  useLogMood,
  useActivePregnancy,
} from "@safeborn/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { colors } from "@safeborn/ui";
import { getTimeBasedGreeting } from "../../lib/greetings";
import { WeeklyContentCard } from "@/components/home/WeeklyContentCard";
import { resolveCurrentGestationalWeek } from "@/lib/gestationalWeek";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";
import type { DailyTrackerReminderItem, Mood, Severity } from "@safeborn/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type CareIconName = "chat" | "symptoms" | "water" | "mood" | "sleep";
type Feeling = "steady" | "tired" | "anxious" | "hopeful";
type FeelingChoice = Feeling | "other";
type SleepQuality = "poor" | "fair" | "great";

// ── Constants ─────────────────────────────────────────────────────────────────

const FEELINGS: { key: Feeling; label: string; emoji: string }[] = [
  { key: "steady",  label: "Steady",  emoji: "😐" },
  { key: "tired",   label: "Tired",   emoji: "😔" },
  { key: "anxious", label: "Anxious", emoji: "😨" },
  { key: "hopeful", label: "Hopeful", emoji: "😊" },
];

const FEELING_CHOICES: { key: FeelingChoice; label: string; emoji: string }[] = [
  ...FEELINGS,
  { key: "other", label: "More", emoji: "+" },
];

const EXTRA_FEELING_OPTIONS: { label: string; mappedFeeling: Feeling }[] = [
  { label: "Nauseous", mappedFeeling: "tired" },
  { label: "Excited", mappedFeeling: "hopeful" },
  { label: "Overwhelmed", mappedFeeling: "anxious" },
  { label: "Calm", mappedFeeling: "steady" },
  { label: "Emotional", mappedFeeling: "anxious" },
  { label: "Energetic", mappedFeeling: "hopeful" },
];

const FEELING_TO_MOOD: Record<Feeling, Mood> = {
  steady: "neutral",
  tired: "low",
  anxious: "anxious",
  hopeful: "happy",
};

const MOOD_TO_FEELING: Record<Mood, Feeling> = {
  neutral: "steady",
  low: "tired",
  anxious: "anxious",
  happy: "hopeful",
};

const CARE_CARD_COLORS = {
  water:    { icon: colors.rose[400],  bg: AUTH_UI.semanticSevereBgSoft },
  folic:    { icon: AUTH_UI.linkBerry,  bg: colors.rose[50] },
  mood:     { icon: AUTH_UI.linkBerry,  bg: colors.rose[50] },
  symptoms: { icon: colors.rose[300],  bg: AUTH_UI.semanticSevereBgSubtle },
};

const KICK_COUNTER_MIN_WEEK = 16;
const PREFS_CACHE_KEY = "notificationPreferences";
const TRACKER_REMINDER_LABELS: Record<DailyTrackerReminderItem, string> = {
  hydration: "Hydration",
  folic_acid: "Folic acid",
  mood: "Mood",
  sleep: "Rest",
  symptoms: "Symptoms",
};

// ── Severity colour coding ────────────────────────────────────────────────────

interface SeverityInfo {
  color: string;
  bg: string;
  label: string;
}

function getSeverityInfo(severity: Severity | undefined): SeverityInfo {
  switch (severity) {
    case "mild":
      return { color: AUTH_UI.semanticMild, bg: AUTH_UI.semanticMildBg, label: "Mild" };
    case "moderate":
      return { color: AUTH_UI.semanticModerate, bg: AUTH_UI.semanticModerateBg,  label: "Moderate" };
    case "severe":
      return { color: colors.rose[500], bg: AUTH_UI.semanticSevereBg, label: "Severe" };
    default:
      return { color: AUTH_UI.semanticNeutral, bg: AUTH_UI.semanticNeutralBg, label: "Unspecified" };
  }
}

// ── Sleep quality colour coding ───────────────────────────────────────────────
// <4h → Poor → Rose red | 4–6h → Fair → Amber | 6–8h/8h+ → Great → Green

interface SleepQualityInfo {
  quality: SleepQuality;
  qualityLabel: string;
  color: string;
  bgColor: string;
  progress: number;
}

function getSleepQuality(band: string | undefined): SleepQualityInfo {
  if (!band) {
    return { quality: "poor", qualityLabel: "Not logged", color: AUTH_UI.semanticNeutral, bgColor: AUTH_UI.semanticNeutralBg, progress: 0 };
  }
  const n = band.toLowerCase().replace(/\s/g, "");

  if (n.includes("<4") || n.startsWith("0") || n.startsWith("1") || n.startsWith("2") || n.startsWith("3")) {
    return { quality: "poor",  qualityLabel: "Poor",  color: colors.rose[500], bgColor: AUTH_UI.semanticSevereBg, progress: 28 };
  }
  if (n.includes("4_6") || n.includes("4-6") || n.startsWith("4") || n.startsWith("5")) {
    return { quality: "fair",  qualityLabel: "Fair",  color: AUTH_UI.semanticModerate, bgColor: AUTH_UI.semanticModerateBg,  progress: 58 };
  }
  if (n.includes("8+") || n.includes("+") || n.startsWith("9") || n.startsWith("10")) {
    return { quality: "great", qualityLabel: "Great", color: AUTH_UI.semanticMild, bgColor: AUTH_UI.semanticMildBg, progress: 100 };
  }
  if (n.includes("6_8") || n.includes("6-8") || n.startsWith("6") || n.startsWith("7") || n.startsWith("8")) {
    return { quality: "great", qualityLabel: "Great", color: AUTH_UI.semanticMild, bgColor: AUTH_UI.semanticMildBg, progress: 82 };
  }
  return { quality: "fair", qualityLabel: "Fair", color: AUTH_UI.semanticModerate, bgColor: AUTH_UI.semanticModerateBg, progress: 50 };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSleepDuration(raw: string | undefined): string {
  if (!raw) return "Log rest";
  return raw.replace(/_/g, "–");
}

function capitaliseMood(raw: string | undefined): string {
  if (!raw) return "Not set";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatAppointmentDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatKickDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "No duration";
  if (totalMinutes < 60) return `${totalMinutes}m today`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h today`;
  return `${hours}h ${minutes}m today`;
}

function getLocalDateKey(value: Date): string {
  const yyyy = value.getFullYear();
  const mm = `${value.getMonth() + 1}`.padStart(2, "0");
  const dd = `${value.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDateKeyFromRaw(value: string | undefined): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return getLocalDateKey(date);
}

// ── CareIcon ──────────────────────────────────────────────────────────────────

function CareIcon({
  name,
  color = colors.rose[500],
  size = 24,
}: {
  name: CareIconName;
  color?: string;
  size?: number;
}) {
  const common = {
    stroke: color,
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === "chat" && (
        <Path d="M5 7.5c0-1.7 1.4-3 3.1-3h7.8c1.7 0 3.1 1.4 3.1 3v4.2c0 1.7-1.4 3-3.1 3h-2.9L8 18.5V14.7c-1.7-.2-3-1.6-3-3.2V7.5z" {...common} />
      )}
      {name === "symptoms" && (
        <Path d="M12 18.5s-5-3.5-5-7.2c0-2.2 2-3.7 5-.9 3-2.8 5-1.3 5 .9 0 3.7-5 7.2-5 7.2z" {...common} />
      )}
      {name === "water" && (
        <Path d="M12 3.8s4.6 5.2 4.6 9c0 2.5-2.1 4.6-4.6 4.6S7.4 15.3 7.4 12.8c0-3.8 4.6-9 4.6-9z" {...common} />
      )}
      {name === "mood" && (
        <>
          <Circle cx="12" cy="12" r="7" {...common} />
          <Path d="M9.2 10.5h.1M14.8 10.5h.1M9.5 13.5c1.5 1.2 3.5 1.2 5 0" {...common} />
        </>
      )}
      {name === "sleep" && (
        <Path d="M16.5 15A6 6 0 0 1 9.3 7.8 6.5 6.5 0 1 0 16.5 15z" {...common} />
      )}
    </Svg>
  );
}

// ── Next Visit Banner ─────────────────────────────────────────────────────────

function NextVisitBanner({
  date,
  onDismiss,
  onTap,
}: {
  date: string;
  onDismiss: () => void;
  onTap: () => void;
}) {
  return (
    <TouchableOpacity onPress={onTap} activeOpacity={0.88} style={styles.banner}>
      <LinearGradient
        colors={[colors.rose[50], AUTH_UI.warmBackground]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bannerGradient}
      >
        {/* Left — calendar icon */}
        <View style={styles.bannerIconWrap}>
          <Ionicons name="calendar" size={18} color={colors.rose[400]} />
        </View>

        {/* Middle — text */}
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Upcoming appointment</Text>
          <Text style={styles.bannerDate}>{formatAppointmentDate(date)}</Text>
        </View>

        {/* Right — chevron + dismiss */}
        <View style={styles.bannerActions}>
          <Ionicons name="chevron-forward" size={16} color={colors.rose[300]} />
          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.bannerDismiss}
          >
            <Ionicons name="close" size={14} color={colors.navy[300]} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function TrackerReminderBanner({
  pending,
  onDismiss,
  onTap,
  style,
}: {
  pending: string[];
  onDismiss: () => void;
  onTap: () => void;
  style?: any;
}) {
  const summary =
    pending.length <= 3
      ? pending.join(", ")
      : `${pending.slice(0, 3).join(", ")} +${pending.length - 3} more`;

  return (
    <TouchableOpacity onPress={onTap} activeOpacity={0.88} style={[styles.trackerBanner, style]}>
      <LinearGradient
        colors={[AUTH_UI.cream, AUTH_UI.warmBackground]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bannerGradient}
      >
        <View style={styles.trackerBannerIconWrap}>
          <Ionicons name="notifications-outline" size={18} color={colors.rose[500]} />
        </View>

        <View style={styles.bannerText}>
          <Text style={styles.trackerBannerTitle}>Today's check-ins waiting</Text>
          <Text style={styles.trackerBannerDate}>Log: {summary}</Text>
        </View>

        <View style={styles.bannerActions}>
          <Ionicons name="chevron-forward" size={16} color={colors.rose[300]} />
          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.bannerDismiss}
          >
            <Ionicons name="close" size={14} color={colors.navy[300]} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 980;
  const isCompact = width < 380;
  const isLargeText = fontScale >= 1.2;
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [appointmentRemindersEnabled, setAppointmentRemindersEnabled] = useState(true);
  const [dailyTrackerRemindersEnabled, setDailyTrackerRemindersEnabled] = useState(true);
  const [trackerBannerDismissed, setTrackerBannerDismissed] = useState(false);
  const [folicTakenLocal, setFolicTakenLocal] = useState(false);
  const [showMoodSheet, setShowMoodSheet] = useState(false);

  const { data: profile, isPending: isProfilePending } = useProfile();
  const {data: pregnancy} = useActivePregnancy();
  
  const { data: symptomLogs }  = useSymptomLogs(10, 0);
  const { data: hydration }    = useHydrationLogs();
  const { data: todayFolicAcidLog } = useTodayFolicAcidLog();
  const { data: dailyTrackerReminderStatus, isSuccess: hasBackendTrackerStatus } =
    useDailyTrackerReminderStatus();
  const { data: kickSessions } = useKickSessions();

  // Only treat onboarding as incomplete once the profile query has resolved
  // without a result. While the query is still in-flight (isProfilePending),
  // stay neutral so we don't flash the "Finish setup first" banner or fire
  // onboarding redirects for users who do have a profile.
  const hasCompletedOnboarding = isProfilePending ? true : Boolean(profile);
  const onboardingRedirectPath = "/onboarding/profile-setup";

  const { data: mood }         = useMoodLogs();
  const { data: sleep }        = useSleepLogs();
  const { data: appointments } = useAppointments();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const userScopedKey = user?.id
        ? `${PREFS_CACHE_KEY}:${user.id}`
        : PREFS_CACHE_KEY;

      try {
        const raw = await AsyncStorage.getItem(userScopedKey);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            appointment_reminders?: boolean;
            hydration_reminders?: boolean;
          };
          if (!cancelled && typeof parsed.appointment_reminders === "boolean") {
            setAppointmentRemindersEnabled(parsed.appointment_reminders);
          }
          if (!cancelled && typeof parsed.hydration_reminders === "boolean") {
            setDailyTrackerRemindersEnabled(parsed.hydration_reminders);
          }
        }
      } catch {
        // Ignore local cache errors and continue with server source.
      }

      try {
        const prefs = await apiRequest<{
          appointment_reminders?: boolean;
          hydration_reminders?: boolean;
        }>(
          "/notifications/preferences",
          { method: "GET" }
        );

        if (!cancelled && typeof prefs.appointment_reminders === "boolean") {
          setAppointmentRemindersEnabled(prefs.appointment_reminders);
        }
        if (!cancelled && typeof prefs.hydration_reminders === "boolean") {
          setDailyTrackerRemindersEnabled(prefs.hydration_reminders);
        }
      } catch {
        // Keep current preference fallback.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const firstName = profile?.first_name ?? '';
  const todayDateKey = getLocalDateKey(new Date());

  // Hydration
  const todayHydrationLog = useMemo(
    () =>
      hydration?.find((entry) => {
        const dateKey = getDateKeyFromRaw(entry.log_date) ?? getDateKeyFromRaw(entry.created_at);
        return dateKey === todayDateKey;
      }),
    [hydration, todayDateKey]
  );
  const glassesCount = todayHydrationLog?.glasses_count ?? 0;
  const targetGlasses = todayHydrationLog?.target_glasses ?? 8;
  const hydrationProgress = targetGlasses > 0 ? Math.min(100, (glassesCount / targetGlasses) * 100) : 0;
  const logWater = useLogHydration();
  const logFolicAcid = useLogFolicAcid();
  const logMood = useLogMood();

  const handleHydrationTap = async () => {
    if (!hasCompletedOnboarding) {
      router.push(onboardingRedirectPath);
      return;
    }
    if (logWater.isPending) return;
    try {
      await logWater.mutateAsync({
        glasses_count: glassesCount + 1,
        target_glasses: targetGlasses > 0 ? targetGlasses : 8,
        log_date: todayDateKey,
      });
    } catch (error) {
      console.error("Failed to update hydration from home:", error);
    }
  };

  const folicTakenToday =
    todayFolicAcidLog?.is_logged_today === true ||
    todayFolicAcidLog?.taken === true ||
    folicTakenLocal;

  const handleFolicAcidTap = async () => {
    if (!hasCompletedOnboarding) {
      router.push(onboardingRedirectPath);
      return;
    }
    if (folicTakenToday || logFolicAcid.isPending) return;

    // Optimistic local update so card never feels broken if API is temporarily unavailable.
    setFolicTakenLocal(true);

    try {
      await logFolicAcid.mutateAsync({
        taken: true,
        log_date: todayDateKey,
      });
    } catch {
      // Keep UI stable; server sync will retry on next interaction/session.
    }
  };

  const todayMoodLog = useMemo(
    () =>
      mood?.find((entry) => {
        const dateKey = getDateKeyFromRaw(entry.log_date) ?? getDateKeyFromRaw(entry.created_at);
        return dateKey === todayDateKey;
      }),
    [mood, todayDateKey]
  );

  const persistedFeeling = useMemo(
    () => (todayMoodLog?.mood ? MOOD_TO_FEELING[todayMoodLog.mood] : null),
    [todayMoodLog]
  );

  useEffect(() => {
    if (!feeling && persistedFeeling) {
      setFeeling(persistedFeeling);
    }
  }, [feeling, persistedFeeling]);

  const activeFeeling = feeling ?? persistedFeeling;
  const activeMood: Mood | null = activeFeeling ? FEELING_TO_MOOD[activeFeeling] : (todayMoodLog?.mood ?? null);

  const handleFeelingSelect = async (nextFeeling: Feeling) => {
    if (!hasCompletedOnboarding) {
      router.push(onboardingRedirectPath);
      return;
    }
    if (logMood.isPending) return;

    const previousFeeling = activeFeeling;
    setFeeling(nextFeeling);

    try {
      await logMood.mutateAsync({ mood: FEELING_TO_MOOD[nextFeeling], log_date: todayDateKey });
    } catch (error) {
      console.error("Failed to update mood from home:", error);
      setFeeling(previousFeeling ?? null);
    }
  };
  
  // Sleep
  const todaySleepLog = useMemo(
    () =>
      sleep?.find((entry) => {
        const dateKey = getDateKeyFromRaw(entry.log_date) ?? getDateKeyFromRaw(entry.created_at);
        return dateKey === todayDateKey;
      }),
    [sleep, todayDateKey]
  );
  const sleepBand = todaySleepLog?.duration_band;
  const sleepQuality = useMemo(() => getSleepQuality(sleepBand), [sleepBand]);

  // Symptoms — today's logs
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todaySymptoms = useMemo(
    () =>
      symptomLogs?.items.filter(
        (s) => new Date(s.created_at) >= todayStart
      ) ?? [],
    [symptomLogs, todayStart]
  );

  const latestSeverity   = todaySymptoms[0]?.severity;
  const severityInfo     = getSeverityInfo(latestSeverity);
  const hasUrgentSymptom = todaySymptoms.some(
    (s) => s.urgency_tier === "notify_doctor" || s.urgency_tier === "emergency_advised"
  );

  // Next appointment
  const nextAppointment = useMemo(
    () => {
      const now = new Date();
      return (
      appointments
        ?.filter((i) => i.status === "scheduled")
        .filter((i) => new Date(i.scheduled_at) >= now)
        .sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        )[0]
      );
    },
    [appointments]
  );

  const showBanner =
    hasCompletedOnboarding && !bannerDismissed && !!nextAppointment && appointmentRemindersEnabled;

  useEffect(() => {
    setTrackerBannerDismissed(false);
  }, [todayDateKey]);

  const localPendingTrackerItems = useMemo(() => {
    const pending: string[] = [];

    if (!todayHydrationLog) {
      pending.push("Hydration");
    }
    if (!folicTakenToday) {
      pending.push("Folic acid");
    }
    if (!todayMoodLog) {
      pending.push("Mood");
    }
    if (!todaySleepLog) {
      pending.push("Rest");
    }
    if (todaySymptoms.length === 0) {
      pending.push("Symptoms");
    }

    return pending;
  }, [folicTakenToday, todayHydrationLog, todayMoodLog, todaySleepLog, todaySymptoms.length]);

  const backendPendingTrackerItems = useMemo(
    () =>
      (dailyTrackerReminderStatus?.pending_items ?? [])
        .map((item) => TRACKER_REMINDER_LABELS[item])
        .filter(Boolean),
    [dailyTrackerReminderStatus?.pending_items]
  );

  const pendingTrackerItems = hasBackendTrackerStatus
    ? backendPendingTrackerItems
    : localPendingTrackerItems;

  const showTrackerReminderBanner =
    hasCompletedOnboarding &&
    dailyTrackerRemindersEnabled &&
    !trackerBannerDismissed &&
    pendingTrackerItems.length > 0;

  const gestationalWeek = useMemo(
    () => resolveCurrentGestationalWeek(pregnancy) ?? 0,
    [pregnancy]
  );
  const canUseKickCounter = gestationalWeek >= KICK_COUNTER_MIN_WEEK;

  const todayKickSessions = useMemo(
    () =>
      kickSessions?.filter((session) => {
        const dateKey = getDateKeyFromRaw(session.started_at) ?? getDateKeyFromRaw(session.created_at);
        return dateKey === todayDateKey;
      }) ?? [],
    [kickSessions, todayDateKey]
  );

  const todayKickCount = useMemo(
    () => todayKickSessions.reduce((sum, session) => sum + session.kick_count, 0),
    [todayKickSessions]
  );

  const todayKickDurationMinutes = useMemo(
    () => todayKickSessions.reduce((sum, session) => sum + (session.duration_minutes ?? 0), 0),
    [todayKickSessions]
  );

  const activeKickSession = useMemo(
    () => todayKickSessions.find((session) => !session.ended_at) ?? kickSessions?.find((session) => !session.ended_at),
    [todayKickSessions, kickSessions]
  );

  const greeting = useMemo(() => getTimeBasedGreeting(), []);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]}
        style={styles.bgOverlay}
      >
        {/* ── Next Visit Banner ─────────────────────────────────── */}
        {showBanner && (
          <NextVisitBanner
            date={nextAppointment.scheduled_at}
            onDismiss={() => setBannerDismissed(true)}
            onTap={() => router.push("/tabs/profile")}
          />
        )}

        {showTrackerReminderBanner && (
          <TrackerReminderBanner
            pending={pendingTrackerItems}
            onDismiss={() => setTrackerBannerDismissed(true)}
            onTap={() => router.push("/tabs/tracker")}
            style={!showBanner ? styles.trackerBannerStandalone : undefined}
          />
        )}

        <ScrollView
          contentContainerStyle={[
            styles.content,
            isWide && styles.contentWide,
            isCompact && styles.contentCompact,
            isLargeText && styles.contentLargeText,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ─────────────────────────────────────────────── */}
          <Text
            style={[
              styles.greetingText,
              styles.greetingTextStandalone,
              isLargeText && styles.greetingTextStandaloneLarge,
            ]}
          >
            {firstName ? (
              <>
                {greeting}, {firstName}{" "}
                <Text style={styles.sparkle}>✨</Text>
              </>
            ) : ''}
          </Text>

          {!hasCompletedOnboarding && (
            <View style={styles.onboardingNotice}>
              <Text style={styles.onboardingNoticeTitle}>Finish setup first</Text>
              <Text style={styles.onboardingNoticeText}>
                Complete your profile before logging symptoms, mood, hydration, rest, folic acid, or appointments.
              </Text>
            </View>
          )}

          {/* ── Weekly content card ───────────────────────────────── */}
          <WeeklyContentCard />

          {/* ── How are you feeling? ──────────────────────────────── */}
          <View style={[styles.section, isLargeText && styles.sectionLarge]}>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
            <View style={[styles.feelingRow, isLargeText && styles.feelingRowWrap]}>
              {FEELING_CHOICES.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => {
                    if (!hasCompletedOnboarding) {
                      router.push(onboardingRedirectPath);
                      return;
                    }
                    if (f.key === "other") {
                      setShowMoodSheet(true);
                      return;
                    }
                    void handleFeelingSelect(f.key);
                  }}
                  disabled={!hasCompletedOnboarding || logMood.isPending}
                  style={[
                    styles.feelingCol,
                    isWide && styles.feelingColWide,
                    isLargeText && styles.feelingColLarge,
                    !hasCompletedOnboarding && styles.careCardDisabled,
                  ]}
                >
                  <View
                    style={[
                      styles.moodCircle,
                      f.key === "other" && styles.moodCircleMore,
                      activeFeeling === f.key && styles.moodCircleActive,
                    ]}
                  >
                    <Text style={[styles.moodEmoji, f.key === "other" && styles.moodEmojiMore]}>{f.emoji}</Text>
                  </View>
                  <Text
                    style={[
                      styles.moodLabel,
                        activeFeeling === f.key && styles.moodLabelActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Today's care ──────────────────────────────────────── */}
          <View style={[styles.section, isLargeText && styles.sectionLarge]}>
            <Text style={styles.sectionTitle}>Today's care</Text>
            <View style={styles.careGrid}>

              {/* Hydration */}
                <TouchableOpacity
                  style={[styles.careCard, !hasCompletedOnboarding && styles.careCardDisabled, isWide && styles.careCardWide]}
                  onPress={handleHydrationTap}
                  activeOpacity={0.85}
                  disabled={!hasCompletedOnboarding || logWater.isPending}
                  accessibilityRole="button"
                  accessibilityLabel="Hydration card"
                >
                  <View style={[styles.iconBox, { backgroundColor: CARE_CARD_COLORS.water.bg }]}>
                    <CareIcon name="water" color={CARE_CARD_COLORS.water.icon} size={20} />
                  </View>
                  <Text style={styles.careCardLabel}>Hydration</Text>
                  <Text style={styles.careCardVal} numberOfLines={1} adjustsFontSizeToFit>
                    {glassesCount}/{targetGlasses} Glasses
                  </Text>
                  <View style={styles.miniTrack}>
                    <View style={[styles.miniFill, { width: `${hydrationProgress}%`, backgroundColor: CARE_CARD_COLORS.water.icon }]} />
                  </View>
                  <View style={styles.cardHintRow}>
                    <Ionicons name="add-circle-outline" size={12} color={colors.navy[300]} />
                    <Text style={styles.cardHintText}>Tap to add a glass</Text>
                  </View>
                </TouchableOpacity>


              {/* Mood */}
              <TouchableOpacity
                style={[styles.careCard, !hasCompletedOnboarding && styles.careCardDisabled, isWide && styles.careCardWide]}
                onPress={() =>
                  hasCompletedOnboarding
                    ? router.push(
                        activeMood
                          ? (`/tracker/mood?mood=${activeMood}` as any)
                          : ("/tracker/mood" as any)
                      )
                    : router.push(onboardingRedirectPath)
                }
                activeOpacity={0.85}
                disabled={!hasCompletedOnboarding}
                accessibilityRole="button"
                accessibilityLabel="Mood card"
              >
                  <View style={[styles.iconBox, { backgroundColor: CARE_CARD_COLORS.mood.bg }]}>
                    <CareIcon name="mood" color={CARE_CARD_COLORS.mood.icon} size={20} />
                  </View>
                  <Text style={styles.careCardLabel}>Mood</Text>
                  <Text style={styles.careCardVal} numberOfLines={1} adjustsFontSizeToFit>
                    {capitaliseMood(todayMoodLog?.mood)}
                  </Text>
                  <View style={styles.miniTrackPlaceholder} />
                  <View style={styles.cardHintRow}>
                    <Ionicons name="pencil-outline" size={12} color={colors.navy[300]} />
                    <Text style={styles.cardHintText}>Tap to update mood</Text>
                  </View>
              </TouchableOpacity>

              

              {/* Rest — dynamic colour coding */}

                <TouchableOpacity
                  style={[styles.careCard, !hasCompletedOnboarding && styles.careCardDisabled, isWide && styles.careCardWide]}
                  onPress={() =>
                    hasCompletedOnboarding
                      ? router.push("/tracker/sleep" as any)
                      : router.push(onboardingRedirectPath)
                  }
                  activeOpacity={0.85}
                  disabled={!hasCompletedOnboarding}
                  accessibilityRole="button"
                  accessibilityLabel="Rest card"
                >

                    <View style={[styles.iconBox, { backgroundColor: sleepQuality.bgColor }]}>
                      <CareIcon name="sleep" color={sleepQuality.color} size={20} />
                    </View>
                    <Text style={styles.careCardLabel}>Rest</Text>
                    <Text style={styles.careCardVal} numberOfLines={1} adjustsFontSizeToFit>
                      {formatSleepDuration(sleepBand)}
                    </Text>
                      {sleepBand ? (
                        <View style={[styles.qualityBadge, { backgroundColor: sleepQuality.bgColor }]}> 
                          <Text style={[styles.qualityBadgeText, { color: sleepQuality.color }]}> 
                            {sleepQuality.qualityLabel}
                          </Text>
                        </View>
                      ) : null}
                    {sleepQuality.progress > 0 && (
                      <View style={styles.miniTrack}>
                        <View style={[styles.miniFill, { width: `${sleepQuality.progress}%`, backgroundColor: sleepQuality.color }]} />
                      </View>
                    )}
                    <View style={styles.cardHintRow}>
                      <Ionicons name="moon-outline" size={12} color={colors.navy[300]} />
                      <Text style={styles.cardHintText}>Tap to log rest</Text>
                    </View>
                </TouchableOpacity>

              {/* Folic Acid */}
              <TouchableOpacity
                style={[styles.careCard, !hasCompletedOnboarding && styles.careCardDisabled, isWide && styles.careCardWide]}
                onPress={handleFolicAcidTap}
                activeOpacity={0.85}
                disabled={!hasCompletedOnboarding || folicTakenToday || logFolicAcid.isPending}
                accessibilityRole="button"
                accessibilityLabel="Folic acid card"
              >
                <View style={[styles.iconBox, { backgroundColor: CARE_CARD_COLORS.folic.bg }]}> 
                  <Ionicons name="medkit-outline" size={18} color={CARE_CARD_COLORS.folic.icon} />
                </View>
                <Text style={styles.careCardLabel}>Folic Acid</Text>
                <Text style={styles.careCardVal} numberOfLines={1} adjustsFontSizeToFit>
                  {folicTakenToday ? "1/1" : "0/1"}
                </Text>
                <Text style={styles.careCardSubtle} numberOfLines={1} adjustsFontSizeToFit>
                  {folicTakenToday ? "Taken today" : "Not logged today"}
                </Text>
                <View style={styles.miniTrackPlaceholder} />
                <View style={styles.cardHintRow}>
                  <Ionicons
                    name={folicTakenToday ? "checkmark-circle-outline" : "add-circle-outline"}
                    size={12}
                    color={colors.navy[300]}
                  />
                  <Text style={styles.cardHintText}>
                    {folicTakenToday ? "Already logged" : "Tap to log intake"}
                  </Text>
                </View>
              </TouchableOpacity>


              {/* Symptoms — replaces Next Visit */}
              <TouchableOpacity
                style={[styles.careCard, !hasCompletedOnboarding && styles.careCardDisabled, isWide && styles.careCardWide]}
                onPress={() =>
                  hasCompletedOnboarding
                    ? router.push("/tabs/symptoms")
                    : router.push(onboardingRedirectPath)
                }
                activeOpacity={0.85}
                disabled={!hasCompletedOnboarding}
                accessibilityRole="button"
                accessibilityLabel="Symptoms card"
              >
                <View style={[
                  styles.iconBox,
                  { backgroundColor: todaySymptoms.length > 0 ? severityInfo.bg : CARE_CARD_COLORS.symptoms.bg },
                ]}>
                  <CareIcon
                    name="symptoms"
                    color={todaySymptoms.length > 0 ? severityInfo.color : CARE_CARD_COLORS.symptoms.icon}
                    size={20}
                  />
                  {/* Urgent dot */}
                  {hasUrgentSymptom && <View style={styles.urgentDot} />}
                </View>
                <Text style={styles.careCardLabel}>Symptoms</Text>
                <Text style={styles.careCardVal} numberOfLines={1} adjustsFontSizeToFit>
                  {todaySymptoms.length > 0
                    ? `${todaySymptoms.length} logged`
                    : "None today"}
                </Text>
                {todaySymptoms.length > 0 ? (
                  <View style={[styles.qualityBadge, { backgroundColor: severityInfo.bg }]}>
                    <Text style={[styles.qualityBadgeText, { color: severityInfo.color }]}>
                      {severityInfo.label}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.miniTrackPlaceholder} />
                )}
                <View style={styles.cardHintRow}>
                  <Ionicons name="list-outline" size={12} color={colors.navy[300]} />
                  <Text style={styles.cardHintText}>Tap to view symptoms</Text>
                </View>
              </TouchableOpacity>

              {/* Kick Counter */}
              <TouchableOpacity
                style={[
                  styles.careCard,
                  isWide && styles.careCardWide,
                  !canUseKickCounter && styles.careCardDisabled,
                ]}
                onPress={() =>
                  canUseKickCounter
                    ? activeKickSession
                      ? router.push(`/tracker/kick/${activeKickSession.id}` as any)
                      : router.push("/tabs/tracker")
                    : undefined
                }
                activeOpacity={0.85}
                disabled={!canUseKickCounter}
                accessibilityRole="button"
                accessibilityLabel="Kick Counter card"
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: canUseKickCounter
                        ? colors.rose[50]
                        : AUTH_UI.semanticNeutralBg,
                    },
                  ]}
                >
                  <Ionicons
                    name="heart"
                    size={18}
                    color={canUseKickCounter ? colors.rose[400] : AUTH_UI.mutedIcon}
                  />
                </View>
                <Text style={styles.careCardLabel}>Kick Counter</Text>
                <Text style={styles.careCardVal} numberOfLines={1} adjustsFontSizeToFit>
                  {canUseKickCounter ? `${todayKickCount} kicks` : `Starts at week ${KICK_COUNTER_MIN_WEEK}`}
                </Text>
                <Text style={styles.careCardSubtle} numberOfLines={1} adjustsFontSizeToFit>
                  {canUseKickCounter ? formatKickDuration(todayKickDurationMinutes) : `Current week ${gestationalWeek}`}
                </Text>
                <View style={styles.miniTrackPlaceholder} />
                <View style={[styles.cardHintRow, !canUseKickCounter && styles.cardHintRowMuted]}>
                  <Ionicons
                    name={canUseKickCounter ? "timer-outline" : "lock-closed-outline"}
                    size={12}
                    color={canUseKickCounter ? colors.navy[300] : AUTH_UI.mutedText}
                  />
                  <Text style={[styles.cardHintText, !canUseKickCounter && styles.cardHintTextMuted]}>
                    {canUseKickCounter ? "Tap to open counter" : "Counter unlocks from week 16"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Appointment */}
              <TouchableOpacity
                style={[styles.careCard, !hasCompletedOnboarding && styles.careCardDisabled, isWide && styles.careCardWide]}
                onPress={() =>
                  hasCompletedOnboarding
                    ? router.push("/profile/appointments")
                    : router.push(onboardingRedirectPath)
                }
                activeOpacity={0.85}
                disabled={!hasCompletedOnboarding}
                accessibilityRole="button"
                accessibilityLabel="Appointment card"
              >
                <View style={[styles.iconBox, { backgroundColor: colors.rose[50] }]}> 
                  <Ionicons name="calendar-outline" size={18} color={colors.rose[400]} />
                </View>
                <Text style={styles.careCardLabel}>Appointment</Text>
                <Text style={styles.careCardVal} numberOfLines={1} adjustsFontSizeToFit>
                  {nextAppointment ? "Upcoming visit" : "No upcoming visit"}
                </Text>
                <Text style={styles.careCardSubtle} numberOfLines={1} adjustsFontSizeToFit>
                  {nextAppointment ? formatAppointmentDate(nextAppointment.scheduled_at) : "Schedule your next check-up"}
                </Text>
                <View style={styles.miniTrackPlaceholder} />
                <View style={styles.cardHintRow}>
                  <Ionicons name="open-outline" size={12} color={colors.navy[300]} />
                  <Text style={styles.cardHintText}>Tap to manage appointments</Text>
                </View>
              </TouchableOpacity>

            </View>
          </View>
        </ScrollView>

        <Modal
          visible={showMoodSheet}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMoodSheet(false)}
        >
          <View style={styles.moodSheetBackdrop}>
            <TouchableOpacity
              style={styles.moodSheetScrim}
              activeOpacity={1}
              onPress={() => setShowMoodSheet(false)}
            />
            <View style={styles.moodSheetCard}>
              <Text style={styles.moodSheetTitle}>How are you feeling today?</Text>
              <Text style={styles.moodSheetSubtitle}>Pick what feels closest right now.</Text>
              <View style={styles.moodSheetGrid}>
                {EXTRA_FEELING_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={styles.moodSheetOption}
                    activeOpacity={0.86}
                    onPress={() => {
                      setShowMoodSheet(false);
                      void handleFeelingSelect(option.mappedFeeling);
                    }}
                  >
                    <Text style={styles.moodSheetOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD_GAP = 12;
const CARD_WIDTH = `${(100 - CARD_GAP * 0.5) / 2}%` as const;

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: AUTH_UI.warmBackground },
  bgOverlay: { flex: 1 },
  content: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 56,
  },
  contentWide: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    padding: 32,
    paddingTop: 28,
  },
  contentCompact: {
    paddingHorizontal: 16,
  },
  contentLargeText: {
    paddingBottom: 40,
  },

  // ── Next Visit Banner ──────────────────────────────────────
  banner: {
    marginHorizontal: 16,
    marginTop: 52,    // below safe area
    marginBottom: 4,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.rose[200],
    elevation: 3,
    shadowColor: colors.rose[500],
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  bannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  bannerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.rose[50],
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: { flex: 1 },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: AUTH_UI.linkBerry,
    letterSpacing: 0.2,
    marginBottom: 2,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  bannerDate: {
    fontSize: 16,
    fontWeight: "700",
    color: AUTH_UI.textHeading,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  bannerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bannerDismiss: {
    padding: 8,
  },
  trackerBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.rose[200],
    elevation: 2,
    shadowColor: colors.rose[500],
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  trackerBannerStandalone: {
    marginTop: 52,
  },
  trackerBannerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.rose[50],
    alignItems: "center",
    justifyContent: "center",
  },
  trackerBannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: AUTH_UI.linkBerry,
    letterSpacing: 0.2,
    marginBottom: 2,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  trackerBannerDate: {
    fontSize: 16,
    fontWeight: "700",
    color: AUTH_UI.textHeading,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  // ── Hero ────────────────────────────────────────────────────
  greetingText: { fontSize: 30, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.5 },
  greetingTextStandalone: {
    marginTop: 8,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  greetingTextStandaloneLarge: {
    marginBottom: 20,
  },
  sparkle:      { fontSize: 20 },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  weekText: { fontSize: 16, fontWeight: "600", color: AUTH_UI.linkBerry, flex: 1, fontFamily: FONT_FRIENDLY_SANS },
  eggContainer: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: AUTH_UI.textWhite,
    alignItems: "center", justifyContent: "center",
    elevation: 4, shadowOpacity: 0.1,
  },
  eggIcon: { fontSize: 24 },

  // ── Sections ────────────────────────────────────────────────
  section: { marginTop: 28 },
  sectionLarge: { marginTop: 32 },
  sectionTitle: {
    fontSize: 22, fontWeight: "700",
    color: AUTH_UI.textHeading, marginBottom: 14, fontFamily: FONT_WARM_SERIF,
  },

  // ── Feeling row ─────────────────────────────────────────────
  feelingRow: { flexDirection: "row", justifyContent: "space-between" },
  feelingRowWrap: {
    flexWrap: "wrap",
    rowGap: 14,
  },
  feelingCol:  { alignItems: "center", width: "22%" },
  feelingColLarge: {
    width: "47%",
  },
  feelingColWide: {
    width: "auto",
    minWidth: 110,
  },
  moodCircle: {
    width: 55, height: 55, borderRadius: 28,
    backgroundColor: AUTH_UI.textWhite,
    alignItems: "center", justifyContent: "center",
    elevation: 2, shadowOpacity: 0.05,
  },
  moodCircleActive: {
    borderWidth: 2, borderColor: colors.rose[500],
    transform: [{ scale: 1.1 }],
  },
  moodCircleMore: {
    backgroundColor: colors.rose[50],
  },
  moodEmoji:       { fontSize: 24 },
  moodEmojiMore: { color: AUTH_UI.linkBerry, fontWeight: "700", fontFamily: FONT_FRIENDLY_SANS },
  moodLabel:       { fontSize: 14, marginTop: 8, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  moodLabelActive: { color: AUTH_UI.linkBerry, fontWeight: "700", fontFamily: FONT_FRIENDLY_SANS },

  // ── Care grid ───────────────────────────────────────────────
  careGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  careCard: {
    width: CARD_WIDTH,
    minHeight: 156,
    backgroundColor: AUTH_UI.cream,
    borderRadius: 20,
    padding: 14,
    flexDirection: "column",
    justifyContent: "flex-start",
    borderWidth: 1,
    borderColor: colors.rose[200],
    elevation: 3,
    shadowColor: colors.rose[500],
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  careCardWide: {
    width: "23.5%",
    minWidth: 210,
  },
  iconBox: {
    width: 34, height: 34, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  careCardLabel: {
    fontSize: 14,
    color: AUTH_UI.textBlack,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 4,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  careCardVal: {
    fontSize: 16,
    fontWeight: "700",
    color: AUTH_UI.textHeading,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  careCardSubtle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: AUTH_UI.textBlack,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  careCardDisabled: {
    opacity: 0.65,
  },
  onboardingNotice: {
    marginTop: 18,
    marginBottom: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: AUTH_UI.semanticNeutralBg,
    borderWidth: 1,
    borderColor: colors.navy[100],
  },
  onboardingNoticeTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: AUTH_UI.textHeading,
    marginBottom: 4,
    fontFamily: FONT_WARM_SERIF,
  },
  onboardingNoticeText: {
    fontSize: 14,
    lineHeight: 20,
    color: AUTH_UI.textBlack,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  // Quality / severity badge
  qualityBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 5,
  },
  qualityBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // Urgent red dot on symptoms icon
  urgentDot: {
    position: "absolute",
    top: -2, right: -2,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: colors.rose[500],
    borderWidth: 1.5,
    borderColor: AUTH_UI.cream,
  },

  // Progress bar
  miniTrack: {
    height: 6,
    backgroundColor: colors.rose[100],
    borderRadius: 3,
    overflow: "hidden",
    marginTop: "auto",
  },
  miniFill: { height: "100%", borderRadius: 3 },
  miniTrackPlaceholder: { height: 6, marginTop: "auto" },
  cardHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 7,
    alignSelf: "flex-start",
    backgroundColor: colors.rose[50],
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    minHeight: 28,
  },
  cardHintRowMuted: {
    backgroundColor: AUTH_UI.semanticNeutralBg,
  },
  cardHintText: {
    fontSize: 13,
    color: AUTH_UI.linkBerry,
    fontWeight: "700",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  cardHintTextMuted: {
    color: AUTH_UI.mutedText,
  },
  moodSheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  moodSheetScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AUTH_UI.overlayScrim,
  },
  moodSheetCard: {
    backgroundColor: AUTH_UI.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 10,
  },
  moodSheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: AUTH_UI.textHeading,
    fontFamily: FONT_WARM_SERIF,
  },
  moodSheetSubtitle: {
    fontSize: 15,
    color: AUTH_UI.textBlack,
    lineHeight: 22,
    marginBottom: 2,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  moodSheetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  moodSheetOption: {
    width: "48%",
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.rose[200],
    backgroundColor: AUTH_UI.textWhite,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  moodSheetOptionText: {
    fontSize: 15,
    fontWeight: "700",
    color: AUTH_UI.linkBerry,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  widgetBtn: { backgroundColor: AUTH_UI.overlayCard80, paddingVertical: 5, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: AUTH_UI.lineFaint },
  widgetBtnText: { fontWeight: "700", color: AUTH_UI.textHeading, fontFamily: FONT_FRIENDLY_SANS },


});
