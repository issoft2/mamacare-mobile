/**
 * mobile/app/chat/[id].tsx
 * Refined Messaging UI - Full Keyboard Fix & High Depth
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { useChatSession, useSendMessage } from "@mamacare/api";

export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, refetch } = useChatSession(id);
  const sendMessage = useSendMessage(id);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);

  const messages = data?.messages ?? [];

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [messages.length]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sendMessage.isPending) return;
    setInput("");
    try {
      await sendMessage.mutateAsync({ content });
      await refetch();
    } catch (err) {
      setInput(content);
    }
  }

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
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ImageBackground 
        source={require("@/assets/images/mamacare-home-bg.png")} 
        style={styles.bgImage}
      >
        <LinearGradient 
          colors={["rgba(255,255,255,0.7)", "rgba(255,245,245,0.4)"]} 
          style={styles.bgOverlay}
        >
          {/* THE FIX: KeyboardAvoidingView wraps the entire content area */}
          <KeyboardAvoidingView 
            style={styles.flex} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} 
          >
            {/* Custom Glass Header */}
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={() => router.replace('/tabs/chat')} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={28} color="#1A237E" />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>MamaCare AI</Text>
                <Text style={styles.headerStatus}>Always here for you</Text>
              </View>
            </View>

            {/* Message List Area */}
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              // This helps keep the position when keyboard pops
              maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.welcomeEmoji}>✨</Text>
                  <Text style={styles.welcomeTitle}>How can I help you today?</Text>
                </View>
              }
            />

            {/* Floating Input Bar - This now "hugs" the keyboard */}
            <View style={styles.inputContainer}>
              <View style={styles.inputGlass}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ask me anything..."
                  placeholderTextColor="#9E9E9E"
                  value={input}
                  onChangeText={setInput}
                  multiline
                  blurOnSubmit={false}
                />
                <TouchableOpacity 
                  style={[styles.sendBtn, !input.trim() && styles.sendDisabled]} 
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
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF' },
  bgImage: { flex: 1 },
  bgOverlay: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  chatHeader: { 
    paddingTop: 60, 
    paddingBottom: 15, 
    paddingHorizontal: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1A237E" },
  headerStatus: { fontSize: 12, color: "#88B0A8", fontWeight: "600" },
  
  messageList: { padding: 20, paddingBottom: 30 },
  messageRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  
  assistantAvatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#FFF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 8, 
    elevation: 3,
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  avatarEmoji: { fontSize: 16 },
  
  bubble: { 
    maxWidth: '80%', 
    padding: 15, 
    borderRadius: 22,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  userBubble: { 
    backgroundColor: '#E8697C', 
    borderBottomRightRadius: 4, 
    shadowColor: '#E8697C', 
    shadowOpacity: 0.25 
  },
  assistantBubble: { 
    backgroundColor: '#FFF', 
    borderBottomLeftRadius: 4 
  },
  
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#FFF', fontWeight: '500' },
  assistantText: { color: '#424242' },
  
  inputContainer: { 
    paddingHorizontal: 20, 
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, 
    backgroundColor: 'transparent'
  },
  inputGlass: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    borderRadius: 30, 
    paddingHorizontal: 15, 
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: -2 }
  },
  textInput: { flex: 1, color: '#1A237E', fontSize: 16, maxHeight: 100, paddingVertical: 10 },
  sendBtn: { borderRadius: 20, overflow: 'hidden', marginLeft: 10 },
  sendGradient: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
  
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  welcomeEmoji: { fontSize: 40, marginBottom: 10 },
  welcomeTitle: { color: '#9E9E9E', fontSize: 16, fontWeight: '600' }
});