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
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ApiRequestError, useChatSession, useSendMessage } from "@safeborn/api";
import { colors } from "@safeborn/ui";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";


const WEEKLY_PROMPT_MARKER = "Here's what I know about this week:";

function normalizeAssistantBranding(text: string): string {
  return text.replace(/MamaCare Assistant/gi, "safeborn  Assistant");
}

function getWeeklyStarterDisplayText(content: string): string | null {
  if (!content.includes(WEEKLY_PROMPT_MARKER)) {
    return null;
  }

  const weekMatch = content.match(/week\s+(\d+)/i);
  const week = weekMatch?.[1];
  if (!week) {
    return "Hi safeborn, can you tell me what to expect this week?";
  }
  return `Hi safeborn, can you tell me what to expect in week ${week}?`;
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
        <Text style={styles.typingLabel}>safeborn is thinking…</Text>
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
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState("");
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const supportAnim = useRef(new Animated.Value(0)).current;
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

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
      return;
    }

    supportAnim.setValue(0);
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
    const isSpeaking = speakingMessageId === item.id;
    const renderedMessage = getRenderedMessageText(item.role, item.content);
    const canUseReadAloud = Platform.OS === "web";
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
    if (!showSupportOptions) {
      return null;
    }

    return (
      <Animated.View style={[styles.supportOptionsWrap, supportOptionsAnimStyle]}>
        <Text style={styles.supportOptionsTitle}>Need support while chat is paused?</Text>
        <View style={styles.supportChipRow}>
          <TouchableOpacity
            style={styles.supportChip}
            activeOpacity={0.86}
            onPress={() => router.push("/tabs/home")}
          >
            <Ionicons name="book-outline" size={14} color={AUTH_UI.linkBerry} />
            <Text style={styles.supportChipText}>View Week Article</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportChip}
            activeOpacity={0.86}
            onPress={() => router.push("/profile/care-team")}
          >
            <Ionicons name="call-outline" size={14} color={AUTH_UI.linkBerry} />
            <Text style={styles.supportChipText}>Contact My Midwife</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportChip}
            activeOpacity={0.86}
            onPress={() => router.push("/tabs/tracker")}
          >
            <Ionicons name="fitness-outline" size={14} color={AUTH_UI.linkBerry} />
            <Text style={styles.supportChipText}>Browse Safe Exercises</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.rose[500]} />
        <Text style={styles.loadingText}>Opening your chat…</Text>
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
                {isWaitingForAI ? "Thinking…" : "Always here for you"}
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
                    <Text style={styles.welcomeEmoji}>🌸</Text>
                    <Text style={styles.welcomeTitle}>safeborn is here with you</Text>
                    <Text style={styles.welcomeSubtitle}>
                      Ask me anything about your pregnancy journey.
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
            {voiceNotice ? (
              <View style={styles.voiceNotice}>
                <Ionicons
                name={isListening ? "mic" : isTranscribing ? "sync" : "information-circle-outline"}
                size={15}
                  color={isListening || isTranscribing ? colors.rose[500] : AUTH_UI.textBlack}
              />
              <Text style={styles.voiceNoticeText}>{voiceNotice}</Text>
              </View>
            ) : null}
            <View style={styles.composer}>
              <Pressable
                style={styles.inputSurface}
                onPress={() => inputRef.current?.focus()}
              >
                <TextInput
                  ref={inputRef}
                  style={styles.textInput}
                  placeholder={isListening ? "Listening..." : "Message safeborn"}
                  placeholderTextColor={AUTH_UI.textBlack}
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
                          color={input.trim() ? AUTH_UI.textWhite : AUTH_UI.mutedText}
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
    flex: 1, justifyContent: "center", alignItems: "center", gap: 12,
  },
  loadingText: { fontSize: 15, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },

  chatHeader: {
    paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20,
    flexDirection: "row", alignItems: "center",
    backgroundColor: AUTH_UI.overlaySoft,
    borderBottomWidth: 1, borderBottomColor: AUTH_UI.lineFaint,
  },
  backBtn:      { marginRight: 15 },
  headerTitle:  { fontSize: 26, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF },
  headerStatus: { fontSize: 12, color: AUTH_UI.textBlack, fontWeight: "600", fontFamily: FONT_FRIENDLY_SANS },

  messageListContainer: {
    flex: 1,
    overflow: "hidden",
  },
  messageScroller: {
    flex: 1,
  },
  messageList: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30 },
  messageRow:   { flexDirection: "row", marginBottom: 15, alignItems: "flex-end" },
  userRow:      { justifyContent: "flex-end" },
  assistantRow: { justifyContent: "flex-start", alignItems: "flex-start" },

  assistantAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: AUTH_UI.textWhite,
    alignItems: "center", justifyContent: "center", marginRight: 16,
    marginTop: 1,
    alignSelf: "flex-start",
    elevation: 3, shadowOpacity: 0.1, shadowRadius: 5,
  },
  avatarEmoji: { fontSize: 16 },

  bubble: {
    maxWidth: "80%", padding: 15, borderRadius: 22,
    elevation: 2, shadowColor: AUTH_UI.textBlack, shadowOpacity: 0.05, shadowRadius: 5,
  },
  userBubble: {
    backgroundColor: colors.rose[500], borderBottomRightRadius: 4,
    shadowColor: colors.rose[500], shadowOpacity: 0.25,
    marginRight: 8,
  },
  assistantBubble: {
    backgroundColor: AUTH_UI.textWhite,
    borderBottomLeftRadius: 4,
    marginLeft: 8,
  },
  typingBubble:    { paddingVertical: 12, paddingHorizontal: 16 },

  bubbleText:    { fontSize: 15, lineHeight: 22, fontFamily: FONT_FRIENDLY_SANS },
  userText:      { color: AUTH_UI.textWhite, fontWeight: "500", fontFamily: FONT_FRIENDLY_SANS },
  assistantText: { color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  readAloudBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    minHeight: 32,
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.rose[50],
  },
  readAloudBtnActive: {
    backgroundColor: colors.rose[500],
  },
  readAloudText: {
    color: AUTH_UI.linkBerry,
    fontSize: 12,
    fontWeight: "800",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  readAloudTextActive: {
    color: AUTH_UI.textWhite,
  },

  typingDots: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.rose[300],
  },
  typingLabel: {
    fontSize: 11, color: AUTH_UI.textBlack,
    marginTop: 4,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  emptyContainer: {
    flex: 1, alignItems: "center", justifyContent: "center",
    marginTop: 100, paddingHorizontal: 32, gap: 8,
  },
  supportOptionsWrap: {
    marginTop: 20,
    marginBottom: 4,
    paddingHorizontal: 6,
    gap: 10,
  },
  supportOptionsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: AUTH_UI.textWarm,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  supportChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  supportChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AUTH_UI.semanticSevereBorder20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  supportChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: AUTH_UI.linkBerry,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  welcomeEmoji:    { fontSize: 40, marginBottom: 4 },
  welcomeTitle:    { color: AUTH_UI.textHeading, fontSize: 18, fontWeight: "700", textAlign: "center", fontFamily: FONT_WARM_SERIF },
  welcomeSubtitle: { color: AUTH_UI.textBlack, fontSize: 14, textAlign: "center", lineHeight: 21, fontFamily: FONT_FRIENDLY_SANS },

  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 26 : 18,
    backgroundColor: AUTH_UI.roseSoftBg,
    borderTopWidth: 1,
    borderTopColor: AUTH_UI.lineSoft,
  },
  voiceNotice: {
    alignSelf: "center",
    maxWidth: "92%",
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: AUTH_UI.overlayCard,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  voiceNoticeText: {
    flex: 1,
    color: AUTH_UI.textBlack,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  composer: {
    width: "100%",
  },
  inputSurface: {
    width: "100%",
    minHeight: 54,
    maxHeight: 124,
    borderRadius: 27,
    backgroundColor: AUTH_UI.overlayElevated,
    borderWidth: 1,
    borderColor: AUTH_UI.mutedBorder,
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "flex-end",
    shadowColor: AUTH_UI.textHeading,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 38,
    maxHeight: 92,
    color: AUTH_UI.textBlack,
    fontSize: 16,
    lineHeight: 22,
    paddingTop: 8,
    paddingBottom: 9,
    paddingHorizontal: 0,
    marginRight: 8,
  },
  composerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 1,
  },
  voiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.rose[50],
  },
  voiceBtnActive: {
    backgroundColor: colors.rose[500],
  },
  voiceBtnDisabled: {
    opacity: 0.45,
  },
  sendBtn:      { borderRadius: 20, overflow: "hidden" },
  sendGradient: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  sendDisabled: { opacity: 0.4 },
});
