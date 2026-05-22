/**
 * mobile/app/chat/[id].tsx
 * Refined Messaging UI - Full Keyboard Fix & High Depth
 *
 * Key fix: polls every 2 seconds until the AI response arrives.
 * This handles the WeeklyContentCard flow where the opening message
 * is sent before navigation and the AI may not have responded yet
 * when the screen first mounts.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useChatSession, useSendMessage } from "@mumcare/api";
import { colors } from "@mumcare/ui";

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
  }, []);

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
        <Text style={styles.typingLabel}>MumCare is thinking…</Text>
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

  const messages = data?.messages ?? [];

  // ── Polling logic ─────────────────────────────────────────────────────────
  // When the screen mounts, check if the last message is from the user.
  // If so, the AI hasn't responded yet — start polling every 2 seconds
  // until the assistant message arrives, then stop.
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
      // Poll immediately then every 2 seconds
      poll();
      pollingRef.current = setInterval(poll, 2000);
    }

    return () => stopPolling();
    // Only run on mount — messages dependency intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [messages.length]);

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
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <Text style={styles.avatarEmoji}>🌸</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E8697C" />
        <Text style={styles.loadingText}>Opening your chat…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["rgba(255,255,255,0.7)", "rgba(255,245,245,0.4)"]}
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
              <Ionicons name="chevron-back" size={28} color="#1A237E" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>MumCare AI</Text>
              <Text style={styles.headerStatus}>
                {isWaitingForAI ? "Thinking…" : "Always here for you"}
              </Text>
            </View>
          </View>

          {/* ── Message list ────────────────────────────────────── */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            ListEmptyComponent={
              isWaitingForAI ? null : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.welcomeEmoji}>🌸</Text>
                  <Text style={styles.welcomeTitle}>MumCare is here with you</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Ask me anything about your pregnancy journey.
                  </Text>
                </View>
              )
            }
            ListFooterComponent={isWaitingForAI ? <TypingIndicator /> : null}
          />

          {/* ── Input bar ───────────────────────────────────────── */}
          <View style={styles.inputContainer}>
            <View style={styles.inputGlass}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask me anything…"
                placeholderTextColor="#9E9E9E"
                value={input}
                onChangeText={setInput}
                multiline
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!input.trim() || sendMessage.isPending) && styles.sendDisabled,
                ]}
                onPress={handleSend}
                disabled={!input.trim() || sendMessage.isPending}
              >
                <LinearGradient
                  colors={["#E8697C", "#FFA07A"]}
                  style={styles.sendGradient}
                >
                  {sendMessage.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="send" size={18} color="#FFF" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: "#FFF" },
  bgOverlay: { flex: 1 },
  flex:      { flex: 1 },
  center: {
    flex: 1, justifyContent: "center", alignItems: "center", gap: 12,
  },
  loadingText: { fontSize: 15, color: colors.navy[300], fontStyle: "italic" },

  chatHeader: {
    paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20,
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backBtn:      { marginRight: 15 },
  headerTitle:  { fontSize: 18, fontWeight: "800", color: "#1A237E" },
  headerStatus: { fontSize: 12, color: "#88B0A8", fontWeight: "600" },

  messageList: { padding: 20, paddingBottom: 30 },
  messageRow:   { flexDirection: "row", marginBottom: 15, alignItems: "flex-end" },
  userRow:      { justifyContent: "flex-end" },
  assistantRow: { justifyContent: "flex-start" },

  assistantAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#FFF",
    alignItems: "center", justifyContent: "center", marginRight: 8,
    elevation: 3, shadowOpacity: 0.1, shadowRadius: 5,
  },
  avatarEmoji: { fontSize: 16 },

  bubble: {
    maxWidth: "80%", padding: 15, borderRadius: 22,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5,
  },
  userBubble: {
    backgroundColor: "#E8697C", borderBottomRightRadius: 4,
    shadowColor: "#E8697C", shadowOpacity: 0.25,
  },
  assistantBubble: { backgroundColor: "#FFF", borderBottomLeftRadius: 4 },
  typingBubble:    { paddingVertical: 12, paddingHorizontal: 16 },

  bubbleText:    { fontSize: 15, lineHeight: 22 },
  userText:      { color: "#FFF", fontWeight: "500" },
  assistantText: { color: "#424242" },

  typingDots: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.rose[300],
  },
  typingLabel: {
    fontSize: 11, color: colors.navy[300],
    fontStyle: "italic", marginTop: 4,
  },

  emptyContainer: {
    flex: 1, alignItems: "center", justifyContent: "center",
    marginTop: 100, paddingHorizontal: 32, gap: 8,
  },
  welcomeEmoji:    { fontSize: 40, marginBottom: 4 },
  welcomeTitle:    { color: colors.navy[600], fontSize: 18, fontWeight: "700", textAlign: "center" },
  welcomeSubtitle: { color: "#9E9E9E", fontSize: 14, textAlign: "center", lineHeight: 21 },

  inputContainer: {
    paddingHorizontal: 20, paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    backgroundColor: "transparent",
  },
  inputGlass: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 30, paddingHorizontal: 15, paddingVertical: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.5)",
    elevation: 10, shadowColor: "#000", shadowOpacity: 0.1,
    shadowRadius: 15, shadowOffset: { width: 0, height: -2 },
  },
  textInput: {
    flex: 1, color: "#1A237E", fontSize: 16, maxHeight: 100, paddingVertical: 10,
  },
  sendBtn:      { borderRadius: 20, overflow: "hidden", marginLeft: 10 },
  sendGradient: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  sendDisabled: { opacity: 0.4 },
});