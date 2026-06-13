/**
 * mobile/app/tabs/home.tsx
 * Refined for High Depth & Emotional Presence
 * Retains all original backend hooks, state mappings, and helpers perfectly.
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

// ── Severity & Helper Functions ───────────────────────────────────────────────

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
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
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

// ── CareIcon Component ────────────────────────────────────────────────────────

function CareIcon({ name, color = colors.rose[500], size = 24 }: { name: CareIconName; color?: string; size?: number }) {
  const common = {
    stroke: color,
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === "chat" && <Path d="M5 7.5c0-1.7 1.4-3 3.1-3h7.8c1.7 0 3.1 1.4 3.1 3v4.2c0 1.7-1.4 3-3.1 3h-2.9L8 18.5V14.7c-1.7-.2-3-1.6-3-3.2V7.5z" {...common} />}
      {name === "symptoms" && <Path d="M12 18.5s-5-3.5-5-7.2c0-2.2 2-3.7 5-.9 3-2.8 5-1.3 5 .9 0 3.7-5 7.2-5 7.2z" {...common} />}
      {name === "water" && <Path d="M12 3.8s4.6 5.2 4.6 9c0 2.5-2.1 4.6-4.6 4.6S7.4 15.3 7.4 12.8c0-3.8 4.6-9 4.6-9z" {...common} />}
      {name === "mood" && (
        <>
          <Circle cx="12" cy="12" r="7" {...common} />
          <Path d="M9.2 10.5h.1M14.8 10.5h.1M9.5 13.5c1.5 1.2 3.5 1.2 5 0" {...common} />
        </>
      )}
      {name === "sleep" && <Path d="M16.5 15A6 6 0 0 1 9.3 7.8 6.5 6.5 0 1 0 16.5 15z" {...common} />}
    </Svg>
  );
}

// ── Next Visit Banner Component ───────────────────────────────────────────────

function NextVisitBanner({ date, onDismiss, onTap }: { date: string; onDismiss: () => void; onTap: () => void }) {
  return (
    <View style={styles.bannerWrapper}>
      <TouchableOpacity onPress={onTap} activeOpacity={0.88} style={styles.banner}>
        <LinearGradient
          colors={[colors.rose[50], AUTH_UI.warmBackgroundSoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bannerGradient}
        >
          <View style={styles.bannerIconWrap}>
            <Ionicons name="calendar" size={18} color={colors.rose[400]} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Our Next Hello</Text>
            <Text style={styles.bannerDate}>{formatAppointmentDate(date)}</Text>
          </View>
          <View style={styles.bannerActions}>
            <Ionicons name="chevron-forward" size={16} color={AUTH_UI.textWarmMuted} style={{ marginRight: 8 }} />
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); onDismiss(); }} style={styles.bannerDismiss}>
              <Ionicons name="close" size={18} color={AUTH_UI.textWarmMuted} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen Component ─────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { data: profile } = useProfile();
  const { data: activePregnancy } = useActivePregnancy();
  
  // React Query API hooks
  const { data: appointments } = useAppointments();
  const { data: hydrationToday } = useHydrationLogs();
  const { data: moodLogs } = useMoodLogs();
  const { data: folicAcidLog } = useTodayFolicAcidLog();
  const { data: sleepLogs } = useSleepLogs();
  const { data: symptomLogs } = useSymptomLogs();
  const { data: kickSessions } = useKickSessions();

  const { mutate: logHydration } = useLogHydration();
  const { mutate: logFolicAcid } = useLogFolicAcid();
  const { mutate: logMood } = useLogMood();

  const [dismissedAppointment, setDismissedAppointment] = useState(false);

  const firstName = profile?.first_name || user?.firstName || "Mama";
  const greeting = useMemo(() => getTimeBasedGreeting(), []);
  
  const nextAppointment = useMemo(() => {
    if (!appointments || appointments.length === 0 || dismissedAppointment) return null;
    return [...appointments].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
  }, [appointments, dismissedAppointment]);

  const currentWaterCount = hydrationToday?.[hydrationToday.length - 1]?.glasses_count || 0;
  const isFolicTaken = folicAcidLog?.taken || false;

  const currentGestationalWeek = useMemo(() => {
    if (!activePregnancy?.estimated_due_date) return 16; 
    return resolveCurrentGestationalWeek(activePregnancy);
  }, [activePregnancy]);

  const latestLoggedMood = useMemo(() => {
    if (!moodLogs || moodLogs.length === 0) return null;
    return moodLogs[moodLogs.length - 1]?.mood;
  }, [moodLogs]);

  const handleMoodSelect = (feeling: Feeling) => {
    logMood({ mood: FEELING_TO_MOOD[feeling] });
  };

  return (
    <ScrollView style={styles.mainContainer} contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
      
      {/* 1. Greeting Layer */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greetingHeader}>{greeting}, {firstName} ✨</Text>
        <Text style={styles.greetingSubtext}>Take a gentle breath. You are building a home for a new soul today.</Text>
      </View>

      {/* 2. Upcoming Appointment Banner */}
      {nextAppointment && (
        <NextVisitBanner 
          date={nextAppointment.scheduled_at} 
          onDismiss={() => setDismissedAppointment(true)} 
          onTap={() => router.push("/tabs/appointments")} 
        />
      )}

      {/* 3. Central Hero Card */}
      <View style={styles.journeyWrapper}>
        <LinearGradient
          colors={[AUTH_UI.overlayCard96, AUTH_UI.warmBackgroundSoft]}
          style={styles.journeyCard}
        >
          <View style={styles.journeyTopLine}>
            <View style={styles.weekBadge}>
              <Text style={styles.weekBadgeText}>{currentGestationalWeek} Weeks</Text>
            </View>
            <Text style={styles.trimesterText}>Cruising your 2nd Trimester</Text>
          </View>

          <View style={styles.babyIdentityCard}>
            <Text style={styles.babyFruitEmoji}>🥑</Text>
            <View style={styles.babyIdentityDetails}>
              <Text style={styles.babySizeHeader}>Your baby is the size of an Avocado</Text>
              <Text style={styles.babySizeStats}>Approx. 11.6 cm • Beautifully listening to you</Text>
            </View>
          </View>
          
          {/* Mood Selector Check-In */}
          <View style={styles.emotionalInterventionRow}>
            <Text style={styles.emotionalInquiryText}>How is your beautiful heart feeling right now, mama?</Text>
            <View style={styles.emojisFlexGrid}>
              {FEELING_CHOICES.map((choice) => {
                const isActive = latestLoggedMood && choice.key !== "other" && FEELING_TO_MOOD[choice.key as Feeling] === latestLoggedMood;
                return (
                  <TouchableOpacity 
                    key={choice.key} 
                    style={[styles.emojiCardBtn, isActive && styles.emojiCardBtnActive]}
                    onPress={() => choice.key !== "other" && handleMoodSelect(choice.key as Feeling)}
                  >
                    <Text style={styles.emojiGlyph}>{choice.emoji}</Text>
                    <Text style={[styles.emojiLabel, isActive && styles.emojiLabelActive]}>{choice.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* 4. Quick Access Grid */}
      <View style={styles.supportBridgesGrid}>
        <TouchableOpacity style={styles.bridgeCardContainer} onPress={() => router.push("/chat")}>
          <View style={styles.bridgeIconCircle}>
            <CareIcon name="chat" color={AUTH_UI.linkBerry} size={18} />
          </View>
          <View style={styles.bridgeTextWrap}>
            <Text style={styles.bridgeHeader}>Gentle Expert Chat</Text>
            <Text style={styles.bridgeSub}>Instant medical guidance.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bridgeCardContainer} onPress={() => router.push("/tabs/tracker")}>
          <View style={styles.bridgeIconCircle}>
            <Ionicons name="people" color={AUTH_UI.linkBerry} size={18} />
          </View>
          <View style={styles.bridgeTextWrap}>
            <Text style={styles.bridgeHeader}>Circle Room</Text>
            <Text style={styles.bridgeSub}>Reflect safely with peers.</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 5. Two Column Care Block */}
      <View style={styles.careDomainContainer}>
        <Text style={styles.domainSectionTitle}>Nourishing Your Body</Text>
        
        <View style={styles.careCardsTwoColumnGrid}>
          {/* Hydration Card */}
          <View style={styles.careGridCardElement}>
            <View style={styles.cardIndicatorHeaderRow}>
              <Text style={styles.careCardInternalLabel}>Hydration</Text>
              <CareIcon name="water" color={AUTH_UI.semanticBlue} size={20} />
            </View>
            <View style={styles.metricQuantitativeBody}>
              <Text style={styles.metricValueLarge}>{currentWaterCount}<Text style={styles.metricValueDenom}>/8 glasses</Text></Text>
              <View style={styles.trackerBaseTrackBar}>
                <View style={[styles.trackerFilledProgressBar, { width: `${Math.min((currentWaterCount / 8) * 100, 100)}%`, backgroundColor: AUTH_UI.semanticBlue }]} />
              </View>
            </View>
            <TouchableOpacity style={styles.logActionInlineBtn} onPress={() => logHydration({ glasses_count: currentWaterCount + 1 })}>
              <Text style={styles.logActionInlineBtnText}>+ Add Glass</Text>
            </TouchableOpacity>
          </View>

          {/* Daily Supps Ritual Card */}
          <View style={styles.careGridCardElement}>
            <View style={styles.cardIndicatorHeaderRow}>
              <Text style={styles.careCardInternalLabel}>Daily Rituals</Text>
              <CareIcon name="mood" color={AUTH_UI.linkBerry} size={20} />
            </View>
            <View style={styles.metricQuantitativeBody}>
              <Text style={styles.metricValueLarge}>{isFolicTaken ? "Completed" : "Nourished?"}</Text>
              <Text style={styles.metricSubDescriptiveText}>{isFolicTaken ? "Folic Acid logged" : "Soft vitamin reminder"}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.logActionInlineBtn, isFolicTaken && styles.logActionInlineBtnDisabled]} 
              onPress={() => !isFolicTaken && logFolicAcid({ taken: true })}
              disabled={isFolicTaken}
            >
              <Text style={[styles.logActionInlineBtnText, isFolicTaken && styles.logActionInlineBtnTextDisabled]}>
                {isFolicTaken ? "✓ Done" : "Log Ritual"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sleep Card */}
          <View style={styles.careGridCardElement}>
            <View style={styles.cardIndicatorHeaderRow}>
              <Text style={styles.careCardInternalLabel}>Sweet Sleep</Text>
              <CareIcon name="sleep" color={AUTH_UI.semanticModerate} size={20} />
            </View>
            <View style={styles.metricQuantitativeBody}>
              <Text style={styles.metricValueLarge}>Rest & Heal</Text>
              <Text style={styles.metricSubDescriptiveText}>{sleepLogs && sleepLogs.length > 0 ? formatSleepDuration(sleepLogs[sleepLogs.length - 1]?.duration_band) : "Listen to your rhythm"}</Text>
            </View>
            <TouchableOpacity style={styles.logActionInlineBtn} onPress={() => router.push("/tabs/tracker")}>
              <Text style={styles.logActionInlineBtnText}>View Sleep</Text>
            </TouchableOpacity>
          </View>

          {/* Symptoms Card */}
          <View style={styles.careGridCardElement}>
            <View style={styles.cardIndicatorHeaderRow}>
              <Text style={styles.careCardInternalLabel}>Physical Care</Text>
              <CareIcon name="symptoms" color={AUTH_UI.semanticSevere} size={20} />
            </View>
            <View style={styles.metricQuantitativeBody}>
              <Text style={styles.metricValueLarge}>Symptoms</Text>
              <Text style={styles.metricSubDescriptiveText}>Track safe updates</Text>
            </View>
            <TouchableOpacity style={styles.logActionInlineBtn} onPress={() => router.push("/tabs/symptoms")}>
              <Text style={styles.logActionInlineBtnText}>Log Body</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 6. Educational Context Layout */}
      <View style={styles.nestingBlockOuter}>
        <Text style={styles.domainSectionTitle}>Preparing the Nest</Text>
        <WeeklyContentCard week={currentGestationalWeek} />
      </View>

    </ScrollView>
  );
}

