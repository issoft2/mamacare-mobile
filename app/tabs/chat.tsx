/**
 * mobile/app/(tabs)/chat.tsx
 * Refined Chat Sessions - High Depth List
 */

import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import {
  useChatSessions,
  useCreateChatSession,
  useActivePregnancy
} from "@safeborn/api";
import { colors, shadows } from "@safeborn/ui";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";
import { resolveCurrentGestationalWeek } from "@/lib/gestationalWeek";

export default function ChatScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 980;
  const { data: sessions } = useChatSessions();
  const { data: pregnancy} = useActivePregnancy();
  const createSession = useCreateChatSession();

  // ✅ Inside the component — hooks must always live here
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();

  // If arriving from WeeklyContentCard, auto-create a session
  // and navigate into it with the prompt pre-filled
  useEffect(() => {
    if (!prompt) return;

    async function openWithPrompt() {
      const week = resolveCurrentGestationalWeek(pregnancy) ?? 1;
      const session = await createSession.mutateAsync({
        gestational_week: week,
      });
      router.push({
        pathname: `/chat/${session.id}` as any,
        params: { prompt },
      });
    }

    void openWithPrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // runs once on mount

  function getSessionTitle(item: any): string {
    const rawTitle = (item.title ?? "").trim();
    const hasCustomTitle = rawTitle.length > 0 && !/^new conversation$/i.test(rawTitle);
    if (hasCustomTitle) {
      return rawTitle;
    }

    const week = item.gestational_week ?? "-";
    if ((item.message_count ?? 0) <= 2) {
      return `Week ${week} overview request`;
    }
    return `Week ${week} follow-up chat`;
  }

  function renderSession({ item }: { item: any }) {
    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle} numberOfLines={1}>
            {getSessionTitle(item)}
          </Text>
          <Text style={styles.sessionMeta}>
            Week {item.gestational_week} • {item.message_count} messages
          </Text>
        </View>
        <View style={styles.arrowCircle}>
          <Ionicons name="chevron-forward" size={18} color={AUTH_UI.linkBerry} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]}
        style={styles.bgOverlay}
      >
        <View style={[styles.page, isWide && styles.pageWide]}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Conversations with safeborn Assistant</Text>
        </View>

        <FlatList
          data={sessions ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderSession}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                No conversations yet. Open your weekly pregnancy note from Home
                to begin a guided chat.
              </Text>
              <TouchableOpacity
                style={styles.homeCta}
                onPress={() => router.push("/tabs/home")}
                activeOpacity={0.84}
              >
                <Text style={styles.homeCtaText}>Go to weekly note</Text>
                <Ionicons name="chevron-forward" size={16} color={AUTH_UI.linkBerry} />
              </TouchableOpacity>
            </View>
          }
        />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_UI.warmBackground },
  bgOverlay: { flex: 1 },
  page: { flex: 1 },
  pageWide: { width: "100%", maxWidth: 1100, alignSelf: "center", paddingHorizontal: 12 },
  header: { paddingTop: 70, paddingHorizontal: 20 },
  screenTitle: { fontSize: 30, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.5 },
  list: { padding: 20, paddingBottom: 32 },
  sessionCard: {
    backgroundColor: AUTH_UI.overlayCard82,
    borderRadius: AUTH_UI.cardRadius,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    elevation: 3,
    shadowOpacity: 0.05,
  },
  sessionInfo: { flex: 1 },
  sessionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: AUTH_UI.textHeading,
    marginBottom: 4,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  sessionMeta: { fontSize: 13, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  arrowCircle: {
    width: 32,
    height: 32,
    minWidth: 32,
    minHeight: 32,
    maxWidth: 32,
    maxHeight: 32,
    borderRadius: 999,
    aspectRatio: 1,
    backgroundColor: AUTH_UI.semanticSevereBg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emptyWrap: { marginTop: 60, alignItems: "center", gap: 14 },
  emptyText: {
    color: AUTH_UI.textBlack,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 360,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  homeCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: AUTH_UI.semanticSevereBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  homeCtaText: { color: AUTH_UI.linkBerry, fontSize: 14, fontWeight: "800", fontFamily: FONT_FRIENDLY_SANS },
});
