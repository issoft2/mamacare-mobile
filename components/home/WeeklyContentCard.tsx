/**
 * mobile/components/home/WeeklyContentCard.tsx
 *
 * Displays the current week's pregnancy content on the home screen.
 * Optimized to prevent layout bloat and fix trimester welcome text bugs.
 *
 * On tap:
 *  1. Creates a new chat session for the current gestational week
 *  2. Sends an opening message built from the week's content data
 *     using a direct apiRequest (not a hook) so the session ID is
 *     available immediately without waiting for a state update
 *  3. Navigates into the chat session — AI response will arrive
 *     via the polling loop in the chat screen
 */

import { useRouter } from "expo-router";
import { useState, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors } from "@safeborn/ui";
import {
  useWeekContent,
  useCreateChatSession,
  apiRequest,
  type WeeklyContent,
  useActivePregnancy,
} from "@safeborn/api";
import { resolveCurrentGestationalWeek } from "@/lib/gestationalWeek";
import { ctaButtonStyles, ctaGradientColors } from "../styles/ctaButton";

const TEXT_BLACK = "#111111";
const FONT_WARM_SERIF = Platform.OS === "ios" ? "Georgia" : "serif";
const FONT_FRIENDLY_SANS = Platform.OS === "ios" ? "Avenir Next" : "sans-serif";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDailyTip(tips: string[]): string {
  if (!tips.length) return "";
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86_400_000
  );
  return tips[dayOfYear % tips.length];
}

function trimesterLabel(t: number): string {
  if (t === 1) return "1st trimester";
  if (t === 2) return "2nd trimester";
  return "3rd trimester";
}

/**
 * Dynamically resolves status copy to prevent displaying "Welcome to Trimester 2" 
 * to a user deep into their 24th week of pregnancy.
 */
function getTrimesterStatusText(trimester: number, week: number): string {
  if (trimester === 1) {
    return week <= 4 ? "Welcome to Trimester 1" : "Growing in Trimester 1";
  }
  if (trimester === 2) {
    if (week >= 13 && week <= 15) return "Welcome to Trimester 2";
    if (week >= 24) return "Nearing Trimester 3";
    return "Cruising through Trimester 2";
  }
  if (trimester === 3) {
    if (week >= 28 && week <= 30) return "Welcome to Trimester 3";
    if (week >= 37) return "Approaching full term!";
    return "Deep in Trimester 3";
  }
  return "Your weekly update";
}

/**
 * Builds the opening message sent to the AI when the user taps
 * the weekly content card. Written as a natural user message so
 * it fits the existing chat pipeline without any backend changes.
 */
function buildWeeklyPrompt_bk(content: WeeklyContent, week: number): string {
  const lines: string[] = [
    `I'm in week ${week} of my pregnancy (${trimesterLabel(content.trimester)}).`,
    `Can you give me a warm overview of what's happening this week?`,
    ``,
    `Here's what I know about this week:`,
    `- My baby is about the size of ${content.baby_size_label ?? "growing beautifully"}.`,
  ];

  if (content.baby_development) {
    lines.push(`- Baby development: ${content.baby_development}`);
  }
  if (content.common_symptoms?.length) {
    lines.push(
      `- Common symptoms this week: ${content.common_symptoms.slice(0, 4).join(", ")}.`
    );
  }
  if (content.warning_signs?.length) {
    lines.push(
      `- Warning signs to watch for: ${content.warning_signs.slice(0, 3).join(", ")}.`
    );
  }
  if (content.tips?.length) {
    lines.push(`- Tips I've seen: ${content.tips.slice(0, 2).join("; ")}.`);
  }

  lines.push(``);
  lines.push(
    `Please give me warm, reassuring advice about what to expect, ` +
    `what I should be doing, and any self-care tips for week ${week}. ` +
    `Also let me know gently what warning signs I should never ignore.`
  );

  return lines.join("\n");
}


