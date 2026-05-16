/**
 * mobile/app/(tabs)/chat.tsx
 * Chat sessions list — tap to open a conversation.
 */

import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useChatSessions, useCreateChatSession } from "@mamacare/api";
import { useProfile } from "@mamacare/api";
import { colors, spacing, typography, shadows } from "@mamacare/ui";
import type { ChatSession } from "@mamacare/types";

export default function ChatScreen() {
  const router = useRouter();
  const { data: sessions, isLoading } = useChatSessions();
  const { data: profile } = useProfile();
  const createSession = useCreateChatSession();

  async function handleNewChat() {
    const week = profile?.gestational_week ?? 12;
    const session = await createSession.mutateAsync({ gestational_week: week });
    router.push(`/chat/${session.id}`);
  }

  function renderSession({ item }: { item: ChatSession }) {
    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <Text style={styles.sessionTitle}>{item.title ?? "New conversation"}</Text>
        <Text style={styles.sessionMeta}>
          Week {item.gestational_week} · {item.message_count} messages
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 16, marginBottom: 4 }}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/tabs/home');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ padding: 4, marginRight: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1A3A6A" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A3A6A' }}>Chat</Text>
      </View>
      <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
        <Text style={styles.newChatText}>+ Start New Conversation</Text>
      </TouchableOpacity>

      <FlatList
        data={sessions ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No conversations yet. Start one above.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  newChatButton: {
    margin: spacing[4],
    backgroundColor: colors.rose[500],
    borderRadius: 12,
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  newChatText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  list: { paddingHorizontal: spacing[4], gap: spacing[3] },
  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing[4],
    ...shadows.sm,
  },
  sessionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[900],
  },
  sessionMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing[1],
  },
  emptyText: {
    textAlign: "center",
    color: colors.gray[400],
    marginTop: spacing[12],
    fontSize: typography.fontSize.base,
  },
});
