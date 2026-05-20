/**
 * mobile/components/home/WeeklyContentCard.tsx
 *
 * Displays the current week's pregnancy content on the home screen.
 *
 * On tap:
 *  1. Creates a new chat session for the current gestational week
 *  2. Sends an opening message built from the week's content data
 *  3. The AI responds automatically with warm, personalised weekly guidance
 *  4. Navigates the user into that chat session
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
  useCurrentWeekContent,
  useCreateChatSession,
  useSendMessage,
} from "@mumcare/api";
import type { WeeklyContent } from "@mumcare/types";

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
 * the weekly content card. Structured as a natural user message
 * so it fits the existing chat pipeline without any backend changes.
 * The AI receives full week context and responds with personalised guidance.
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

// ── Inner component that has access to the session ID for useSendMessage ──────

function WeeklyContentCardInner({
  data,
  dailyTip,
}: {
  data: NonNullable<ReturnType<typeof useCurrentWeekContent>["data"]>;
  dailyTip: string;
}) {
  const router = useRouter();
  const createSession = useCreateChatSession();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  // useSendMessage requires a sessionId — we create the session first,
  // store the id in state, then call send on the next step.
  // Since hooks can't be called conditionally, we initialise with empty
  // string and only call mutateAsync after the session is created.
  const sendMessage = useSendMessage(sessionId ?? "");

  const { content, current_week } = data;

  async function handleTap() {
    if (!content || !current_week) return;
    if (opening) return;

    setOpening(true);
    try {
      // Step 1 — create the chat session
      const session = await createSession.mutateAsync({
        gestational_week: current_week,
      });

      // Step 2 — store session id so useSendMessage is ready
      setSessionId(session.id.toString());

      // Step 3 — build and send the opening prompt
      const prompt = buildWeeklyPrompt(content, current_week);
      await sendMessage.mutateAsync({ content: prompt });

      // Step 4 — navigate into the session
      router.push(`/chat/${session.id}`);
    } catch (err) {
      Alert.alert(
        "Couldn't open chat",
        "Please try again in a moment."
      );
    } finally {
      setOpening(false);
    }
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleTap}
      activeOpacity={0.88}
      disabled={opening}
    >
      <LinearGradient
        colors={["#FFF0F3", "#FFFBF7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* ── Top row: week badge + trimester ─────────────────── */}
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

          <Ionicons
            name="heart"
            size={18}
            color={colors.rose[200]}
            style={styles.heartAccent}
          />
        </View>

        {/* ── Divider ──────────────────────────────────────────── */}
        <View style={styles.divider} />

        {/* ── Baby size ────────────────────────────────────────── */}
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

        {/* ── Overview ─────────────────────────────────────────── */}
        <Text style={styles.overview} numberOfLines={3}>
          {content.overview}
        </Text>

        {/* ── Daily tip ────────────────────────────────────────── */}
        {dailyTip ? (
          <View style={styles.tipBox}>
            <Ionicons name="sparkles" size={14} color={colors.rose[400]} />
            <Text style={styles.tipText} numberOfLines={2}>
              {dailyTip}
            </Text>
          </View>
        ) : null}

        {/* ── Footer CTA ───────────────────────────────────────── */}
        <View style={styles.footer}>
          {opening ? (
            <>
              <ActivityIndicator
                size="small"
                color={colors.rose[400]}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.footerCta}>
                Opening your weekly chat…
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.footerCta}>
                Chat with MamaCare about week {current_week}
              </Text>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={14}
                color={colors.rose[400]}
              />
            </>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function WeeklyContentCard() {
  const router = useRouter();
  const { data, isLoading } = useCurrentWeekContent();

  const dailyTip = useMemo(
    () => (data?.content?.tips ? getDailyTip(data.content.tips) : ""),
    [data?.content?.tips]
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator color={colors.rose[300]} size="small" />
        <Text style={styles.loadingText}>Loading your weekly update…</Text>
      </View>
    );
  }

  // ── No week set ────────────────────────────────────────────────────────────
  if (!data?.available || !data.content) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/onboarding/profile-setup")}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={["#FFF5F7", "#FFFBF7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.noWeekIconWrap}>
            <Ionicons
              name="calendar-outline"
              size={28}
              color={colors.rose[300]}
            />
          </View>
          <Text style={styles.noWeekTitle}>
            What week are you on, mama?
          </Text>
          <Text style={styles.noWeekSubtitle}>
            Add your due date and we'll bring your week-by-week journey
            to life — just for you.
          </Text>
          <View style={styles.noWeekCta}>
            <Text style={styles.noWeekCtaText}>Set my due date</Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={colors.rose[400]}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // ── Content ────────────────────────────────────────────────────────────────
  return <WeeklyContentCardInner data={data} dailyTip={dailyTip} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: colors.rose[100],
    ...Platform.select({
      ios: {
        shadowColor: colors.rose[300],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  gradient: {
    padding: 20,
  },

  // Loading
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

  // No week set
  noWeekIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.rose[50],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    alignSelf: "center",
  },
  noWeekTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.navy[700],
    textAlign: "center",
    marginBottom: 8,
  },
  noWeekSubtitle: {
    fontSize: 14,
    color: colors.navy[400],
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 16,
  },
  noWeekCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  noWeekCtaText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.rose[400],
  },

  // Content
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  weekBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.rose[500],
    justifyContent: "center",
    alignItems: "center",
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
  weekBadgeNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    lineHeight: 22,
  },
  weekBadgeLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  topRight: {
    flex: 1,
    gap: 3,
  },
  trimesterLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.rose[400],
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.navy[700],
  },
  heartAccent: {
    alignSelf: "flex-start",
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: colors.rose[100],
    marginBottom: 14,
  },

  babySizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  babySizeEmoji: { fontSize: 18 },
  babySizeText: {
    fontSize: 13,
    color: colors.navy[400],
    flex: 1,
    lineHeight: 19,
  },
  babySizeHighlight: {
    color: colors.rose[400],
    fontWeight: "700",
  },

  overview: {
    fontSize: 14,
    color: colors.navy[500],
    lineHeight: 22,
    marginBottom: 14,
  },

  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(232,105,124,0.07)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.rose[300],
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.navy[600],
    lineHeight: 20,
    fontStyle: "italic",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 2,
  },
  footerCta: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.rose[400],
  },
});