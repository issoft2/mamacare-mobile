/**
 * mobile/app/tabs/home.tsx
 * Refined for High Depth, Emotional Presence, and Tactile Interactions
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

type CareIconName = "chat" | "symptoms" | "water" | "mood" | "sleep" | "folic";
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
  { key: "other", label: "More", emoji: "✨" },
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
  water:    { icon: "#2B87E3", bg: "#EBF3FC" },
  folic:    { icon: "#D65A8A", bg: "#FDF0F5" },
  mood:     { icon: "#B36BBF", bg: "#F8EFFF" },
  symptoms: { icon: "#E06D53", bg: "#FDF1EE" },
  sleep:    { icon: "#4A52A3", bg: "#EEF0FC" },
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
      return { color: AUTH_UI.textWarm, bg: AUTH_UI.overlayCard, label: "None" };
  }
}

// ── Sleep quality colour coding ───────────────────────────────────────────────

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
    return { quality: "poor",  qualityLabel: "Poor Rest",  color: colors.rose[500], bgColor: AUTH_UI.semanticSevereBg, progress: 28 };
  }
  if (n.includes("4_6") || n.includes("4-6") || n.startsWith("4") || n.startsWith("5")) {
    return { quality: "fair",  qualityLabel: "Fair Rest",  color: AUTH_UI.semanticModerate, bgColor: AUTH_UI.semanticModerateBg,  progress: 58 };
  }
  if (n.includes("8+") || n.includes("+") || n.startsWith("9") || n.startsWith("10")) {
    return { quality: "great", qualityLabel: "Great Rest", color: AUTH_UI.semanticMild, bgColor: AUTH_UI.semanticMildBg, progress: 100 };
  }
  if (n.includes("6_8") || n.includes("6-8") || n.startsWith("6") || n.startsWith("7") || n.startsWith("8")) {
    return { quality: "great", qualityLabel: "Great Rest", color: AUTH_UI.semanticMild, bgColor: AUTH_UI.semanticMildBg, progress: 82 };
  }
  return { quality: "fair", qualityLabel: "Fair Rest", color: AUTH_UI.semanticModerate, bgColor: AUTH_UI.semanticModerateBg, progress: 50 };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSleepDuration(raw: string | undefined): string {
  if (!raw) return "Not logged today";
  return raw.replace(/_/g, "–");
}

function capitaliseMood(raw: string | undefined): string {
  if (!raw) return "Tap to set mood";
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
  if (totalMinutes <= 0) return "No duration recorded";
  if (totalMinutes < 60) return `${totalMinutes}m logged today`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h logged today`;
  return `${hours}h ${minutes}m logged today`;
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
      {name === "folic" && (
        <Path d="M12 4v16m-8-8h16" {...common} />
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
        <View style={styles.bannerIconWrap}>
          <Ionicons name="calendar" size={18} color={colors.rose[400]} />
        </View>

        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Upcoming appointment</Text>
          <Text style={styles.bannerDate}>{formatAppointmentDate(date)}</Text>
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

// ── Main Screen ────────────────────────────────────────────────────────────────

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
  const { data: pregnancy } = useActivePregnancy();
  
  const { data: symptomLogs }  = useSymptomLogs(10, 0);
  const { data: hydration }    = useHydrationLogs();
  const { data: todayFolicAcidLog } = useTodayFolicAcidLog();
  const { data: dailyTrackerReminderStatus, isSuccess: hasBackendTrackerStatus } =
    useDailyTrackerReminderStatus();
  const { data: kickSessions } = useKickSessions();

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
        // Ignore local cache options safely.
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
        // Fallback gracefully.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const firstName = profile?.first_name ?? '';
  const todayDateKey = getLocalDateKey(new Date());

  // Hydration state tracking variables
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

    setFolicTakenLocal(true);
    try {
      await logFolicAcid.mutateAsync({
        taken: true,
        log_date: todayDateKey,
      });
    } catch {
      // Retain optimistic state safely.
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
  
  // Sleep state variables
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

  // Symptoms tracking
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

  // Next scheduled appointment
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
    if (!todayHydrationLog) pending.push("Hydration");
    if (!folicTakenToday) pending.push("Folic acid");
    if (!todayMoodLog) pending.push("Mood");
    if (!todaySleepLog) pending.push("Rest");
    if (todaySymptoms.length === 0) pending.push("Symptoms");
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

  const greeting = useMemo(() => getTimeBasedGreeting(), []);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]}
        style={styles.bgOverlay}
      >
        {/* ── Scheduled Banner ─────────────────────────────────── */}
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
          {/* ── Greeting Hero Header ────────────────────────────── */}
          <Text style={[styles.greetingText, styles.greetingTextStandalone, isLargeText && styles.greetingTextStandaloneLarge]}>
            {firstName ? (
              <>
                {greeting}, {firstName} <Text style={styles.sparkle}>✨</Text>
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

          {/* ── Autonomous Weekly Content ─────────────────────────── */}
          <WeeklyContentCard />

          {/* ── Emotional Presence Quick Row ────────────────────── */}
          <View style={[styles.section, isLargeText && styles.sectionLarge]}>
            <Text style={styles.sectionTitle}>How is your beautiful heart feeling right now, mama?</Text>
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
                      activeFeeling === f.key && styles.moodCircleActive,
                      f.key === "other" && activeFeeling && !FEELINGS.some(item => item.key === activeFeeling) && styles.moodCircleActive,
                    ]}
                  >
                    <Text style={[styles.moodEmoji, f.key === "other" && styles.moodEmojiMore]}>
                      {f.key === "other" && activeFeeling && !FEELINGS.some(item => item.key === activeFeeling)
                        ? "💖"
                        : f.emoji}
                    </Text>
                  </View>
                  <Text style={[styles.moodLabel, activeFeeling === f.key && styles.moodLabelActive]}>
                    {f.key === "other" && activeFeeling && !FEELINGS.some(item => item.key === activeFeeling)
                      ? "Customized"
                      : f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── GROUP 1: Nourishing Your Body ───────────────────── */}
          <View style={[styles.section, isLargeText && styles.sectionLarge]}>
            <Text style={styles.sectionTitle}>Nourishing Your Body</Text>
            <View style={styles.gridRowTwoColumn}>
              
              {/* Hydration Interactive Bounding Box Card */}
              <TouchableOpacity
                style={[styles.interactiveGridCard, !hasCompletedOnboarding && styles.careCardDisabled]}
                onPress={handleHydrationTap}
                activeOpacity={0.82}
                disabled={!hasCompletedOnboarding || logWater.isPending}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Hydration progress. ${glassesCount} of ${targetGlasses} glasses added. Tap anywhere to add another glass.`}
              >
                <View style={styles.cardHeaderActionRow}>
                  <View style={[styles.iconBox, { backgroundColor: CARE_CARD_COLORS.water.bg }]}>
                    <CareIcon name="water" color={CARE_CARD_COLORS.water.icon} size={18} />
                  </View>
                  <View style={styles.actionCircleTrigger}>
                    <Ionicons name="plus" size={16} color={CARE_CARD_COLORS.water.icon} />
                  </View>
                </View>
                <Text style={styles.careCardLabel}>Hydration</Text>
                <Text style={styles.careCardValueText}>
                  {glassesCount}/{targetGlasses} <Text style={styles.careCardUnitText}>glasses</Text>
                </Text>
                <View style={styles.miniTrack}>
                  <View style={[styles.miniFill, { width: `${hydrationProgress}%`, backgroundColor: CARE_CARD_COLORS.water.icon }]} />
                </View>
              </TouchableOpacity>

              {/* Folic Acid Dynamic Checkbox Card */}
              <TouchableOpacity
                style={[
                  styles.interactiveGridCard, 
                  folicTakenToday && { backgroundColor: "#FDFDFD", borderColor: AUTH_UI.lineSoftWarm },
                  !hasCompletedOnboarding && styles.careCardDisabled
                ]}
                onPress={handleFolicAcidTap}
                activeOpacity={0.82}
                disabled={!hasCompletedOnboarding || folicTakenToday || logFolicAcid.isPending}
                accessible={true}
                accessibilityRole="checkbox"
                accessibilityChecked={folicTakenToday}
                accessibilityLabel="Folic Acid prenatal intake tracking card."
              >
                <View style={styles.cardHeaderActionRow}>
                  <View style={[styles.iconBox, { backgroundColor: CARE_CARD_COLORS.folic.bg }]}>
                    <Ionicons name="medkit-outline" size={18} color={CARE_CARD_COLORS.folic.icon} />
                  </View>
                  <Ionicons 
                    name={folicTakenToday ? "checkmark-circle" : "ellipse-outline"} 
                    size={22} 
                    color={folicTakenToday ? AUTH_UI.linkBerry : "#E1D5CB"} 
                  />
                </View>
                <Text style={styles.careCardLabel}>Folic Acid</Text>
                <Text style={[styles.careCardValueText, folicTakenToday && styles.completedValueText]}>
                  {folicTakenToday ? "Completed" : "0/1 logged"}
                </Text>
                <Text style={styles.cardContextCaption}>
                  {folicTakenToday ? "Logged for today ✨" : "Tap to record intake"}
                </Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* ── GROUP 2: My Well-being Today ────────────────────── */}
          <View style={[styles.section, isLargeText && styles.sectionLarge]}>
            <Text style={styles.sectionTitle}>My Well-being Today</Text>
            <View style={styles.gridRowTwoColumn}>

              {/* Mood Synchronized Routing Card */}
              <TouchableOpacity
                style={[styles.interactiveGridCard, !hasCompletedOnboarding && styles.careCardDisabled]}
                onPress={() =>
                  hasCompletedOnboarding
                    ? router.push(activeMood ? (`/tracker/mood?mood=${activeMood}` as any) : ("/tracker/mood" as any))
                    : router.push(onboardingRedirectPath)
                }
                activeOpacity={0.82}
                disabled={!hasCompletedOnboarding}
              >
                <View style={styles.cardHeaderActionRow}>
                  <View style={[styles.iconBox, { backgroundColor: CARE_CARD_COLORS.mood.bg }]}>
                    <CareIcon name="mood" color={CARE_CARD_COLORS.mood.icon} size={18} />
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#C4B4A7" />
                </View>
                <Text style={styles.careCardLabel}>Mood Status</Text>
                <Text style={styles.careCardValueText}>
                  {todayMoodLog?.mood ? capitaliseMood(todayMoodLog.mood) : "Neutral"}
                </Text>
                <Text style={styles.cardContextCaption}>Tap to specify details</Text>
              </TouchableOpacity>

              {/* Symptoms Severity Badge Card */}
              <TouchableOpacity
                style={[styles.interactiveGridCard, !hasCompletedOnboarding && styles.careCardDisabled]}
                onPress={() =>
                  hasCompletedOnboarding ? router.push("/tracker/symptoms" as any) : router.push(onboardingRedirectPath)
                }
                activeOpacity={0.82}
                disabled={!hasCompletedOnboarding}
              >
                <View style={styles.cardHeaderActionRow}>
                  <View style={[styles.iconBox, { backgroundColor: CARE_CARD_COLORS.symptoms.bg }]}>
                    <CareIcon name="symptoms" color={CARE_CARD_COLORS.symptoms.icon} size={18} />
                  </View>
                  {todaySymptoms.length > 0 ? (
                    <View style={[styles.severityInlineTag, { backgroundColor: severityInfo.bg }]}>
                      <Text style={[styles.severityTagText, { color: severityInfo.color }]}>{severityInfo.label}</Text>
                    </View>
                  ) : <Ionicons name="chevron-forward" size={14} color="#C4B4A7" />}
                </View>
                <Text style={styles.careCardLabel}>Symptoms</Text>
                <Text style={styles.careCardValueText}>
                  {todaySymptoms.length} {todaySymptoms.length === 1 ? "logged" : "logs"}
                </Text>
                <Text style={styles.cardContextCaption}>
                  {todaySymptoms.length > 0 ? "Tap to add updates" : "Feeling safe & steady"}
                </Text>
              </TouchableOpacity>

            </View>

            {/* Rest / Sleep Progress-Assigned Row Module Layout Integration */}
            <TouchableOpacity
              style={[styles.interactiveFullWidthCard, !hasCompletedOnboarding && styles.careCardDisabled, { marginTop: 12 }]}
              onPress={() =>
                hasCompletedOnboarding ? router.push("/tracker/sleep" as any) : router.push(onboardingRedirectPath)
              }
              activeOpacity={0.85}
              disabled={!hasCompletedOnboarding}
            >
              <View style={styles.fullWidthLayoutRow}>
                <View style={[styles.iconBox, { backgroundColor: sleepQuality.bgColor, marginRight: 12 }]}>
                  <CareIcon name="sleep" color={sleepQuality.color} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.textSpaceBetweenRow}>
                    <Text style={styles.careCardLabel}>Rest & Sleep Quality</Text>
                    {sleepBand && (
                      <View style={[styles.qualityBadge, { backgroundColor: sleepQuality.bgColor }]}> 
                        <Text style={[styles.qualityBadgeText, { color: sleepQuality.color }]}> 
                          {sleepQuality.qualityLabel}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.fullWidthValueText}>{formatSleepDuration(sleepBand)}</Text>
                  {sleepQuality.progress > 0 && (
                    <View style={[styles.miniTrack, { marginTop: 6, marginBottom: 0 }]}>
                      <View style={[styles.miniFill, { width: `${sleepQuality.progress}%`, backgroundColor: sleepQuality.color }]} />
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color="#C4B4A7" style={{ marginLeft: 8 }} />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── GROUP 3: Baby & Clinical Tracking ───────────────── */}
          {canUseKickCounter && (
            <View style={[styles.section, isLargeText && styles.sectionLarge, { marginBottom: 24 }]}>
              <Text style={styles.sectionTitle}>Baby & Clinical Tracking</Text>
              
              {/* Kick Counter Large-Target Interactive Interface Component */}
              <TouchableOpacity
                style={[styles.interactiveFullWidthCard, !hasCompletedOnboarding && styles.careCardDisabled]}
                onPress={() =>
                  hasCompletedOnboarding ? router.push("/tracker/kicks" as any) : router.push(onboardingRedirectPath)
                }
                activeOpacity={0.85}
                disabled={!hasCompletedOnboarding}
              >
                <View style={styles.fullWidthLayoutRow}>
                  <View style={[styles.iconBox, { backgroundColor: "#FFF0F2", marginRight: 12 }]}>
                    <Ionicons name="heart-pulse-outline" size={20} color={colors.rose[500]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.careCardLabel}>Fetal Movement Counter</Text>
                    <Text style={styles.fullWidthValueText}>
                      {todayKickCount} <Text style={styles.careCardUnitText}>kicks recorded today</Text>
                    </Text>
                    <Text style={styles.cardContextCaption}>{formatKickDuration(todayKickDurationMinutes)}</Text>
                  </View>
                  <View style={styles.kickActionCapsuleAccent}>
                    <Text style={styles.kickActionCapsuleText}>Open Counter</Text>
                    <Ionicons name="chevron-forward" size={12} color={AUTH_UI.textWhite} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      {/* ── More Options Emotional Bottom Sheet Overlay ──────── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMoodSheet}
        onRequestClose={() => setShowMoodSheet(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlayScrim} 
          activeOpacity={1} 
          onPress={() => setShowMoodSheet(false)}
        >
          <View style={styles.modalContentSheet}>
            <View style={styles.modalDragHandleIndicator} />
            <Text style={styles.modalTitleText}>How are you feeling inside, mama?</Text>
            <Text style={styles.modalSubtitleText}>Select an expanded emotional tag to instantly sync with your journal logs.</Text>
            
            <View style={styles.modalOptionGrid}>
              {EXTRA_FEELING_OPTIONS.map((opt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalTagItem}
                  onPress={() => {
                    setShowMoodSheet(false);
                    void handleFeelingSelect(opt.mappedFeeling);
                  }}
                >
                  <Text style={styles.modalTagItemText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setShowMoodSheet(false)}
            >
              <Text style={styles.modalCancelButtonText}>Close choices</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_UI.warmBackground },
  bgOverlay: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  contentWide: { maxWidth: 600, alignSelf: "center", width: "100%" },
  contentCompact: { paddingHorizontal: 12 },
  contentLargeText: { paddingTop: 24 },

  banner: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: AUTH_UI.lineSoftWarm },
  bannerGradient: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  bannerIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#FFF0F2", justifyContent: "center", alignItems: "center" },
  bannerText: { flex: 1, gap: 2 },
  bannerTitle: { fontSize: 13, fontWeight: "700", color: AUTH_UI.textHeading, fontFamily: FONT_FRIENDLY_SANS },
  bannerDate: { fontSize: 14, fontWeight: "800", color: colors.rose[500], fontFamily: FONT_WARM_SERIF },
  bannerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  bannerDismiss: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.04)", justifyContent: "center", alignItems: "center" },

  trackerBanner: { marginHorizontal: 16, marginTop: 8, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: AUTH_UI.lineSoftWarm },
  trackerBannerStandalone: { marginTop: 14 },
  trackerBannerIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: AUTH_UI.avatarRoseBg, justifyContent: "center", alignItems: "center" },
  trackerBannerTitle: { fontSize: 13, fontWeight: "700", color: AUTH_UI.textHeading, fontFamily: FONT_FRIENDLY_SANS },
  trackerBannerDate: { fontSize: 12, color: AUTH_UI.textWarmStrong, fontFamily: FONT_FRIENDLY_SANS },

  greetingText: { fontSize: 26, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, marginBottom: 4 },
  greetingTextStandalone: { paddingHorizontal: 4, marginTop: 6 },
  greetingTextStandaloneLarge: { fontSize: 30 },
  sparkle: { fontSize: 22 },

  onboardingNotice: { backgroundColor: "#FFF9E6", borderWidth: 1, borderColor: "#FFEAA6", borderRadius: 16, padding: 14, marginBottom: 16, marginTop: 4 },
  onboardingNoticeTitle: { fontSize: 14, fontWeight: "700", color: "#8A6D00", fontFamily: FONT_FRIENDLY_SANS, marginBottom: 2 },
  onboardingNoticeText: { fontSize: 13, color: "#665100", lineHeight: 18, fontFamily: FONT_FRIENDLY_SANS },

  section: { marginTop: 22 },
  sectionLarge: { marginTop: 28 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, marginBottom: 14, paddingHorizontal: 2, letterSpacing: 0.1 },

  feelingRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#FFFFFF", borderRadius: 24, paddingVertical: 14, paddingHorizontal: 8, borderWidth: 1, borderColor: AUTH_UI.lineSoftWarm },
  feelingRowWrap: { flexWrap: "wrap", gap: 10 },
  feelingCol: { flex: 1, alignItems: "center", gap: 6 },
  feelingColWide: { maxWidth: 90 },
  feelingColLarge: { gap: 8 },
  moodCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#FAF5F0", justifyContent: "center", alignItems: "center" },
  moodCircleMore: { backgroundColor: "#FFF0F2" },
  moodCircleActive: { backgroundColor: AUTH_UI.linkBerry, borderWidth: 1, borderColor: AUTH_UI.shadowRose },
  moodEmoji: { fontSize: 20, textAlign: "center" },
  moodEmojiMore: { color: AUTH_UI.linkBerry, fontWeight: "700" },
  moodLabel: { fontSize: 12, color: AUTH_UI.textWarmStrong, fontWeight: "600", fontFamily: FONT_FRIENDLY_SANS },
  moodLabelActive: { color: AUTH_UI.linkBerry, fontWeight: "700" },

  gridRowTwoColumn: { flexDirection: "row", gap: 12, justifyContent: "space-between" },
  interactiveGridCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 20, padding: 14, borderWidth: 1, borderColor: "#F5EEE7", position: "relative", justifyContent: "space-between", minHeight: 128 },
  cardHeaderActionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  iconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  actionCircleTrigger: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#FAF5F0", justifyContent: "center", alignItems: "center" },
  careCardLabel: { fontSize: 13, fontWeight: "700", color: AUTH_UI.textWarm, fontFamily: FONT_FRIENDLY_SANS, marginBottom: 2 },
  careCardValueText: { fontSize: 18, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF },
  careCardUnitText: { fontSize: 12, fontWeight: "600", color: AUTH_UI.textWarmStrong },
  completedValueText: { color: AUTH_UI.linkBerry },
  cardContextCaption: { fontSize: 11, color: "#A89A8E", fontFamily: FONT_FRIENDLY_SANS, marginTop: 4 },

  miniTrack: { height: 5, backgroundColor: "#F0E6DD", borderRadius: 3, marginTop: 10, overflow: "hidden", width: "100%" },
  miniFill: { height: "100%", borderRadius: 3 },
  careCardDisabled: { opacity: 0.5 },

  severityInlineTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  severityTagText: { fontSize: 11, fontWeight: "700", fontFamily: FONT_FRIENDLY_SANS },

  interactiveFullWidthCard: { width: "100%", backgroundColor: "#FFFFFF", borderRadius: 20, padding: 14, borderWidth: 1, borderColor: "#F5EEE7" },
  fullWidthLayoutRow: { flexDirection: "row", alignItems: "center" },
  textSpaceBetweenRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  qualityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  qualityBadgeText: { fontSize: 11, fontWeight: "700", fontFamily: FONT_FRIENDLY_SANS },
  fullWidthValueText: { fontSize: 16, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, marginTop: 2 },

  kickActionCapsuleAccent: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: AUTH_UI.linkBerry, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  kickActionCapsuleText: { fontSize: 12, fontWeight: "700", color: AUTH_UI.textWhite, fontFamily: FONT_FRIENDLY_SANS },

  modalOverlayScrim: { flex: 1, backgroundColor: "rgba(24,18,15,0.4)", justifyContent: "flex-end" },
  modalContentSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24, width: "100%" },
  modalDragHandleIndicator: { width: 40, height: 5, borderRadius: 2.5, backgroundColor: "#E6DCD3", alignSelf: "center", marginBottom: 16 },
  modalTitleText: { fontSize: 19, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, textAlign: "center", marginBottom: 6 },
  modalSubtitleText: { fontSize: 14, color: AUTH_UI.textWarmStrong, fontFamily: FONT_FRIENDLY_SANS, textAlign: "center", marginBottom: 20, paddingHorizontal: 12, lineHeight: 20 },
  modalOptionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 24 },
  modalTagItem: { backgroundColor: "#FAF5F0", borderWidth: 1, borderColor: "#EFE6DD", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  modalTagItemText: { fontSize: 14, fontWeight: "700", color: AUTH_UI.textHeading, fontFamily: FONT_FRIENDLY_SANS },
  modalCancelButton: { backgroundColor: "#F7EDF0", paddingVertical: 14, borderRadius: 16, alignItems: "center" },
  modalCancelButtonText: { fontSize: 15, fontWeight: "700", color: AUTH_UI.linkBerry, fontFamily: FONT_FRIENDLY_SANS },
});