function buildWeeklyPrompt(content: WeeklyContent, week: number): string {
  // Pass the exact size asset label so the AI text syncs perfectly with the card image UI
  const sizeLabel = content.baby_size_label ?? "growing beautifully";
  const currentTrimester = trimesterLabel(content.trimester);

  return [
    `Hi SafeBorn! I am officially in week ${week} of my pregnancy, running through my ${currentTrimester}.`,
    `My homepage tracking card says my little one is about the size of a ${sizeLabel} right now! 🥰`,
    `Can you give me a warm, older-sister overview of what is happening inside my body and with my baby's development this specific week?`,
    `I would love some practical, reassuring advice on how to comfortably navigate changes at this stage, what self-care routines I should keep up with, and what standard warning signs I should keep in mind to stay safe. Thank you!`
  ].join("\n\n");
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WeeklyContentCard() {
  const { width, fontScale } = useWindowDimensions();
  const isCompact = width < 380;
  const isLargeText = fontScale >= 1.2;
  const router = useRouter();
  const { data: pregnancy, isLoading: isActivePregnancyLoading } = useActivePregnancy();
  const currentWeek = useMemo(() => resolveCurrentGestationalWeek(pregnancy), [pregnancy]);
  const { data: weekResponse, isLoading: isWeekLoading } = useWeekContent(currentWeek ?? 0);
  const content = weekResponse?.content;
  const createSession = useCreateChatSession();
  const [opening, setOpening] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const timerRef = useRef<number | null>(null);

  const dailyTip = useMemo(
    () => (content?.tips ? getDailyTip(content.tips) : ""),
    [content?.tips]
  );

  async function handleTap() {
    if (!content || !currentWeek) return;
    if (opening) return;

    setOpening(true);
     
    // Initial arm, welcome message 
    setLoadingMessage("Coneecting with your Safe Born Assistant... Take a deep breath, we're preparing a beautify space for you and your little one. 💕");

    // Second message after 2 seconds if still loading
    timerRef.current = setTimeout(() => {
      setLoadingMessage("Still working on it, mama! We're getting everything ready for you. Just a tiny moment more... ✨👶")
    }, 2000);

    try {
      const session = await createSession.mutateAsync({
        gestational_week: currentWeek,
      });

      const sessionId = session.id.toString();
      const prompt = buildWeeklyPrompt(content, currentWeek);
      
      await apiRequest(`/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: prompt }),
      });

      router.push(`/chat/${sessionId}`);
    } catch (err) {
      console.error("WeeklyContentCard error:", err);
      Alert.alert("Couldn't open chat", "Please try again in a moment.");
    } finally {
      setOpening(false);
    }
  }

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isActivePregnancyLoading || (currentWeek != null && isWeekLoading)) {
    return (
      <View style={[styles.card, isCompact && styles.cardCompact, isLargeText && styles.cardLargeText, styles.loadingCard]}>
        <ActivityIndicator color={colors.rose[300]} size="small" />
        <Text style={styles.loadingText}>Loading your weekly update…</Text>
      </View>
    );
  }

  // ── No Week Set State ──────────────────────────────────────────────────────
  if (!currentWeek || !content) {
    return (
      <TouchableOpacity
        style={[styles.card, isCompact && styles.cardCompact, isLargeText && styles.cardLargeText]}
        onPress={() => router.push("/onboarding/profile-setup")}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={["#FFF7F2", "#FFFBF7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, isLargeText && styles.gradientLargeText]}
        >
          <View style={styles.noWeekIconWrap}>
            <Ionicons name="calendar-outline" size={28} color={colors.rose[300]} />
          </View>
          <Text style={styles.noWeekTitle}>What week are you on, mama?</Text>
          <Text style={styles.noWeekSubtitle}>
            Add your due date and we'll bring your week-by-week journey to life — just for you.
          </Text>
          <View style={styles.noWeekCta}>
            <Text style={styles.noWeekCtaText}>Set my due date</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.rose[400]} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // ── Active Content State ───────────────────────────────────────────────────
  return (
    <TouchableOpacity
      style={[styles.card, isCompact && styles.cardCompact, isLargeText && styles.cardLargeText]}
      onPress={handleTap}
      activeOpacity={0.88}
      disabled={opening}
    >
      <LinearGradient
        colors={["#FFF4EE", "#FFFBF7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, isLargeText && styles.gradientLargeText]}
      >
        {/* ── Top Header Row ─────────────────────────────────── */}
        <View style={[styles.topRow, isCompact && styles.topRowCompact, isLargeText && styles.topRowWrap]}>
          <View style={[styles.weekBadge, isCompact && styles.weekBadgeCompact]}>
            <Text style={styles.weekBadgeNumber}>{currentWeek}</Text>
            <Text style={styles.weekBadgeLabel}>weeks</Text>
          </View>
          <View style={styles.topRight}>
            <Text style={styles.trimesterLabel}>
              {trimesterLabel(content.trimester)}
            </Text>
            <Text style={[styles.contentTitle, isCompact && styles.contentTitleCompact]} numberOfLines={1}>
              {getTrimesterStatusText(content.trimester, currentWeek)}
            </Text>
          </View>
          <Ionicons name="heart" size={18} color={colors.rose[200]} style={styles.heartAccent} />
        </View>

        {/* ── Divider ─────────────────────────────────────────── */}
        <View style={styles.divider} />

        {/* ── Baby Size Data Row ──────────────────────────────── */}
        {content.baby_size_label ? (
          <View style={styles.babySizeRow}>
            <Text style={styles.babySizeEmoji}>🌱</Text>
            <Text style={styles.babySizeText}>
              Your baby is about the size of{" "}
              <Text style={styles.babySizeHighlight}>
                {content.baby_size_label}
              </Text>
              {content.baby_size_cm ? ` · ${content.baby_size_cm} cm` : ""}
            </Text>
          </View>
        ) : null}

        {/* ── Daily Personalized Tip ──────────────────────────── */}
        {dailyTip ? (
          <View style={styles.tipBox}>
            <Ionicons name="sparkles" size={14} color={colors.rose[400]} />
            <Text style={styles.tipText} numberOfLines={2}>
              {dailyTip}
            </Text>
          </View>
        ) : null}

        {/* ── Slimmed Down & Compact Chat CTA Bar ──────────────── */}
        <View style={[ctaButtonStyles.button, styles.ctaSlimOverride]}>
          <LinearGradient
            colors={ctaGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={ctaButtonStyles.gradient}
          >
            {opening ? (
              <View style={styles.ctaContentRow}>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={ctaButtonStyles.text}>Opening weekly chat…</Text>
              </View>
            ) : (
              <View style={styles.ctaContentRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFF" />
                <Text style={[ctaButtonStyles.text, styles.ctaSingleLineText]}>
                  Discuss Week {currentWeek} with Safeborn Agent
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#FFF" />
              </View>
            )}
          </LinearGradient>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(140,90,82,0.14)",
    ...Platform.select({
      ios: {
        shadowColor: "#C97B6E",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  cardCompact: { borderRadius: 20 },
  cardLargeText: { marginBottom: 20 },
  gradient: { padding: 18 }, // Reduced slightly from 20 to tighten screen space
  gradientLargeText: { padding: 20 },

  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FFF5F7",
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 16,
    color: TEXT_BLACK,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  noWeekIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.rose[50],
    justifyContent: "center", alignItems: "center",
    marginBottom: 12, alignSelf: "center",
  },
  noWeekTitle: {
    fontSize: 18, fontWeight: "700", color: TEXT_BLACK,
    textAlign: "center", marginBottom: 8,
    fontFamily: FONT_WARM_SERIF,
  },
  noWeekSubtitle: {
    fontSize: 16, color: TEXT_BLACK,
    textAlign: "center", lineHeight: 24, marginBottom: 16,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  noWeekCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  noWeekCtaText: { fontSize: 15, fontWeight: "700", color: colors.rose[400], fontFamily: FONT_FRIENDLY_SANS },

  topRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  topRowCompact: { gap: 10, marginBottom: 10 },
  topRowWrap: { alignItems: "flex-start" },
  weekBadge: {
    width: 54, height: 54, borderRadius: 27,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "#C97B6E",
    ...Platform.select({
      ios: {
        shadowColor: colors.rose[400],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  weekBadgeNumber: { fontSize: 20, fontWeight: "800", color: "#FFF", lineHeight: 22 },
  weekBadgeCompact: { width: 50, height: 50, borderRadius: 25 },
  weekBadgeLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.8)", letterSpacing: 0.2 },
  topRight: { flex: 1, gap: 3 },
  trimesterLabel: { fontSize: 13, fontWeight: "700", color: "#8E5A54", letterSpacing: 0.2, fontFamily: FONT_FRIENDLY_SANS },
  contentTitle: { fontSize: 18, fontWeight: "700", color: TEXT_BLACK, fontFamily: FONT_WARM_SERIF },
  contentTitleCompact: { fontSize: 17 },
  heartAccent: { alignSelf: "flex-start", marginTop: 2 },

  divider: { height: 1, backgroundColor: colors.rose[100], marginBottom: 12 },

  babySizeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  babySizeEmoji: { fontSize: 18 },
  babySizeText: { fontSize: 15, color: TEXT_BLACK, flex: 1, lineHeight: 22, fontFamily: FONT_FRIENDLY_SANS },
  babySizeHighlight: { color: "#8E5A54", fontWeight: "700", fontFamily: FONT_FRIENDLY_SANS },

  tipBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(201,123,110,0.08)",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 4,
    borderLeftWidth: 3, borderLeftColor: "#C97B6E",
  },
  tipText: { flex: 1, fontSize: 14, color: TEXT_BLACK, lineHeight: 20, fontFamily: FONT_FRIENDLY_SANS },

  ctaSlimOverride: {
    height: 48,
    marginTop: 10,
    borderRadius: 14,
    overflow: "hidden",
  },
  ctaContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    gap: 8,
    paddingHorizontal: 16,
  },
  ctaSingleLineText: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 0,
    marginBottom: 0,
  },
});