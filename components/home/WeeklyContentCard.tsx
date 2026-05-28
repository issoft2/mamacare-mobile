/**
 * mobile/components/home/WeeklyContentCard.tsx
 *
 * Displays the current week's pregnancy content on the home screen.
 *
 * On tap:
 *  1. Creates a new chat session for the current gestational week
 *  2. Sends an opening message built from the week's content data
 *     using a direct apiRequest (not a hook) so the session ID is
 *     available immediately without waiting for a state update
 *  3. Navigates into the chat session — AI response will arrive
 *     via the polling loop in the chat screen
 *
 * States:
 *  - Loading   → soft activity indicator
 *  - No week   → warm prompt to set due date
 *  - Content   → week badge, baby size, overview, daily tip, chat CTA
 */

import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors } from "@mumcare/ui";
import {
  useProfile,
  useWeekContent,
  useCreateChatSession,
  apiRequest,
  type WeeklyContent,
} from "@mumcare/api";
import { calculateGestationalWeek } from "@/lib/gestationalWeek";
import { ctaButtonStyles, ctaGradientColors } from "../styles/ctaButton";

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
 * Builds the opening message sent to the AI when the user taps
 * the weekly content card. Written as a natural user message so
 * it fits the existing chat pipeline without any backend changes.
 */
