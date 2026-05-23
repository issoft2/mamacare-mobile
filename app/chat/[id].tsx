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
import {
  ApiRequestError,
  useChatSession,
  useSendMessage,
  useTextToSpeech,
  useTranscribeVoice,
} from "@mumcare/api";
import { colors } from "@mumcare/ui";

type SpeechRecognitionResult = {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
};

type SpeechRecognitionEvent = Event & {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    readonly [index: number]: SpeechRecognitionResult;
  };
};

type SpeechRecognitionInstance = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function getPreferredVoice() {
  if (
    Platform.OS !== "web" ||
    typeof window === "undefined" ||
    !window.speechSynthesis
  ) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => /female|samantha|serena|ava|victoria/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
    null
  );
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
  const transcribeVoice = useTranscribeVoice();
  const textToSpeech = useTextToSpeech();
  const [input, setInput] = useState("");
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState("");
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const voiceBaseInputRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const messages = data?.messages ?? [];
  const recorderSupported =
    Platform.OS === "web" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined";
  const speechRecognitionSupported = getSpeechRecognitionConstructor() != null;
  const browserSpeechSynthesisSupported =
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    "speechSynthesis" in window;

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
    return () => {
      recognitionRef.current?.abort();
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
      audioPlayerRef.current?.pause();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => inputRef.current?.focus(), 450);
    return () => clearTimeout(timeout);
  }, []);

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

  async function toggleVoiceInput() {
    setVoiceNotice("");

    if (isListening) {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
        return;
      }
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (recorderSupported) {
      await startRecordedVoiceInput();
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setVoiceNotice("Voice recording is not available in this browser.");
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    voiceBaseInputRef.current = input.trim();

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceNotice("Listening. Speak gently, then pause when you are done.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setVoiceNotice("I could not hear clearly. Please try again or type your message.");
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      const base = voiceBaseInputRef.current;
      const next = transcript.trim();
      setInput(base && next ? `${base} ${next}` : base || next);
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceNotice("Voice input could not start. Please try again.");
    }
  }

  async function startRecordedVoiceInput() {
    if (Platform.OS !== "web" || typeof navigator === "undefined") {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsListening(false);
        stream.getTracks().forEach((track) => track.stop());
        const audio = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        if (audio.size === 0) {
          setVoiceNotice("I could not capture your voice. Please try again.");
          return;
        }

        setIsTranscribing(true);
        setVoiceNotice("Turning your voice into text...");
        try {
          const result = await transcribeVoice.mutateAsync({
            audio,
            filename: recorder.mimeType?.includes("mp4")
              ? "mumcare-voice.mp4"
              : "mumcare-voice.webm",
          });
          const text = result.text.trim();
          if (!text) {
            setVoiceNotice("I could not hear words clearly. Please try again.");
            return;
          }
          setInput((current) => {
            const base = current.trim();
            return base ? `${base} ${text}` : text;
          });
          setVoiceNotice("Voice added to your message.");
        } catch (err) {
          if (err instanceof ApiRequestError && err.isNotFound) {
            setVoiceNotice("Voice service is not connected on the server yet.");
          } else {
            setVoiceNotice("I could not transcribe that audio. Please try again.");
          }
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      setIsListening(true);
      setVoiceNotice("Recording. Tap the mic again when you are done.");
    } catch {
      setIsListening(false);
      setVoiceNotice("Microphone permission was not allowed.");
    }
  }

  async function toggleReadAloud(messageId: string, content: string) {
    setVoiceNotice("");

    if (speakingMessageId === messageId) {
      audioPlayerRef.current?.pause();
      audioPlayerRef.current = null;
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
      setSpeakingMessageId(null);
      return;
    }

    if (Platform.OS !== "web" || typeof window === "undefined") {
      setVoiceNotice("Read aloud is available in the web app.");
      return;
    }

    try {
      audioPlayerRef.current?.pause();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      setSpeakingMessageId(messageId);
      setVoiceNotice("Preparing a gentle voice...");
      const audio = await textToSpeech.mutateAsync({
        text: content,
        voice_style: "gentle_companion",
      });
      const url = URL.createObjectURL(audio);
      const player = new Audio(url);
      audioUrlRef.current = url;
      audioPlayerRef.current = player;
      player.onended = () => {
        setSpeakingMessageId(null);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };
      player.onerror = () => {
        setSpeakingMessageId(null);
        setVoiceNotice("I could not play that audio right now.");
      };
      await player.play();
      setVoiceNotice("");
      return;
    } catch (err) {
      if (err instanceof ApiRequestError && err.isNotFound) {
        setVoiceNotice("Voice read-aloud service is not connected on the server yet.");
      } else if (!browserSpeechSynthesisSupported) {
        setVoiceNotice("Read aloud is not available in this browser.");
        setSpeakingMessageId(null);
        return;
      }
    }

    if (!browserSpeechSynthesisSupported || typeof window === "undefined") {
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    const voice = getPreferredVoice();
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = 0.92;
    utterance.pitch = 1.04;
    utterance.volume = 1;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => {
      setSpeakingMessageId(null);
      setVoiceNotice("I could not read that aloud right now.");
    };

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  }

  // ── Render message ─────────────────────────────────────────────────────────
  function renderMessage({ item }: { item: any }) {
    const isUser = item.role === "user";
    const isSpeaking = speakingMessageId === item.id;
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
          {!isUser && (
            <TouchableOpacity
              style={[styles.readAloudBtn, isSpeaking && styles.readAloudBtnActive]}
              onPress={() => toggleReadAloud(item.id, item.content)}
              activeOpacity={0.82}
            >
              <Ionicons
                name={isSpeaking ? "stop-circle" : "volume-medium-outline"}
                size={16}
                color={isSpeaking ? "#FFFFFF" : "#E8697C"}
              />
              <Text
                style={[
                  styles.readAloudText,
                  isSpeaking && styles.readAloudTextActive,
                ]}
              >
                {isSpeaking ? "Stop" : "Listen"}
              </Text>
            </TouchableOpacity>
          )}
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
            {voiceNotice ? (
              <View style={styles.voiceNotice}>
                <Ionicons
                name={isListening ? "mic" : isTranscribing ? "sync" : "information-circle-outline"}
                size={15}
                color={isListening || isTranscribing ? "#E8697C" : "#7B8498"}
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
                  placeholder={isListening ? "Listening..." : "Message MumCare"}
                  placeholderTextColor="#98A2B3"
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
                    styles.voiceBtn,
                    isListening && styles.voiceBtnActive,
                    isTranscribing && styles.voiceBtnDisabled,
                    !recorderSupported && !speechRecognitionSupported && styles.voiceBtnDisabled,
                  ]}
                  onPress={toggleVoiceInput}
                  disabled={isTranscribing}
                  activeOpacity={0.82}
                >
                  {isTranscribing ? (
                    <ActivityIndicator size="small" color="#E8697C" />
                  ) : (
                    <Ionicons
                      name={isListening ? "stop" : "mic-outline"}
                      size={20}
                      color={isListening ? "#FFFFFF" : "#E8697C"}
                    />
                  )}
                </TouchableOpacity>

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
  readAloudBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    minHeight: 32,
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(232,105,124,0.1)",
  },
  readAloudBtnActive: {
    backgroundColor: "#E8697C",
  },
  readAloudText: {
    color: "#E8697C",
    fontSize: 12,
    fontWeight: "800",
  },
  readAloudTextActive: {
    color: "#FFFFFF",
  },

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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 26 : 18,
    backgroundColor: "rgba(255,248,250,0.72)",
    borderTopWidth: 1,
    borderTopColor: "rgba(154,162,180,0.14)",
  },
  voiceNotice: {
    alignSelf: "center",
    maxWidth: "92%",
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  voiceNoticeText: {
    flex: 1,
    color: "#7B8498",
    fontSize: 12,
    fontWeight: "600",
  },
  composer: {
    width: "100%",
  },
  inputSurface: {
    width: "100%",
    minHeight: 54,
    maxHeight: 124,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: "rgba(232,105,124,0.16)",
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "flex-end",
    shadowColor: "#1A2E4A",
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
    color: "#1A237E",
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
    backgroundColor: "rgba(232,105,124,0.1)",
  },
  voiceBtnActive: {
    backgroundColor: "#E8697C",
  },
  voiceBtnDisabled: {
    opacity: 0.45,
  },
  sendBtn:      { borderRadius: 20, overflow: "hidden" },
  sendGradient: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  sendDisabled: { opacity: 0.4 },
});
