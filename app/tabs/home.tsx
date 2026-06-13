/**
 * mobile/app/tabs/home.tsx
 * Refined for High Depth & Emotional Presence
 * Fully integrated with backend hooks, mutations, and authentication tokens.
 */

import { useUser } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
      return { color: AUTH_UI.semanticNeutral, bg: AUTH_UI.semanticNeutralBg, label: "None" };
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

// Modifies string to Capital case
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
  size = 20,
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

// ── Next Visit Dismissible Banner ─────────────────────────────────────────────

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
          <Ionicons name="calendar" size={16} color={colors.rose[400]} />
        </View>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Upcoming appointment</Text>
          <Text style={styles.bannerDate}>{formatAppointmentDate(date)}</Text>
        </View>
        <View style={styles.bannerActions}>
          <Ionicons name="chevron-forward" size={14} color={colors.rose[300]} />
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

// ── Check-Ins Pending Notification Banner ─────────────────────────────────────

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
          <Ionicons name="notifications-outline" size={16} color={colors.rose[500]} />
        </View>
        <View style={styles.bannerText}>
          <Text style={styles.trackerBannerTitle}>Today's check-ins waiting</Text>
          <Text style={styles.trackerBannerDate}>Log: {summary}</Text>
        </View>
        <View style={styles.bannerActions}>
          <Ionicons name="chevron-forward" size={14} color={colors.rose[300]} />
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