function buildWeeklyPrompt(content: WeeklyContent, week: number): string {
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

// ── Component ─────────────────────────────────────────────────────────────────

export function WeeklyContentCard() {
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const currentWeek = useMemo(
    () =>
      calculateGestationalWeek({
        estimatedDueDate: profile?.estimated_due_date,
        lmpDate: profile?.lmp_date,
        fallbackWeek: profile?.gestational_week,
      }),
    [profile?.estimated_due_date, profile?.lmp_date, profile?.gestational_week]
  );
  const { data: weekResponse, isLoading: isWeekLoading } = useWeekContent(currentWeek ?? 0);
  const content = weekResponse?.content;
  const createSession = useCreateChatSession();
  const [opening, setOpening] = useState(false);

  const dailyTip = useMemo(
    () => (content?.tips ? getDailyTip(content.tips) : ""),
    [content?.tips]
  );

  async function handleTap() {
    if (!content || !currentWeek) return;
    if (opening) return;

    setOpening(true);
    try {
      // Step 1 — create the chat session
      const session = await createSession.mutateAsync({
        gestational_week: currentWeek,
      });

      const sessionId = session.id.toString();

      // Step 2 — send the opening message directly via apiRequest.
      // We cannot use the useSendMessage hook here because hook values
      // are fixed at render time — the new sessionId isn't available
      // to the hook until the next render cycle, which causes a failure.
      // Direct apiRequest uses the session ID immediately and correctly.
      const prompt = buildWeeklyPrompt(content, currentWeek);
      await apiRequest(`/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: prompt }),
      });

      // Step 3 — navigate. The chat screen's polling loop will detect
      // the pending AI response and show it when it arrives.
      router.push(`/chat/${sessionId}`);
    } catch (err) {
      console.error("WeeklyContentCard error:", err);
      Alert.alert(
        "Couldn't open chat",
        "Please try again in a moment."
      );
    } finally {
      setOpening(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isProfileLoading || (currentWeek != null && isWeekLoading)) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator color={colors.rose[300]} size="small" />
        <Text style={styles.loadingText}>Loading your weekly update…</Text>
      </View>
    );
  }

  // ── No week set ────────────────────────────────────────────────────────────
  if (!currentWeek || !content) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/onboarding/profile-setup")}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={["#FFF7F2", "#FFFBF7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.noWeekIconWrap}>
            <Ionicons name="calendar-outline" size={28} color={colors.rose[300]} />
          </View>
          <Text style={styles.noWeekTitle}>What week are you on, mama?</Text>
          <Text style={styles.noWeekSubtitle}>
            Add your due date and we'll bring your week-by-week journey
            to life — just for you.
          </Text>
          <View style={styles.noWeekCta}>
            <Text style={styles.noWeekCtaText}>Set my due date</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.rose[400]} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // ── Content ────────────────────────────────────────────────────────────────
  const current_week = currentWeek;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleTap}
      activeOpacity={0.88}
      disabled={opening}
    >
      <LinearGradient
        colors={["#FFF4EE", "#FFFBF7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* ── Top row ─────────────────────────────────────────── */}
        <View style={styles.topRow}>
          <View style={styles.weekBadge}>
              
            <Text style={styles.weekBadgeNumber}>{current_week}</Text>
            <Text style={styles.weekBadgeLabel}>weeks</Text>
            
          </View>
          <View style={styles.topRight}>
            <Text style={styles.trimesterLabel}>
              {trimesterLabel(content.trimester)}
            </Text>
            <Text style={styles.contentTitle} numberOfLines={1}>
              {content.title}
            </Text>
          </View>
          <Ionicons name="heart" size={18} color={colors.rose[200]} style={styles.heartAccent} />
        </View>

        {/* ── Divider ─────────────────────────────────────────── */}
        <View style={styles.divider} />

        {/* ── Baby size ───────────────────────────────────────── */}
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

        {/* ── Overview ────────────────────────────────────────── */}
        <Text style={styles.overview} numberOfLines={3}>
          {content.overview}
        </Text>

        {/* ── Daily tip ───────────────────────────────────────── */}
        {dailyTip ? (
          <View style={styles.tipBox}>
            <Ionicons name="sparkles" size={14} color={colors.rose[400]} />
            <Text style={styles.tipText} numberOfLines={2}>
              {dailyTip}
            </Text>
          </View>
        ) : null}

        {/* ── Chat CTA ────────────────────────────────────────── */}
        <View style={ctaButtonStyles.button}>
          <LinearGradient
                          colors={ctaGradientColors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={ctaButtonStyles.gradient}
                        >

          {opening ? (
            <>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={ctaButtonStyles.text}>Opening your weekly chat…</Text>
            </>
          ) : ( 
            <>
              <View style={styles.chatPromptIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFF" />
              </View>
              <View style={styles.chatPromptCopy}>
                <Text style={ctaButtonStyles.text}>
                  Chat with MumCare about week {current_week}
                </Text>
                <Text style={ctaButtonStyles.text}>
                  Tap for a warm breakdown of what to expect.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FFF" />
            </>
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
  gradient: { padding: 20 },

  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FFF5F7",
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
    color: colors.navy[300],
    fontStyle: "italic",
  },

  noWeekIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.rose[50],
    justifyContent: "center", alignItems: "center",
    marginBottom: 12, alignSelf: "center",
  },
  noWeekTitle: {
    fontSize: 17, fontWeight: "700", color: colors.navy[700],
    textAlign: "center", marginBottom: 8,
  },
  noWeekSubtitle: {
    fontSize: 14, color: colors.navy[400],
    textAlign: "center", lineHeight: 21, marginBottom: 16,
  },
  noWeekCta: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 4,
  },
  noWeekCtaText: { fontSize: 14, fontWeight: "700", color: colors.rose[400] },

  topRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  weekBadge: {
    width: 54, height: 54, borderRadius: 27,
    justifyContent: "center", alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.rose[400],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
    backgroundColor: "#C97B6E",
  },
  weekBadgeNumber: { fontSize: 20, fontWeight: "800", color: "#FFF", lineHeight: 22 },
  weekBadgeLabel: {
    fontSize: 9, fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  topRight: { flex: 1, gap: 3 },
  trimesterLabel: {
    fontSize: 11, fontWeight: "700", color: "#8E5A54",
    textTransform: "uppercase", letterSpacing: 1,
  },
  contentTitle: { fontSize: 16, fontWeight: "700", color: colors.navy[700] },
  heartAccent: { alignSelf: "flex-start", marginTop: 2 },

  divider: { height: 1, backgroundColor: colors.rose[100], marginBottom: 14 },

  babySizeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  babySizeEmoji: { fontSize: 18 },
  babySizeText: { fontSize: 13, color: colors.navy[400], flex: 1, lineHeight: 19 },
  babySizeHighlight: { color: "#8E5A54", fontWeight: "700" },

  overview: { fontSize: 14, color: colors.navy[500], lineHeight: 22, marginBottom: 14 },

  tipBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "rgba(201,123,110,0.10)",
    borderRadius: 12, padding: 12, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: "#C97B6E",
  },
  tipText: {
    flex: 1, fontSize: 13, color: colors.navy[600],
    lineHeight: 20, fontStyle: "italic",
  },

  chatPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.rose[500],
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
  },
  chatPromptIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatPromptCopy: { flex: 1 },
  chatPromptTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
  chatPromptText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
});
