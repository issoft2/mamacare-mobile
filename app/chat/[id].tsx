/**
 * mobile/app/chat/[id].tsx
 * Chat conversation screen with real-time messaging.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useChatSession, useSendMessage } from "@mamacare/api";
import { colors, spacing, typography, shadows } from "@mamacare/ui";
import type { ChatMessage } from "@mamacare/types";

import { getErrorMessage } from "@/lib/errors";

export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, refetch } = useChatSession(id);
  const sendMessage = useSendMessage(id);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);

  const messages = data?.messages ?? [];

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sendMessage.isPending) return;
    setInput("");
    try {
      await sendMessage.mutateAsync({ content });
      await refetch();
    } catch (err: unknown) {
      setInput(content);
      Alert.alert("Could not send", getErrorMessage(err, "Failed to send message."));
    }
  }

  function renderMessage({ item }: { item: ChatMessage }) {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>M</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
          {item.was_fallback_response && (
            <Text style={styles.fallbackNote}>⚠️ Automated safety response</Text>
          )}
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.rose[500]} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>Hi, I'm MamaCare AI</Text>
            <Text style={styles.emptySubtitle}>
              I'm here to support you through your pregnancy. Ask me anything about symptoms, nutrition, or how you're feeling.
            </Text>
          </View>
        }
      />

      {/* Typing indicator */}
      {sendMessage.isPending && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>MamaCare AI is thinking...</Text>
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          placeholderTextColor={colors.gray[400]}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          editable={!sendMessage.isPending}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || sendMessage.isPending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sendMessage.isPending}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.gray[50] },
  center:      { flex: 1, alignItems: "center", justifyContent: "center" },
  messageList: { padding: spacing[4], gap: spacing[3], paddingBottom: spacing[6] },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[8],
    paddingTop: spacing[16],
    gap: spacing[3],
  },
  emptyEmoji:    { fontSize: 48 },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[700],
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: "center",
    lineHeight: 24,
  },

  messageRow:    { flexDirection: "row", alignItems: "flex-end", gap: spacing[2] },
  userRow:       { justifyContent: "flex-end" },
  assistantRow:  { justifyContent: "flex-start" },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.rose[500],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },

  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: spacing[4],
    ...shadows.sm,
  },
  userBubble:      { backgroundColor: colors.rose[500], borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: colors.white,     borderBottomLeftRadius: 4 },

  bubbleText:    { fontSize: typography.fontSize.base, lineHeight: 22 },
  userText:      { color: colors.white },
  assistantText: { color: colors.gray[800] },

  fallbackNote: {
    fontSize: typography.fontSize.xs,
    color: colors.rose[200],
    marginTop: spacing[2],
  },

  typingIndicator: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[2],
  },
  typingText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[400],
    fontStyle: "italic",
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing[3],
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: spacing[3],
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 24,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    backgroundColor: colors.gray[50],
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.rose[500],
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { backgroundColor: colors.gray[300] },
  sendIcon: { color: colors.white, fontSize: 18 },
});