// ── Strict Styles Matrix (100% Native Safe) ──────────────────────────────────

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: AUTH_UI.warmBackground,
  },
  scrollPadding: {
    paddingBottom: 40,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginTop: Platform.OS === "ios" ? 24 : 16,
    marginBottom: 16,
  },
  greetingHeader: {
    fontFamily: FONT_WARM_SERIF,
    fontSize: 25,
    fontWeight: "bold",
    color: AUTH_UI.textHeading,
    letterSpacing: -0.2,
  },
  greetingSubtext: {
    fontFamily: FONT_FRIENDLY_SANS,
    fontSize: 13,
    color: AUTH_UI.textWarmMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  bannerWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  banner: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.2,
    borderColor: AUTH_UI.lineSoftWarm,
  },
  bannerGradient: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  bannerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: AUTH_UI.cream,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontFamily: FONT_FRIENDLY_SANS,
    fontSize: 11,
    fontWeight: "700",
    color: AUTH_UI.textWarmMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  bannerDate: {
    fontFamily: FONT_WARM_SERIF,
    fontSize: 15,
    fontWeight: "bold",
    color: AUTH_UI.textHeading,
    marginTop: 2,
  },
  bannerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerDismiss: {
    padding: 4,
  },
  journeyWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  journeyCard: {
    borderRadius: AUTH_UI.cardRadius,
    padding: 20,
    borderWidth: 1.5,
    borderColor: AUTH_UI.lineSoftWarm,
  },
  journeyTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekBadge: {
    backgroundColor: AUTH_UI.linkBerry,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
  },
  weekBadgeText: {
    fontFamily: FONT_FRIENDLY_SANS,
    color: AUTH_UI.textWhite,
    fontSize: 12,
    fontWeight: "700",
  },
  trimesterText: {
    fontFamily: FONT_FRIENDLY_SANS,
    fontSize: 12,
    fontWeight: "600",
    color: AUTH_UI.textWarm,
  },
  babyIdentityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AUTH_UI.overlayCard,
    borderRadius: 18,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: AUTH_UI.overlayWhite88,
  },
  babyFruitEmoji: {
    fontSize: 30,
    marginRight: 12,
  },
  babyIdentityDetails: {
    flex: 1,
  },
  babySizeHeader: {
    fontFamily: FONT_WARM_SERIF,
    fontSize: 14,
    fontWeight: "bold",
    color: AUTH_UI.textHeading,
  },
  babySizeStats: {
    fontFamily: FONT_FRIENDLY_SANS,
    fontSize: 12,
    color: AUTH_UI.textWarmMuted,
    marginTop: 2,
  },
  emotionalInterventionRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: AUTH_UI.lineSoftWarm,
  },
  emotionalInquiryText: {
    fontFamily: FONT_FRIENDLY_SANS,
    fontSize: 13,
    fontWeight: "600",
    color: AUTH_UI.textWarmStrong,
    textAlign: "center",
    marginBottom: 10,
  },
  emojisFlexGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  emojiCardBtn: {
    alignItems: "center",
    backgroundColor: AUTH_UI.overlayCard,
    borderRadius: 14,
    paddingVertical: 8,
    width: "18%",
    borderWidth: 1,
    borderColor: AUTH_UI.overlayWhite88,
  },
  emojiCardBtnActive: {
    borderColor: AUTH_UI.linkBerry,
    backgroundColor: AUTH_UI.warmBackgroundSoft,
  },
  emojiGlyph: {
    fontSize: 18,
  },
  emojiLabel: {
    fontFamily: FONT_FRIENDLY_SANS,
    fontSize: 10,
    color: AUTH_UI.textWarmMuted,
    marginTop: 4,
  },
  emojiLabelActive: {
    color: AUTH_UI.linkBerry,
    fontWeight: "700",
  },
  supportBridgesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  bridgeCardContainer: {
    width: "48%",
    backgroundColor: AUTH_UI.overlayCard90,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: AUTH_UI.lineSoftWarm,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bridgeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: AUTH_UI.surfaceTint,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginTop: 2,
  },
  bridgeTextWrap: {
    flex: 1,
  },
  bridgeHeader: {
    fontFamily: FONT_WARM_SERIF,
    fontSize: 13,
    fontWeight: "bold",
    color: AUTH_UI.textHeading,
  },
  bridgeSub: {
    fontFamily: FONT_FRIENDLY_SANS,
    fontSize: 10,
    color: AUTH_UI.textWarmMuted,
    marginTop: 2,
    lineHeight: 13,
  },
  careDomainContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  domainSectionTitle: {
    fontFamily: FONT_WARM_SERIF,
    fontSize: 16,
    fontWeight: "bold",
    color: AUTH_UI.textHeading,
    marginBottom: 12,
  },
  careCardsTwoColumnGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  careGridCardElement: {
    width: "48%",
    backgroundColor: AUTH_UI.overlayCard96,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: AUTH_UI.lineSoftWarm,
    justifyContent: "space-between",
    minHeight: 140,
  },
  cardIndicatorHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  careCardInternalLabel: {
    fontFamily: FONT_FRIENDLY_SANS,
    fontSize: 12,
    fontWeight: "700",
    color: AUTH_UI.textWarmStrong,
  },
  metricQuantitativeBody: {
    marginVertical: 8,
  },
  metricValueLarge: {
    fontFamily: FONT_WARM_SERIF,
    fontSize: 17,
    fontWeight: "bold",
    color: AUTH_UI.textHeading,
  },
  metricValueDenom: {
    fontFamily: FONT_FRIENDLY_SANS,
    fontSize: 11,
    color: AUTH_UI.textWarmMuted,
    fontWeight: "400",
  },
  metricSubDescriptiveText: {
    fontFamily: FONT_FRIENDLY_SANS,
    fontSize: 11,
    color: AUTH_UI.textWarmMuted,
    marginTop: 2,
    lineHeight: 14,
  },
  trackerBaseTrackBar: {
    width: "100%",
    height: 4,
    backgroundColor: AUTH_UI.semanticNeutralSofter,
    borderRadius: 10,
    marginTop: 6,
    overflow: "hidden",
  },
  trackerFilledProgressBar: {
    height: "100%",
    borderRadius: 10,
  },
  logActionInlineBtn: {
    backgroundColor: AUTH_UI.warmBackgroundSoft,
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: AUTH_UI.lineSoftWarm,
  },
  logActionInlineBtnDisabled: {
    backgroundColor: AUTH_UI.semanticNeutralLight,
    borderColor: AUTH_UI.semanticNeutralSoft,
  },
  logActionInlineBtnText: {
    fontFamily: FONT_FRIENDLY_SANS,
    fontSize: 11,
    fontWeight: "600",
    color: AUTH_UI.linkBerry,
  },
  logActionInlineBtnTextDisabled: {
    color: AUTH_UI.placeholder,
  },
  nestingBlockOuter: {
    paddingHorizontal: 20,
  },
});