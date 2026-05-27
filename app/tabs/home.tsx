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
  useAppointments,
  useFolicAcidLogs,
  useHydrationLogs,
  useKickSessions,
  useLogFolicAcid,
  useMoodLogs,
  useProfile,
  useSleepLogs,
  useSymptomPatterns,
  useSymptomLogs,
  useLogHydration,
  useLogMood,
} from "@mumcare/api";

import { colors } from "@mumcare/ui";
import { getTimeBasedGreeting } from "../../lib/greetings";
import { WeeklyContentCard } from "@/components/home/WeeklyContentCard";
import type { Mood, Severity, UrgencyTier } from "@mumcare/types";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";

// ── Types ─────────────────────────────────────────────────────────────────────

type CareIconName = "chat" | "symptoms" | "water" | "mood" | "sleep";
type Feeling = "steady" | "tired" | "anxious" | "hopeful";
type SleepQuality = "poor" | "fair" | "great";

// ── Constants ─────────────────────────────────────────────────────────────────

const FEELINGS: { key: Feeling; label: string; emoji: string }[] = [
  { key: "steady",  label: "Steady",  emoji: "😐" },
  { key: "tired",   label: "Tired",   emoji: "😔" },
  { key: "anxious", label: "Anxious", emoji: "😨" },
  { key: "hopeful", label: "Hopeful", emoji: "😊" },
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
  water:    { icon: colors.rose[400],  bg: "rgba(232,105,124,0.10)" },
  folic:    { icon: "#6B7BB8",         bg: "rgba(107,123,184,0.12)" },
  mood:     { icon: "#B07CC6",         bg: "rgba(176,124,198,0.10)" },
  symptoms: { icon: colors.rose[300],  bg: "rgba(232,105,124,0.08)" },
};

const KICK_COUNTER_MIN_WEEK = 16;

// ── Severity colour coding ────────────────────────────────────────────────────

interface SeverityInfo {
  color: string;
  bg: string;
  label: string;
}

