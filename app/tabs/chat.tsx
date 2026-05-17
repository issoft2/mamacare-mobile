/**
 * mobile/app/(tabs)/chat.tsx
 * Refined Chat Sessions - High Depth List
 */

import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { useChatSessions, useCreateChatSession, useProfile } from "@mamacare/api";
import { colors, shadows } from "@mamacare/ui";

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

  function renderSession({ item }: { item: any }) {
    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>{item.title ?? "New conversation"}</Text>
          <Text style={styles.sessionMeta}>
            Week {item.gestational_week} • {item.message_count} messages
          </Text>
        </View>
        <View style={styles.arrowCircle}>
          <Ionicons name="chevron-forward" size={18} color="#E8697C" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screen}>
      <ImageBackground source={require("@/assets/images/mamacare-home-bg.png")} style={styles.bgImage}>
        <LinearGradient colors={["rgba(255,255,255,0.7)", "rgba(255,245,245,0.4)"]} style={styles.bgOverlay}>
          
          <View style={styles.header}>
             <Text style={styles.screenTitle}>Conversations</Text>
          </View>

          <TouchableOpacity style={styles.newChatBtn} onPress={handleNewChat}>
            <LinearGradient colors={["#E8697C", "#FFA07A"]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.newChatGradient}>
              <Ionicons name="add" size={24} color="#FFF" />
              <Text style={styles.newChatText}>Start New Conversation</Text>
            </LinearGradient>
          </TouchableOpacity>

          <FlatList
            data={sessions ?? []}
            keyExtractor={(item) => item.id}
            renderItem={renderSession}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                 <Text style={styles.emptyText}>No conversations yet. Your journey starts here.</Text>
              </View>
            }
          />
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgImage: { flex: 1 },
  bgOverlay: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20 },
  screenTitle: { fontSize: 28, fontWeight: "700", color: "#1A237E" },
  list: { padding: 20, paddingBottom: 120 },
  newChatBtn: { marginHorizontal: 20, marginTop: 20, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: "#E8697C", shadowOpacity: 0.3, shadowRadius: 10 },
  newChatGradient: { padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  newChatText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  sessionCard: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    elevation: 3,
    shadowOpacity: 0.05
  },
  sessionInfo: { flex: 1 },
  sessionTitle: { fontSize: 17, fontWeight: "700", color: "#1A237E", marginBottom: 4 },
  sessionMeta: { fontSize: 13, color: "#757575" },
  arrowCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(232,105,124,0.1)", alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { marginTop: 60, alignItems: 'center' },
  emptyText: { color: "#9E9E9E", textAlign: 'center', fontSize: 15 }
});