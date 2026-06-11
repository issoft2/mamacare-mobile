/**
 * mobile/app/chat/[id].tsx
 * Emotionally Tuned Maternal Messaging Screen
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useChatSession, useSendMessage } from "@safeborn/api";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

function normalizeAssistantBranding(text: string): string {
  return text.replace(/MamaCare Assistant/gi, "safeborn Assistant");
}

/**
 * Parses user prompt initialization safely to render a cozy conversation title card
 */
function getWeeklyStarterDisplayText(content: string): string | null {
  if (!content.includes("Hi SafeBorn!") && !content.includes("safeborn Agent")) {
    return null;
  }

  const weekMatch = content.match(/week\s+(\d+)/i);
  const week = weekMatch?.[1];
  
  if (!week) {
    return "Hi safeborn, can you tell me what to expect this week? ✨";
  }
  return `✨ Exploring Week ${week} Together`;
}

function getRenderedMessageText(role: string, content: string): string {
  if (role === "assistant") {
    return normalizeAssistantBranding(content);
  }

  if (role === "user") {
    const weeklyStarterText = getWeeklyStarterDisplayText(content);
    if (weeklyStarterText) {
      return weeklyStarterText;
    }
  }

  return content;
}

function isUsageLimitMessage(content: string): boolean {
  return /usage limit|limit reached|quota|upgrade/i.test(content);
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={styles.messageRow}>
      <View style={styles.assistantAvatar}>
        <Text style={styles.avatarEmoji}>🌸</Text>
      </View>
      <View style={[styles.bubble, styles.assistantBubble, styles.typingBubble]}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.dot, dotStyle(dot1)]} />
          <Animated.View style={[styles.dot, dotStyle(dot2)]} />
          <Animated.View style={[styles.dot, dotStyle(dot3)]} />
        </View>
        <Text style={styles.typingLabel}>safeborn is crafting your response... 💕</Text>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { data, isLoading, refetch } = useChatSession(id);
  const sendMessage = useSendMessage(id);
  
  const [input, setInput] = useState("");
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  
  const listRef = useRef<FlatList>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const supportAnim = useRef(new Animated.Value(0)).current;

  const messages = data?.messages ?? [];
  const hasUsageLimitNotice = messages.some(
    (msg) => msg.role === "assistant" && isUsageLimitMessage(msg.content)
  );
  const showSupportOptions = hasUsageLimitNotice && !isWaitingForAI;

  const supportOptionsAnimStyle = {
    opacity: supportAnim,
    transform: [
      {
        translateY: supportAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  // ── Polling logic ─────────────────────────────────────────────────────────
  useEffect(() => {
    function stopPolling() {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setIsWaitingForAI(false);
    }

    async function poll() {
      const result = await refetch();
      const msgs = result.data?.messages ?? [];
      const lastMsg = msgs[msgs.length - 1];
      if (msgs.length > 0 && lastMsg?.role === "assistant") {
        stopPolling();
      }
    }

    const lastMsg = messages[messages.length - 1];
    const needsPolling = messages.length === 0 || lastMsg?.role === "user";

    if (needsPolling) {
      setIsWaitingForAI(true);
      poll();
      pollingRef.current = setInterval(poll, 2000);
    }

    return () => stopPolling();
  }, [id, messages.length, refetch]);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [messages.length]);

  useEffect(() => {
    const timeout = setTimeout(() => inputRef.current?.focus(), 450);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (showSupportOptions) {
      supportAnim.setValue(0);
      Animated.timing(supportAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }).start();
    } else {
      supportAnim.setValue(0);
    }
  }, [showSupportOptions, supportAnim]);

  // ── Send message ───────────────────────────────────────────────────────────
  async function handleSend() {
    const content = input.trim();
    if (!content || sendMessage.isPending) return;
    setInput("");
    setIsWaitingForAI(true);
    try {
      await sendMessage.mutateAsync({ content });
      await refetch();
    } catch {
      setInput(content);
    } finally {
      setIsWaitingForAI(false);
    }
  }

  // ── Render message ─────────────────────────────────────────────────────────
  function renderMessage({ item }: { item: any }) {
    const isUser = item.role === "user";
    const renderedMessage = getRenderedMessageText(item.role, item.content);
    
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <Text style={styles.avatarEmoji}>🌸</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
            {renderedMessage}
          </Text>
        </View>
      </View>
    );
  }

  function renderSupportOptions() {
    if (!showSupportOptions) return null;

    return (
      <Animated.View style={[styles.supportOptionsWrap, supportOptionsAnimStyle]}>
        <Text style={styles.supportOptionsTitle}>Need immediate support while chat is paused?</Text>
        <View style={styles.supportChipRow}>
          <TouchableOpacity
            style={styles.supportChip}
            activeOpacity={0.86}
            onPress={() => router.push("/tabs/home")}
          >
            <Ionicons name="book-outline" size={14} color={AUTH_UI.linkBerry} />
            <Text style={styles.supportChipText}>Read Weekly Article</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportChip}
            activeOpacity={0.86}
            onPress={() => router.push("/profile/care-team")}
          >
            <Ionicons name="call-outline" size={14} color={AUTH_UI.linkBerry} />
            <Text style={styles.supportChipText}>Call My Midwife</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportChip}
            activeOpacity={0.86}
            onPress={() => router.push("/tabs/tracker")}
          >
            <Ionicons name="fitness-outline" size={14} color={AUTH_UI.linkBerry} />
            <Text style={styles.supportChipText}>Safe Exercises</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AUTH_UI.linkBerry} />
        <Text style={styles.loadingText}>Preparing your quiet space…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]}
        style={styles.bgOverlay}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <View style={styles.chatHeader}>
            <TouchableOpacity
              onPress={() => router.replace("/tabs/chat")}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={28} color={AUTH_UI.textHeading} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>safeborn Assistant</Text>
              <Text style={styles.headerStatus}>
                {isWaitingForAI ? "Gathering gentle thoughts…" : "Holding space for you, mama ✨"}
              </Text>
            </View>
          </View>

          {/* ── Message list ────────────────────────────────────── */}
          <View style={styles.messageListContainer}>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              style={styles.messageScroller}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
              ListEmptyComponent={
                isWaitingForAI ? null : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.welcomeEmoji}>✨🤰✨</Text>
                    <Text style={styles.welcomeTitle}>Your quiet sanctuary</Text>
                    <Text style={styles.welcomeSubtitle}>
                      Whether you have questions about changes in your body, your baby, or just want a validating voice—I'm here for you. What's on your heart?
                    </Text>
                  </View>
                )
              }
              ListFooterComponent={
                <>
                  {isWaitingForAI ? <TypingIndicator /> : null}
                  {renderSupportOptions()}
                </>
              }
            />
          </View>

          {/* ── Input bar ───────────────────────────────────────── */}
          <View style={styles.inputContainer}>
            <View style={styles.composer}>
              <Pressable
                style={styles.inputSurface}
                onPress={() => inputRef.current?.focus()}
              >
                <TextInput
                  ref={inputRef}
                  style={styles.textInput}
                  placeholder="Type a message or question..."
                  placeholderTextColor={AUTH_UI.textWarmMuted}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  blurOnSubmit={false}
                  autoFocus
                  textAlignVertical="top"
                  returnKeyType="default"
                />

                <View style={styles.composerActions}>
                  <TouchableOpacity
                    style={[
                      styles.sendBtn,
                      (!input.trim() || sendMessage.isPending) && styles.sendDisabled,
                    ]}
                    onPress={handleSend}
                    disabled={!input.trim() || sendMessage.isPending}
                  >
                    <LinearGradient
                      colors={
                        input.trim() && !sendMessage.isPending
                          ? [AUTH_UI.linkBerry, AUTH_UI.shadowRose]
                          : [AUTH_UI.semanticNeutralSoft, AUTH_UI.semanticNeutral]
                      }
                      style={styles.sendGradient}
                    >
                      {sendMessage.isPending ? (
                        <ActivityIndicator size="small" color={AUTH_UI.textWhite} />
                      ) : (
                        <Ionicons
                          name="send"
                          size={18}
                          color={AUTH_UI.textWhite}
                        />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: AUTH_UI.warmBackground },
  bgOverlay: { flex: 1 },
  flex:      { flex: 1 },
  center: {
    flex: 1, justifyContent: "center", alignItems: "center", gap: 12, backgroundColor: AUTH_UI.warmBackground,
  },
  loadingText: { fontSize: 16, color: AUTH_UI.textWarm, fontFamily: FONT_FRIENDLY_SANS },

  chatHeader: {
    paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20,
    flexDirection: "row", alignItems: "center",
    backgroundColor: AUTH_UI.overlaySoft,
    borderBottomWidth: 1, borderBottomColor: AUTH_UI.lineSoftWarm,
  },
  backBtn:      { marginRight: 15 },
  headerTitle:  { fontSize: 24, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF },
  headerStatus: { fontSize: 13, color: AUTH_UI.textWarm, fontWeight: "600", fontFamily: FONT_FRIENDLY_SANS },

  messageListContainer: { flex: 1 },
  messageScroller: { flex: 1 },
  messageList: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30 },
  messageRow:   { flexDirection: "row", marginBottom: 18, alignItems: "flex-end" },
  userRow:      { justifyContent: "flex-end" },
  assistantRow: { justifyContent: "flex-start", alignItems: "flex-start" },

  assistantAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: AUTH_UI.avatarRoseBg,
    alignItems: "center", justifyContent: "center", marginRight: 12,
    alignSelf: "flex-start",
    elevation: 2, shadowColor: AUTH_UI.shadowRose, shadowOpacity: 0.15, shadowRadius: 4,
  },
  avatarEmoji: { fontSize: 18 },

  bubble: {
    maxWidth: "82%", paddingHorizontal: 16, paddingVertical: 13, borderRadius: AUTH_UI.cardRadius,
    elevation: 1, shadowColor: AUTH_UI.shadowRose, shadowOpacity: 0.08, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  userBubble: {
    backgroundColor: AUTH_UI.linkBerry,
    shadowColor: AUTH_UI.linkBerry,
    shadowOpacity: 0.18,
    marginRight: 4,
  },
  assistantBubble: {
    backgroundColor: AUTH_UI.overlayCard,
    borderWidth: 1,
    borderColor: AUTH_UI.mutedBorder,
    marginLeft: 4,
  },
  typingBubble: { paddingVertical: 14, paddingHorizontal: 18 },

  bubbleText:    { fontSize: 15, lineHeight: 22, fontFamily: FONT_FRIENDLY_SANS },
  userText:      { color: AUTH_UI.textWhite, fontWeight: "500" },
  assistantText: { color: AUTH_UI.textWarmStrong },

  typingDots: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: AUTH_UI.shadowRose },
  typingLabel: { fontSize: 12, color: AUTH_UI.textWarm, marginTop: 6, fontFamily: FONT_FRIENDLY_SANS, fontStyle: "italic" },

  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80, paddingHorizontal: 28, gap: 10 },
  supportOptionsWrap: { marginTop: 20, marginBottom: 4, paddingHorizontal: 6, gap: 10 },
  supportOptionsTitle: { fontSize: 14, fontWeight: "700", color: AUTH_UI.textWarm, fontFamily: FONT_FRIENDLY_SANS },
  supportChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  supportChip: {
    flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: AUTH_UI.overlayCard,
    borderRadius: 999, borderWidth: 1, borderColor: AUTH_UI.mutedBorder20,
    paddingHorizontal: 14, paddingVertical: 10,
    elevation: 1, shadowColor: AUTH_UI.shadowRose, shadowOpacity: 0.04, shadowRadius: 2,
  },
  supportChipText: { fontSize: 12, fontWeight: "700", color: AUTH_UI.linkBerry, fontFamily: FONT_FRIENDLY_SANS },
  welcomeEmoji:    { fontSize: 44, marginBottom: 6 },
  welcomeTitle:    { color: AUTH_UI.textHeading, fontSize: 20, fontWeight: "700", textAlign: "center", fontFamily: FONT_WARM_SERIF },
  welcomeSubtitle: { color: AUTH_UI.textWarm, fontSize: 14, textAlign: "center", lineHeight: 22, fontFamily: FONT_FRIENDLY_SANS },

  inputContainer: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 28 : 20,
    backgroundColor: AUTH_UI.roseSoftBg, borderTopWidth: 1, borderTopColor: AUTH_UI.lineSoftWarm,
  },
  composer: { width: "100%" },
  inputSurface: {
    width: "100%", minHeight: 54, maxHeight: 124, borderRadius: AUTH_UI.cardRadius,
    backgroundColor: AUTH_UI.overlayElevated, borderWidth: 1, borderColor: AUTH_UI.mutedBorder18,
    paddingLeft: 18, paddingRight: 8, paddingVertical: 6, flexDirection: "row", alignItems: "flex-end",
    shadowColor: AUTH_UI.textHeading, shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  textInput: {
    flex: 1, minWidth: 0, minHeight: 38, maxHeight: 92, color: AUTH_UI.textBlack,
    fontSize: 16, lineHeight: 22, paddingTop: 8, paddingBottom: 9, paddingHorizontal: 0, marginRight: 8,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  composerActions: { flexDirection: "row", alignItems: "center", gap: 6, paddingBottom: 1 },
  sendBtn:      { borderRadius: 20, overflow: "hidden" },
  sendGradient: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  sendDisabled: { opacity: 0.35 },
});