function getSeverityInfo(severity: Severity | undefined): SeverityInfo {
  switch (severity) {
    case "mild":
      return { color: "#6DBF8C", bg: "rgba(109,191,140,0.12)", label: "Mild" };
    case "moderate":
      return { color: "#F4A460", bg: "rgba(244,164,96,0.12)",  label: "Moderate" };
    case "severe":
      return { color: "#E8697C", bg: "rgba(232,105,124,0.12)", label: "Severe" };
    default:
      return { color: "#BDBDBD", bg: "rgba(189,189,189,0.12)", label: "Unspecified" };
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
    return { quality: "poor", qualityLabel: "Not logged", color: "#BDBDBD", bgColor: "rgba(189,189,189,0.12)", progress: 0 };
  }
  const n = band.toLowerCase().replace(/\s/g, "");

  if (n.includes("<4") || n.startsWith("0") || n.startsWith("1") || n.startsWith("2") || n.startsWith("3")) {
    return { quality: "poor",  qualityLabel: "Poor",  color: "#E8697C", bgColor: "rgba(232,105,124,0.12)", progress: 28 };
  }
  if (n.includes("4_6") || n.includes("4-6") || n.startsWith("4") || n.startsWith("5")) {
    return { quality: "fair",  qualityLabel: "Fair",  color: "#F4A460", bgColor: "rgba(244,164,96,0.12)",  progress: 58 };
  }
  if (n.includes("8+") || n.includes("+") || n.startsWith("9") || n.startsWith("10")) {
    return { quality: "great", qualityLabel: "Great", color: "#6DBF8C", bgColor: "rgba(109,191,140,0.12)", progress: 100 };
  }
  if (n.includes("6_8") || n.includes("6-8") || n.startsWith("6") || n.startsWith("7") || n.startsWith("8")) {
    return { quality: "great", qualityLabel: "Great", color: "#6DBF8C", bgColor: "rgba(109,191,140,0.12)", progress: 82 };
  }
  return { quality: "fair", qualityLabel: "Fair", color: "#F4A460", bgColor: "rgba(244,164,96,0.12)", progress: 50 };
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
        colors={["#FFF0F3", "#FFF5F0"]}
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

// ── Screen ────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 980;
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [folicTakenLocal, setFolicTakenLocal] = useState(false);

  const { data: profile }      = useProfile();
  // const { data: patterns }     = useSymptomPatterns();
  const { data: symptomLogs }  = useSymptomLogs(10, 0);
  const { data: hydration }    = useHydrationLogs();
  const { data: folicAcidLogs } = useFolicAcidLogs();
  const { data: kickSessions } = useKickSessions();


  const { data: mood }         = useMoodLogs();
  const { data: sleep }        = useSleepLogs();
  const { data: appointments } = useAppointments();

  const firstName = profile?.first_name ?? user?.firstName ?? "mama";
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

  // Folic acid (today only)
  const todayFolicAcidLog = useMemo(
    () =>
      folicAcidLogs?.find((entry) => {
        const dateKey = getDateKeyFromRaw(entry.log_date) ?? getDateKeyFromRaw(entry.created_at);
        return dateKey === todayDateKey;
      }),
    [folicAcidLogs, todayDateKey]
  );

  const folicTakenToday = todayFolicAcidLog?.taken === true || folicTakenLocal;

  const handleFolicAcidTap = async () => {
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

  const showBanner = !bannerDismissed && !!nextAppointment;
  const gestationalWeek = profile?.gestational_week ?? 0;
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
        colors={["rgba(255,255,255,0.7)", "rgba(255,245,245,0.4)"]}
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

        <ScrollView
          contentContainerStyle={[
            styles.content,
            isWide && styles.contentWide,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ─────────────────────────────────────────────── */}
          <View style={styles.heroHeader}>
            <Text style={styles.greetingText}>
              {greeting}, {firstName} <Text style={styles.sparkle}>✨</Text>
            </Text>
           
          </View>

          {/* ── Weekly content card ───────────────────────────────── */}
          <WeeklyContentCard />

          {/* ── How are you feeling? ──────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
            <View style={styles.feelingRow}>
              {FEELINGS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                    onPress={() => handleFeelingSelect(f.key)}
                    disabled={logMood.isPending}
                  style={[styles.feelingCol, isWide && styles.feelingColWide]}
                >
                  <View
                    style={[
                      styles.moodCircle,
                        activeFeeling === f.key && styles.moodCircleActive,
                    ]}
                  >
                    <Text style={styles.moodEmoji}>{f.emoji}</Text>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's care</Text>
            <View style={styles.careGrid}>

              {/* Hydration */}
                <TouchableOpacity
                  style={[styles.careCard, isWide && styles.careCardWide]}
                  onPress={handleHydrationTap}
                  activeOpacity={0.85}
                  disabled={logWater.isPending}
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
                style={[styles.careCard, isWide && styles.careCardWide]}
                onPress={() =>
                  router.push(
                    activeMood
                      ? (`/tracker/mood?mood=${activeMood}` as any)
                      : ("/tracker/mood" as any)
                  )
                }
                activeOpacity={0.85}
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
                  style={[styles.careCard, isWide && styles.careCardWide]}
                  onPress={() => router.push("/tracker/sleep" as any)}
                  activeOpacity={0.85}
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
                    <View style={[styles.qualityBadge, { backgroundColor: sleepQuality.bgColor }]}>
                      <Text style={[styles.qualityBadgeText, { color: sleepQuality.color }]}>
                        {sleepQuality.qualityLabel}
                      </Text>
                    </View>
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
                style={[styles.careCard, isWide && styles.careCardWide]}
                onPress={handleFolicAcidTap}
                activeOpacity={0.85}
                disabled={folicTakenToday || logFolicAcid.isPending}
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
                style={[styles.careCard, isWide && styles.careCardWide]}
                onPress={() => router.push("/tabs/symptoms")}
                activeOpacity={0.85}
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
                <View style={[styles.iconBox, { backgroundColor: "rgba(232,105,124,0.10)" }]}>
                  <Ionicons name="heart" size={18} color={colors.rose[400]} />
                </View>
                <Text style={styles.careCardLabel}>Kick Counter</Text>
                <Text style={styles.careCardVal} numberOfLines={1} adjustsFontSizeToFit>
                  {canUseKickCounter ? `${todayKickCount} kicks` : `Starts at week ${KICK_COUNTER_MIN_WEEK}`}
                </Text>
                <Text style={styles.careCardSubtle} numberOfLines={1} adjustsFontSizeToFit>
                  {canUseKickCounter ? formatKickDuration(todayKickDurationMinutes) : `Current week ${gestationalWeek}`}
                </Text>
                <View style={styles.miniTrackPlaceholder} />
                <View style={styles.cardHintRow}>
                  <Ionicons
                    name={canUseKickCounter ? "timer-outline" : "lock-closed-outline"}
                    size={12}
                    color={colors.navy[300]}
                  />
                  <Text style={styles.cardHintText}>
                    {canUseKickCounter ? "Tap to open counter" : "Counter unlocks from week 16"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Appointment */}
              <TouchableOpacity
                style={[styles.careCard, isWide && styles.careCardWide]}
                onPress={() => router.push("/profile/appointments")}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Appointment card"
              >
                <View style={[styles.iconBox, { backgroundColor: "rgba(232,105,124,0.10)" }]}>
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
      </LinearGradient>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD_GAP = 12;
const CARD_WIDTH = `${(100 - CARD_GAP * 0.5) / 2}%` as const;

const styles = StyleSheet.create({
  screen:    { flex: 1 },
  bgOverlay: { flex: 1 },
  content: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  contentWide: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    padding: 32,
    paddingTop: 28,
  },

  // ── Next Visit Banner ──────────────────────────────────────
  banner: {
    marginHorizontal: 16,
    marginTop: 52,    // below safe area
    marginBottom: 4,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(232,105,124,0.18)",
    elevation: 3,
    shadowColor: "#E8697C",
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
    backgroundColor: "rgba(232,105,124,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: { flex: 1 },
  bannerTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.navy[400],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bannerDate: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.navy[700],
  },
  bannerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bannerDismiss: {
    padding: 4,
  },

  // ── Hero ────────────────────────────────────────────────────
  heroHeader:   { marginBottom: 20, marginTop: 8 },
  greetingText: { fontSize: 28, fontWeight: "700", color: "#1A237E" },
  sparkle:      { fontSize: 20 },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  weekText: { fontSize: 16, fontWeight: "600", color: "#3949AB", flex: 1 },
  eggContainer: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "#FFF",
    alignItems: "center", justifyContent: "center",
    elevation: 4, shadowOpacity: 0.1,
  },
  eggIcon: { fontSize: 24 },

  // ── Sections ────────────────────────────────────────────────
  section: { marginTop: 28 },
  sectionTitle: {
    fontSize: 20, fontWeight: "700",
    color: "#1A237E", marginBottom: 14,
  },

  // ── Feeling row ─────────────────────────────────────────────
  feelingRow: { flexDirection: "row", justifyContent: "space-between" },
  feelingCol:  { alignItems: "center", width: "22%" },
  feelingColWide: {
    width: "auto",
    minWidth: 110,
  },
  moodCircle: {
    width: 55, height: 55, borderRadius: 28,
    backgroundColor: "#FFF",
    alignItems: "center", justifyContent: "center",
    elevation: 2, shadowOpacity: 0.05,
  },
  moodCircleActive: {
    borderWidth: 2, borderColor: "#E8697C",
    transform: [{ scale: 1.1 }],
  },
  moodEmoji:       { fontSize: 24 },
  moodLabel:       { fontSize: 12, marginTop: 8, color: "#9E9E9E" },
  moodLabelActive: { color: "#E8697C", fontWeight: "700" },

  // ── Care grid ───────────────────────────────────────────────
  careGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  careCard: {
    width: CARD_WIDTH,
    minHeight: 140,
    backgroundColor: "#FFFBF7",
    borderRadius: 20,
    padding: 14,
    flexDirection: "column",
    justifyContent: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(232,105,124,0.10)",
    elevation: 3,
    shadowColor: "#E8697C",
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
    fontSize: 12,
    color: "#4A5B85",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  careCardVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#16204F",
  },
  careCardSubtle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#4A5B85",
  },
  careCardDisabled: {
    opacity: 0.65,
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
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // Urgent red dot on symptoms icon
  urgentDot: {
    position: "absolute",
    top: -2, right: -2,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: "#E8697C",
    borderWidth: 1.5,
    borderColor: "#FFFBF7",
  },

  // Progress bar
  miniTrack: {
    height: 5,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: "auto",
  },
  miniFill: { height: "100%", borderRadius: 3 },
  miniTrackPlaceholder: { height: 5, marginTop: "auto" },
  cardHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 7,
    alignSelf: "flex-start",
    backgroundColor: "rgba(26,35,126,0.08)",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  cardHintText: {
    fontSize: 11,
    color: "#22305E",
    fontWeight: "700",
  },
  widgetBtn: { backgroundColor: 'rgba(255,255,255,0.8)', paddingVertical: 5, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  widgetBtnText: { fontWeight: "700", color: "#1A237E" },


});
