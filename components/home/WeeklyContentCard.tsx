/**
 * mobile/components/home/WeeklyContentCard.tsx
 *
 * Displays the current week's pregnancy content on the home screen.
 * Aligned with the single source of truth design token palette and fonts.
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

import {
  useWeekContent,
  useCreateChatSession,
  apiRequest,
  type WeeklyContent,
  useActivePregnancy,
  useChatSessions,
} from "@safeborn/api";
import { resolveCurrentGestationalWeek } from "@/lib/gestationalWeek";
import { ctaButtonStyles, ctaGradientColors } from "../styles/ctaButton";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

// ── TypeScript Props Interface ───────────────────────────────────────────────
interface WeeklyContentCardProps {
  week?: number | null; // Safely allows home.tsx to pass the current week down
}

// ── Weekly Size Visual Tokens Map ─────────────────────────────────────────────
const WEEKLY_SIZE_VISUALS: Record<number, { emoji: string; tint: string }> = {
  4:  { emoji: "🌱", tint: "#EBF7ED" }, 
  8:  { emoji: "🍇", tint: "#F5EEFF" }, 
  12: { emoji: "🍋", tint: "#FFFDE6" }, 
  16: { emoji: "🥑", tint: "#EAF6EA" }, 
  20: { emoji: "🍌", tint: "#FFFBEB" }, 
  24: { emoji: "🍈", tint: "#F4FBEA" }, 
  28: { emoji: "🍆", tint: "#FAEEFF" }, 
  32: { emoji: "🍍", tint: "#FFF9E6" }, 
  36: { emoji: "🍉", tint: "#FFF0F2" }, 
  40: { emoji: "🎃", tint: "#FFF3EB" }, 
};

function getWeeklySizeVisual(week: number) {
  const keys = Object.keys(WEEKLY_SIZE_VISUALS).map(Number).sort((a, b) => b - a);
  const matchedKey = keys.find((k) => week >= k) || 4;
  return WEEKLY_SIZE_VISUALS[matchedKey];
}

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

function buildWeeklyPrompt(content: WeeklyContent, week: number): string {
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
export function WeeklyContentCard({ week }: WeeklyContentCardProps) {
  const { width, fontScale } = useWindowDimensions();
  const isCompact = width < 380;
  const isLargeText = fontScale >= 1.2;
  const router = useRouter();
  
  // Fallback to internal fetch only if no explicit week was passed by the parent
  const { data: pregnancy, isLoading: isActivePregnancyLoading } = useActivePregnancy();
  
  const currentWeek = useMemo(() => {
    if (week !== undefined && week !== null) return week;
    return resolveCurrentGestationalWeek(pregnancy);
  }, [week, pregnancy]);
  
  const { data: weekResponse, isLoading: isWeekLoading } = useWeekContent(currentWeek ?? 0);
  const content = weekResponse?.content;
  
  const createSession = useCreateChatSession();
  const [opening, setOpening] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: chatSessions } = useChatSessions();

  const dailyTip = useMemo(
    () => (content?.tips ? getDailyTip(content.tips) : ""),
    [content?.tips]
  );

  const sizeVisual = useMemo(() => {
    return currentWeek ? getWeeklySizeVisual(currentWeek) : { emoji: "🌱", tint: "#EBF7ED" };
  }, [currentWeek]);

  async function handleTap() {
    if (!content || !currentWeek) return;
    if (opening) return;

    const existingWeeklySession = chatSessions?.find(
      (session: any) => session.gestational_week === currentWeek
    );

    if (existingWeeklySession) {
      router.push(`/chat/${existingWeeklySession.id}`);
      return;
    }

    setOpening(true);
    setLoadingMessage("Connecting you with your Safe Born Assistant...");

    timerRef.current = setTimeout(() => {
      setLoadingMessage("Still working on it, mama!...");
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

      if (timerRef.current) clearTimeout(timerRef.current);
      router.push(`/chat/${sessionId}`);

    } catch (err) {
      if (timerRef.current) clearTimeout(timerRef.current);
      console.error("WeeklyContentCard error:", err);
      Alert.alert("We're so sorry, mama", "We had a little trouble creating your chat room.");
    } finally {
      setOpening(false);
      setLoadingMessage("");
    }
  }

  // Smart loading condition: don't block on active pregnancy hooks if week is driven by the parent
  const isCardLoading = (week == null && isActivePregnancyLoading) || isWeekLoading;

  if (isCardLoading) {
    return (
      <View style={[styles.card, isCompact && styles.cardCompact, isLargeText && styles.cardLargeText, styles.loadingCard]}>
        <ActivityIndicator color={AUTH_UI.linkBerry} size="small" />
        <Text style={styles.loadingText}>Loading your weekly update…</Text>
      </View>
    );
  }

  if (!currentWeek || !content) {
    return (
      <TouchableOpacity
        style={[styles.card, isCompact && styles.cardCompact, isLargeText && styles.cardLargeText]}
        onPress={() => router.push("/onboarding/profile-setup")}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={[AUTH_UI.roseSoftBg, AUTH_UI.warmBackground]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, isLargeText && styles.gradientLargeText]}
        >
          <View style={styles.noWeekIconWrap}>
            <Ionicons name="calendar-outline" size={26} color={AUTH_UI.shadowRose} />
          </View>
          <Text style={styles.noWeekTitle}>What week are you on, mama?</Text>
          <Text style={styles.noWeekSubtitle}>
            Add your due date and we'll bring your week-by-week journey to life — just for you.
          </Text>
          <View style={styles.noWeekCta}>
            <Text style={styles.noWeekCtaText}>Set my due date</Text>
            <Ionicons name="chevron-forward" size={14} color={AUTH_UI.linkBerry} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, isCompact && styles.cardCompact, isLargeText && styles.cardLargeText]}
      onPress={handleTap}
      activeOpacity={0.88}
      disabled={opening}
    >
      <LinearGradient
        colors={[AUTH_UI.roseSoftBg, AUTH_UI.warmBackground]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, isLargeText && styles.gradientLargeText]}
      >
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
          <Ionicons name="heart" size={18} color={AUTH_UI.shadowRose} style={styles.heartAccent} />
        </View>

        <View style={styles.divider} />

        {content.baby_size_label ? (
          <View style={styles.sizeRowContainer}>
            <View style={[styles.visualBadge, { backgroundColor: sizeVisual.tint }]}>
              <Text style={styles.badgeVisualText}>{sizeVisual.emoji}</Text>
            </View>
            <View style={styles.sizeTextWrap}>
              <Text style={styles.sizeLabelText}>YOUR BABY IS THE SIZE OF A</Text>
              <Text style={styles.sizeValueText}>
                {content.baby_size_label}
                {content.baby_size_cm ? ` (${content.baby_size_cm} cm)` : ""}
              </Text>
            </View>
          </View>
        ) : null}

        {dailyTip ? (
          <View style={styles.tipBox}>
            <Ionicons name="sparkles" size={14} color={AUTH_UI.linkBerry} />
            <Text style={styles.tipText} numberOfLines={2}>
              {dailyTip}
            </Text>
          </View>
        ) : null}

        <View style={[ctaButtonStyles.button, styles.ctaSlimOverride]}>
          <LinearGradient
            colors={ctaGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradientWrapper}
          >
            {opening ? (
              <View style={styles.ctaContentRow}>
                <ActivityIndicator size="small" color={AUTH_UI.textWhite} />
                <Text style={[ctaButtonStyles.text, styles.ctaSingleLineText]}>Opening weekly chat…</Text>
              </View>
            ) : (
              <View style={styles.ctaContentRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={15} color={AUTH_UI.textWhite} style={styles.ctaIconVerticalFix} />
                <Text style={[ctaButtonStyles.text, styles.ctaSingleLineText]} numberOfLines={1} ellipsizeMode="tail">
                  Discuss Week {currentWeek} with Safeborn Agent
                </Text>
                <Ionicons name="chevron-forward" size={15} color={AUTH_UI.textWhite} style={styles.ctaIconVerticalFix} />
              </View>
            )}
          </LinearGradient>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Styles (Unchanged, 100% Mobile Safe) ──────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: AUTH_UI.lineSoftWarm,
    ...Platform.select({
      ios: {
        shadowColor: AUTH_UI.shadowRose,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  cardCompact: { borderRadius: 20 },
  cardLargeText: { marginBottom: 20 },
  gradient: { padding: 18 },
  gradientLargeText: { padding: 20 },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: AUTH_UI.overlayCard,
    paddingVertical: 28,
  },
  loadingText: {
    fontSize: 15,
    color: AUTH_UI.textWarm,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  noWeekIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: AUTH_UI.avatarRoseBg,
    justifyContent: "center", alignItems: "center",
    marginBottom: 12, alignSelf: "center",
  },
  noWeekTitle: {
    fontSize: 18, fontWeight: "700", color: AUTH_UI.textHeading,
    textAlign: "center", marginBottom: 8,
    fontFamily: FONT_WARM_SERIF,
  },
  noWeekSubtitle: {
    fontSize: 15, color: AUTH_UI.textBlack,
    textAlign: "center", lineHeight: 22, marginBottom: 16,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  noWeekCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  noWeekCtaText: { fontSize: 14, fontWeight: "700", color: AUTH_UI.linkBerry, fontFamily: FONT_FRIENDLY_SANS },
  topRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  topRowCompact: { gap: 10, marginBottom: 10 },
  topRowWrap: { alignItems: "flex-start" },
  weekBadge: {
    width: 54, height: 54, borderRadius: 27,
    justifyContent: "center", alignItems: "center",
    backgroundColor: AUTH_UI.linkBerry,
    ...Platform.select({
      ios: {
        shadowColor: AUTH_UI.linkBerry,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  weekBadgeNumber: { fontSize: 20, fontWeight: "800", color: AUTH_UI.textWhite, lineHeight: 22 },
  weekBadgeCompact: { width: 50, height: 50, borderRadius: 25 },
  weekBadgeLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.82)", letterSpacing: 0.2 },
  topRight: { flex: 1, gap: 2 },
  trimesterLabel: { fontSize: 12, fontWeight: "700", color: AUTH_UI.textWarmStrong, letterSpacing: 0.4, fontFamily: FONT_FRIENDLY_SANS },
  contentTitle: { fontSize: 19, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF },
  contentTitleCompact: { fontSize: 17 },
  heartAccent: { alignSelf: "flex-start", marginTop: 4 },
  divider: { height: 1, backgroundColor: AUTH_UI.lineSoftWarm, marginBottom: 14 },
  sizeRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AUTH_UI.overlayCard,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: AUTH_UI.mutedBorder20,
    marginBottom: 14,
  },
  visualBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  badgeVisualText: {
    fontSize: 24,
    textAlign: "center",
  },
  sizeTextWrap: {
    flex: 1,
    justifyContent: "center",
  },
  sizeLabelText: {
    fontSize: 10,
    fontWeight: "800",
    color: AUTH_UI.textWarm,
    letterSpacing: 0.6,
    fontFamily: FONT_FRIENDLY_SANS,
    marginBottom: 1,
  },
  sizeValueText: {
    fontSize: 16,
    fontWeight: "800",
    color: AUTH_UI.textHeading,
    fontFamily: FONT_WARM_SERIF,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: AUTH_UI.avatarRoseBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: AUTH_UI.shadowRose,
  },
  tipText: { flex: 1, fontSize: 14, color: AUTH_UI.textWarmStrong, lineHeight: 20, fontFamily: FONT_FRIENDLY_SANS },
  ctaSlimOverride: {
    height: "auto",
    minHeight: 48,
    marginTop: 10,
    borderRadius: 16,
    overflow: "hidden",
    padding: 0,
  },
  ctaGradientWrapper: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    gap: 6,
  },
  ctaSingleLineText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: AUTH_UI.textWhite,
    textAlign: "center",
    marginTop: 0,
    marginBottom: 0,
    lineHeight: Platform.OS === "ios" ? 18 : 20,
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: "center",
      },
    }),
  },
  ctaIconVerticalFix: {
    alignSelf: "center",
  },
});