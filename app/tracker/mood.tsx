/**
 * mobile/app/tracker/mood.tsx
 * Refined Emotional Check-in
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLogMood } from "@mamacare/api";
import type { Mood } from "@mamacare/types";

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "neutral", emoji: "😐", label: "Steady" },
  { value: "anxious", emoji: "😰", label: "Anxious" },
  { value: "low", emoji: "😔", label: "Low" },
];

export default function MoodLogScreen() {
  const router = useRouter();
  const logMood = useLogMood();
  const [mood, setMood] = useState<Mood>("neutral");
  const [notes, setNotes] = useState("");

  return (
    <View style={styles.screen}>
      <ImageBackground source={require("@/assets/images/mamacare-home-bg.png")} style={styles.bgImage}>
        <LinearGradient colors={["rgba(255,255,255,0.8)", "rgba(255,245,245,0.6)"]} style={styles.bgOverlay}>
          <ScrollView contentContainerStyle={styles.content}>
            
            <View style={styles.header}>
              <Text style={styles.title}>Emotional Check-in</Text>
              <Text style={styles.subtitle}>How is your heart feeling today?</Text>
            </View>

            <View style={styles.glassCard}>
              <View style={styles.moodGrid}>
                {MOODS.map(m => (
                  <TouchableOpacity
                    key={m.value}
                    style={[styles.moodCard, mood === m.value && styles.moodCardActive]}
                    onPress={() => setMood(m.value)}
                  >
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text style={[styles.moodLabel, mood === m.value && styles.moodLabelActive]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {(mood === "anxious" || mood === "low") && (
                <View style={styles.supportBanner}>
                   <Text style={styles.supportText}>💙 You're not alone. It's okay to feel this way. Take a deep breath.</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Additional Thoughts</Text>
              <TextInput
                style={styles.input}
                placeholder="What's on your mind?"
                placeholderTextColor="#BDBDBD"
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <TouchableOpacity style={styles.submitBtn} onPress={() => logMood.mutateAsync({ mood, notes })}>
                <LinearGradient colors={["#E8697C", "#FFA07A"]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.submitGradient}>
                  {logMood.isPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Save Reflection</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={styles.cancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgImage: { flex: 1 },
  bgOverlay: { flex: 1 },
  content: { padding: 20, paddingTop: 60 },
  header: { marginBottom: 30 },
  title: { fontSize: 26, fontWeight: "700", color: "#1A237E" },
  subtitle: { fontSize: 16, color: "#757575", marginTop: 4 },
  glassCard: { backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 30, padding: 20, elevation: 10, shadowOpacity: 0.1 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  moodCard: { width: '48%', backgroundColor: '#FFF', padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  moodCardActive: { borderColor: '#E8697C', backgroundColor: 'rgba(232, 105, 124, 0.05)' },
  moodEmoji: { fontSize: 40, marginBottom: 8 },
  moodLabel: { fontSize: 14, color: '#757575', fontWeight: '600' },
  moodLabelActive: { color: '#E8697C' },
  supportBanner: { backgroundColor: 'rgba(74, 144, 226, 0.1)', padding: 15, borderRadius: 15, marginBottom: 20 },
  supportText: { fontSize: 13, color: '#4A90E2', lineHeight: 18, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#9E9E9E', textTransform: 'uppercase', marginBottom: 10, marginLeft: 5 },
  input: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, minHeight: 100, textAlignVertical: 'top', fontSize: 15 },
  submitBtn: { marginTop: 30, borderRadius: 20, overflow: 'hidden' },
  submitGradient: { padding: 18, alignItems: 'center' },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  cancel: { marginTop: 20, alignItems: 'center' },
  cancelText: { color: '#BDBDBD' }
});