// ── Main Home Dashboard Component ─────────────────────────────────────────────

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

  // Live Backend Core Queries
  const { data: profile, isPending: isProfilePending } = useProfile();
  const { data: pregnancy } = useActivePregnancy();
  const { data: symptomLogs } = useSymptomLogs(10, 0);
  const { data: hydration } = useHydrationLogs();
  const { data: todayFolicAcidLog } = useTodayFolicAcidLog();
  const { data: dailyTrackerReminderStatus, isSuccess: hasBackendTrackerStatus } = useDailyTrackerReminderStatus();
  const { data: mood } = useMoodLogs();
  const { data: sleep } = useSleepLogs();
  const { data: appointments } = useAppointments();

  // Onboarding enforcement guards
  const hasCompletedOnboarding = isProfilePending ? true : Boolean(profile);
  const onboardingRedirectPath = "/onboarding/profile-setup";

  // Cache & Live API Configurations
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const userScopedKey = user?.id ? `${PREFS_CACHE_KEY}:${user.id}` : PREFS_CACHE_KEY;
      try {
        const raw = await AsyncStorage.getItem(userScopedKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (!cancelled && typeof parsed.appointment_reminders === "boolean") {
            setAppointmentRemindersEnabled(parsed.appointment_reminders);
          }
          if (!cancelled && typeof parsed.hydration_reminders === "boolean") {
            setDailyTrackerRemindersEnabled(parsed.hydration_reminders);
          }
        }
      } catch { /* Error suppression fallback */ }

      try {
        const prefs = await apiRequest<{ appointment_reminders?: boolean; hydration_reminders?: boolean }>(
          "/notifications/preferences",
          { method: "GET" }
        );
        if (!cancelled && typeof prefs.appointment_reminders === "boolean") {
          setAppointmentRemindersEnabled(prefs.appointment_reminders);
        }
        if (!cancelled && typeof prefs.hydration_reminders === "boolean") {
          setDailyTrackerRemindersEnabled(prefs.hydration_reminders);
        }
      } catch { /* Suppress runtime error fallback safety handles */ }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const firstName = profile?.first_name ?? '';
  const todayDateKey = getLocalDateKey(new Date());

  // Connected Module Mutations
  const logWater = useLogHydration();
  const logFolicAcid = useLogFolicAcid();
  const logMood = useLogMood();

  // 1. Hydration Calculations
  const todayHydrationLog = useMemo(() =>
    hydration?.find((entry) => {
      const dateKey = getDateKeyFromRaw(entry.log_date) ?? getDateKeyFromRaw(entry.created_at);
      return dateKey === todayDateKey;
    }), [hydration, todayDateKey]
  );
  const glassesCount = todayHydrationLog?.glasses_count ?? 0;
  const targetGlasses = todayHydrationLog?.target_glasses ?? 8;
  const hydrationProgress = targetGlasses > 0 ? Math.min(100, (glassesCount / targetGlasses) * 100) : 0;

  const handleHydrationTap = async () => {
    if (!hasCompletedOnboarding) { router.push(onboardingRedirectPath); return; }
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

  // 2. Folic Acid Configuration status check
  const folicTakenToday = todayFolicAcidLog?.is_logged_today === true || todayFolicAcidLog?.taken === true || folicTakenLocal;

  // 3. Mood Mapping Processing
  const todayMoodLog = useMemo(() =>
    mood?.find((entry) => {
      const dateKey = getDateKeyFromRaw(entry.log_date) ?? getDateKeyFromRaw(entry.created_at);
      return dateKey === todayDateKey;
    }), [mood, todayDateKey]
  );

  const persistedFeeling = useMemo(() => todayMoodLog?.mood ? MOOD_TO_FEELING[todayMoodLog.mood] : null, [todayMoodLog]);

  useEffect(() => {
    if (!feeling && persistedFeeling) { setFeeling(persistedFeeling); }
  }, [feeling, persistedFeeling]);

  const activeFeeling = feeling ?? persistedFeeling;
  const activeMood: Mood | null = activeFeeling ? FEELING_TO_MOOD[activeFeeling] : (todayMoodLog?.mood ?? null);

  const handleFeelingSelect = async (nextFeeling: Feeling) => {
    if (!hasCompletedOnboarding) { router.push(onboardingRedirectPath); return; }
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

  // 4. Rest / Sleep Tracker Engine
  const todaySleepLog = useMemo(() =>
    sleep?.find((entry) => {
      const dateKey = getDateKeyFromRaw(entry.log_date) ?? getDateKeyFromRaw(entry.created_at);
      return dateKey === todayDateKey;
    }), [sleep, todayDateKey]
  );
  const sleepBand = todaySleepLog?.duration_band;
  const sleepQuality = useMemo(() => getSleepQuality(sleepBand), [sleepBand]);

  // 5. Symptoms Tracking Sector
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todaySymptoms = useMemo(() =>
    symptomLogs?.items.filter((s) => new Date(s.created_at) >= todayStart) ?? [],
    [symptomLogs, todayStart]
  );
  const latestSeverity = todaySymptoms[0]?.severity;
  const severityInfo = getSeverityInfo(latestSeverity);

  // Dismissible Appointment Banner Configuration Matrix
  const nextAppointment = useMemo(() => {
    const now = new Date();
    return (
      appointments
        ?.filter((i) => i.status === "scheduled")
        .filter((i) => new Date(i.scheduled_at) >= now)
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]
    );
  }, [appointments]);

  const showBanner = hasCompletedOnboarding && !bannerDismissed && !!nextAppointment && appointmentRemindersEnabled;

  useEffect(() => { setTrackerBannerDismissed(false); }, [todayDateKey]);

  const localPendingTrackerItems = useMemo(() => {
    const pending: string[] = [];
    if (!todayHydrationLog) pending.push("Hydration");
    if (!folicTakenToday) pending.push("Folic acid");
    if (!todayMoodLog) pending.push("Mood");
    if (!todaySleepLog) pending.push("Rest");
    if (todaySymptoms.length === 0) pending.push("Symptoms");
    return pending;
  }, [folicTakenToday, todayHydrationLog, todayMoodLog, todaySleepLog, todaySymptoms.length]);

  const backendPendingTrackerItems = useMemo(() =>
    (dailyTrackerReminderStatus?.pending_items ?? [])
      .map((item) => TRACKER_REMINDER_LABELS[item])
      .filter(Boolean),
    [dailyTrackerReminderStatus?.pending_items]
  );

  const pendingTrackerItems = hasBackendTrackerStatus ? backendPendingTrackerItems : localPendingTrackerItems;
  const showTrackerReminderBanner = hasCompletedOnboarding && dailyTrackerRemindersEnabled && !trackerBannerDismissed && pendingTrackerItems.length > 0;
  const gestationalWeek = useMemo(() => resolveCurrentGestationalWeek(pregnancy) ?? 0, [pregnancy]);
  const greeting = useMemo(() => getTimeBasedGreeting(), []);

  return (
    <LinearGradient colors={["#FFFDF9", "#FFF5F0"]} style={styles.screen}>
      {/* Structural Top Header System */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerMenuBtn} activeOpacity={0.7}>
          <Feather name="menu" size={18} color="#9C7A66" />
        </TouchableOpacity>
        <View style={styles.logoWrapper}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>safeborn</Text>
        </View>
        <TouchableOpacity style={styles.headerMenuBtn} activeOpacity={0.7}>
          <Feather name="bell" size={18} color="#9C7A66" />
        </TouchableOpacity>
      </View>

      {/* ── Dismissible Notification Matrix Banner Engine ── */}
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
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.content,
          isWide && styles.contentWide,
          isCompact && styles.contentCompact,
          isLargeText && styles.contentLargeText,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Dynamic Context Greeting Row */}
        <View style={styles.greetingSection}>
          <Text style={[styles.mainGreetingTitle, isLargeText && styles.greetingTextStandaloneLarge]}>
            {firstName ? `${greeting}, ${firstName} ✨` : `${greeting} ✨`}
          </Text>
          <Text style={styles.greetingSubtext}>
            "Take a deep breath, mama. You are doing a beautiful job growing a tiny life today."
          </Text>
        </View>

        {!hasCompletedOnboarding && (
          <View style={styles.onboardingNotice}>
            <Text style={styles.onboardingNoticeTitle}>Finish setup first</Text>
            <Text style={styles.onboardingNoticeText}>
              Complete your profile before logging symptoms, mood, hydration, rest, or medical configurations.
            </Text>
          </View>
        )}

        {/* ── Connected Milestone Content Hero Card ── */}
        <WeeklyContentCard />

        {/* ── Emotion Check-In Hub Section ── */}
        <View style={[styles.section, isLargeText && styles.sectionLarge]}>
          <Text style={styles.sectionTitle}>HOW IS YOUR HEART FEELING RIGHT NOW?</Text>
          <View style={[styles.feelingRow, isLargeText && styles.feelingRowWrap]}>
            {FEELING_CHOICES.map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => {
                  if (!hasCompletedOnboarding) { router.push(onboardingRedirectPath); return; }
                  if (f.key === "other") { router.push("/tracker/mood"); return; }
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
                <Text style={[styles.moodLabel, activeFeeling === f.key && styles.moodLabelActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Refined 2x2 Connected Live Care Matrix Grid ── */}
        <View style={[styles.section, isLargeText && styles.sectionLarge]}>
          <Text style={styles.sectionTitle}>TODAY'S CONNECTED CARE</Text>
          <View style={styles.careGrid}>
            
            {/* Cell A: Live Hydration Module */}
            <TouchableOpacity
              style={[styles.careCard, !hasCompletedOnboarding && styles.careCardDisabled, isWide && styles.careCardWide]}
              onPress={handleHydrationTap}
              activeOpacity={0.85}
              disabled={!hasCompletedOnboarding || logWater.isPending}
              accessibilityRole="button"
              accessibilityLabel="Hydration progress tracking interface matrix"
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.careCardLabel}>Hydration</Text>
                <View style={[styles.iconBox, { backgroundColor: "#EDF7FF" }]}>
                  <CareIcon name="water" color="#2F80ED" size={16} />
                </View>
              </View>
              <Text style={styles.careCardVal}>
                {glassesCount} / {targetGlasses} <Text style={styles.careUnitLabel}>Glasses</Text>
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${hydrationProgress}%`, backgroundColor: "#2F80ED" }]} />
              </View>
              <View style={styles.cardHintRow}>
                <Ionicons name="add-circle-outline" size={12} color="#8A7365" />
                <Text style={styles.cardHintText}>Tap to add a glass</Text>
              </View>
            </TouchableOpacity>

            {/* Cell B: Live Mood Sync Module */}
            <TouchableOpacity
              style={[styles.careCard, !hasCompletedOnboarding && styles.careCardDisabled, isWide && styles.careCardWide]}
              onPress={() => hasCompletedOnboarding ? router.push(activeMood ? (`/tracker/mood?mood=${activeMood}` as any) : "/tracker/mood") : router.push(onboardingRedirectPath)}
              activeOpacity={0.85}
              disabled={!hasCompletedOnboarding}
              accessibilityRole="button"
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.careCardLabel}>Mood Status</Text>
                <View style={[styles.iconBox, { backgroundColor: "#FFF0F5" }]}>
                  <CareIcon name="mood" color="#EAA383" size={16} />
                </View>
              </View>
              <Text style={styles.careCardVal}>{capitaliseMood(todayMoodLog?.mood)}</Text>
              <View style={styles.statusEmptyPlaceholder} />
              <View style={styles.cardHintRow}>
                <Ionicons name="pencil-outline" size={12} color="#8A7365" />
                <Text style={styles.cardHintText}>Tap to update details</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.careGrid, { marginTop: 16 }]}>
            {/* Cell C: Live Sleep Duration & Colour-Coded Rest Tracking */}
            <TouchableOpacity
              style={[styles.careCard, !hasCompletedOnboarding && styles.careCardDisabled, isWide && styles.careCardWide]}
              onPress={() => hasCompletedOnboarding ? router.push("/tracker/sleep") : router.push(onboardingRedirectPath)}
              activeOpacity={0.85}
              disabled={!hasCompletedOnboarding}
              accessibilityRole="button"
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.careCardLabel}>Rest Level</Text>
                <View style={[styles.iconBox, { backgroundColor: sleepQuality.bgColor }]}>
                  <CareIcon name="sleep" color={sleepQuality.color} size={16} />
                </View>
              </View>
              <Text style={styles.careCardVal}>{formatSleepDuration(sleepBand)}</Text>
              
              {sleepBand ? (
                <View style={[styles.qualityBadge, { backgroundColor: sleepQuality.bgColor }]}> 
                  <Text style={[styles.qualityBadgeText, { color: sleepQuality.color }]}> 
                    {sleepQuality.qualityLabel}
                  </Text>
                </View>
              ) : <View style={styles.statusEmptyPlaceholder} />}

              <View style={styles.cardHintRow}>
                <Ionicons name="moon-outline" size={12} color="#8A7365" />
                <Text style={styles.cardHintText}>Tap to view rest insights</Text>
              </View>
            </TouchableOpacity>

            {/* Cell D: Live Symptom Tracking & Colour-Coded Urgency Matrix Severity */}
            <TouchableOpacity
              style={[styles.careCard, !hasCompletedOnboarding && styles.careCardDisabled, isWide && styles.careCardWide]}
              onPress={() => hasCompletedOnboarding ? router.push("/tracker/symptoms") : router.push(onboardingRedirectPath)}
              activeOpacity={0.85}
              disabled={!hasCompletedOnboarding}
              accessibilityRole="button"
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.careCardLabel}>Symptoms</Text>
                <View style={[styles.iconBox, { backgroundColor: todaySymptoms.length > 0 ? severityInfo.bg : "#F9F6F0" }]}>
                  <CareIcon name="symptoms" color={todaySymptoms.length > 0 ? severityInfo.color : "#CC7E5C"} size={16} />
                </View>
              </View>
              <Text style={styles.careCardVal}>
                {todaySymptoms.length} {todaySymptoms.length === 1 ? 'Log' : 'Logs'} <Text style={styles.careUnitLabel}>today</Text>
              </Text>

              {todaySymptoms.length > 0 ? (
                <View style={[styles.qualityBadge, { backgroundColor: severityInfo.bg }]}> 
                  <Text style={[styles.qualityBadgeText, { color: severityInfo.color }]}> 
                    {severityInfo.label} Severity
                  </Text>
                </View>
              ) : <View style={styles.statusEmptyPlaceholder} />}

              <View style={styles.cardHintRow}>
                <Ionicons name="medical-outline" size={12} color="#8A7365" />
                <Text style={styles.cardHintText}>Log physical changes</Text>
              </View>
            </TouchableOpacity>

          </View>
        </View>

        {/* Nesting Dynamic Track Blocks */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>PREPARING THE NEST</Text>
          <TouchableOpacity style={styles.nestingRowCard} activeOpacity={0.8}>
            <View style={styles.nestingIconWrapper}>
              <MaterialCommunityIcons name="basket-outline" size={20} color="#CC7E5C" />
            </View>
            <View style={styles.nestingTextWrapper}>
              <Text style={styles.nestingTitle}>This Week's Nesting Project</Text>
              <Text style={styles.nestingDesc}>3 gentle ways to map out your nursery storage or organize gifts by size.</Text>
            </View>
            <Text style={styles.nestingArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// ── Complete Style Sheets Layout Archetype ────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  headerMenuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF0E5",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EAA383",
    opacity: 0.8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#5C4638",
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  contentWide: {
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  contentCompact: {
    paddingHorizontal: 16,
  },
  contentLargeText: {
    paddingBottom: 60,
  },
  greetingSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  mainGreetingTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3D2E24",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  greetingTextStandaloneLarge: {
    fontSize: 28,
  },
  greetingSubtext: {
    fontSize: 14,
    color: "#8A7365",
    fontStyle: "italic",
    lineHeight: 20,
  },
  onboardingNotice: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FEB2B2",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  onboardingNoticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#C53030",
    marginBottom: 4,
  },
  onboardingNoticeText: {
    fontSize: 12,
    color: "#9B2C2C",
    lineHeight: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionLarge: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5C4333",
    letterSpacing: 1,
    marginBottom: 16,
  },
  feelingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F5E6DC",
  },
  feelingRowWrap: {
    flexWrap: "wrap",
    gap: 12,
  },
  feelingCol: {
    alignItems: "center",
    flex: 1,
  },
  feelingColWide: {
    maxWidth: 80,
  },
  feelingColLarge: {
    minWidth: 60,
  },
  moodCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FCF6F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  moodCircleActive: {
    backgroundColor: "#FFF0E5",
    borderColor: "#EAA383",
  },
  moodCircleMore: {
    backgroundColor: "#F9F6F0",
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodEmojiMore: {
    color: "#8A7365",
    fontWeight: "600",
  },
  moodLabel: {
    fontSize: 11,
    color: "#8A7365",
    fontWeight: "500",
  },
  moodLabelActive: {
    color: "#CC7E5C",
    fontWeight: "700",
  },
  careGrid: {
    flexDirection: "row",
    gap: 16,
  },
  careCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F5E6DC",
    padding: 16,
    minHeight: 140,
    justifyContent: "space-between",
  },
  careCardWide: {
    minHeight: 150,
  },
  careCardDisabled: {
    opacity: 0.5,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  careCardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5C4333",
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  careCardVal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3D2E24",
    marginTop: 4,
  },
  careUnitLabel: {
    fontSize: 12,
    fontWeight: "400",
    color: "#8A7365",
  },
  progressBarBg: {
    height: 6,
    width: "100%",
    backgroundColor: "#FFF0E5",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 4,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  statusEmptyPlaceholder: {
    height: 14,
    marginVertical: 4,
  },
  qualityBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginVertical: 4,
  },
  qualityBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: "#FAF5F0",
    paddingTop: 8,
  },
  cardHintText: {
    fontSize: 10,
    color: "#8A7365",
  },
  banner: {
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FAD9C1",
  },
  trackerBanner: {
    marginHorizontal: 24,
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3E8EE",
  },
  trackerBannerStandalone: {
    marginTop: 16,
  },
  bannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  bannerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF0E6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  trackerBannerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3D2E24",
  },
  bannerDate: {
    fontSize: 11,
    color: "#CC7E5C",
    fontWeight: "500",
  },
  trackerBannerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4A3B32",
  },
  trackerBannerDate: {
    fontSize: 11,
    color: "#8A7365",
  },
  bannerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerDismiss: {
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 10,
  },
  sectionContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5C4333",
    letterSpacing: 1,
    marginBottom: 12,
  },
  nestingRowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F5E6DC",
    padding: 16,
  },
  nestingIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FCF5F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  nestingTextWrapper: {
    flex: 1,
  },
  nestingTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4A3B32",
    marginBottom: 2,
  },
  nestingDesc: {
    fontSize: 11,
    color: "#8A7365",
    lineHeight: 14,
  },
  nestingArrow: {
    fontSize: 14,
    color: "#CC7E5C",
    fontWeight: "700",
    marginLeft: 8,
  },
});