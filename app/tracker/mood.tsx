/**
 * mobile/app/tracker/mood.tsx
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useLogMood } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";
import type { Mood } from "@mamacare/types";

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: "happy",   emoji: "😊", label: "Happy"   },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "anxious", emoji: "😰", label: "Anxious" },
  { value: "low",     emoji: "😔", label: "Low"     },
];

export default function MoodLogScreen() {
  const router = useRouter();
  const logMood = useLogMood();
  const [mood,  setMood]  = useState<Mood>("neutral");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    try {
      await logMood.mutateAsync({ mood, notes: notes || undefined });
      router.back();
    } catch (err: any) {
      setError(err.body?.error?.message ?? "Failed to save mood log.");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>How are you feeling?</Text>
      <Text style={styles.subtitle}>Your emotional wellbeing matters</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.moodGrid}>
        {MOODS.map(m => (
          <TouchableOpacity
            key={m.value}
            style={[styles.moodCard, mood === m.value && styles.moodCardActive]}
            onPress={() => setMood(m.value)}
          >
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
            <Text style={[styles.moodLabel, mood === m.value && styles.moodLabelActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {(mood === "anxious" || mood === "low") && (
        <View style={styles.supportBanner}>
          <Text style={styles.supportText}>
            💙 It's okay to feel this way during pregnancy. If you're struggling, please speak to your midwife or call the Samaritans on 116 123.
          </Text>
        </View>
      )}

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={styles.textarea}
        placeholder="What's on your mind?"
        placeholderTextColor={colors.gray[400]}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.button, logMood.isPending && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={logMood.isPending}
      >
        {logMood.isPending
          ? <ActivityIndicator color={colors.white} />
          : <Text style={styles.buttonText}>Save Mood</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.white },
  content:         { padding: spacing[6], maxWidth: 480, alignSelf: "center", width: "100%", gap: spacing[5] },
  title:           { fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.navy[700] },
  subtitle:        { fontSize: typography.fontSize.base, color: colors.gray[500], marginTop: -spacing[3] },
  error:           { backgroundColor: "#FCEBEB", color: "#A32D2D", padding: spacing[3], borderRadius: 8, fontSize: typography.fontSize.sm },
  moodGrid:        { flexDirection: "row", flexWrap: "wrap", gap: spacing[3] },
  moodCard:        { width: "47%", borderWidth: 1, borderColor: colors.gray[200], borderRadius: 16, padding: spacing[5], alignItems: "center", gap: spacing[2] },
  moodCardActive:  { borderColor: colors.rose[500], backgroundColor: colors.rose[50] },
  moodEmoji:       { fontSize: 40 },
  moodLabel:       { fontSize: typography.fontSize.base, color: colors.gray[600] },
  moodLabelActive: { color: colors.rose[600], fontWeight: typography.fontWeight.semibold },
  supportBanner:   { backgroundColor: "#E6EEF8", borderRadius: 12, padding: spacing[4] },
  supportText:     { fontSize: typography.fontSize.sm, color: "#1A3A6A", lineHeight: 20 },
  label:           { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.gray[700] },
  textarea:        { borderWidth: 1, borderColor: colors.gray[200], borderRadius: 12, padding: spacing[4], fontSize: typography.fontSize.base, color: colors.gray[900], backgroundColor: colors.gray[50], minHeight: 80 },
  button:          { backgroundColor: colors.rose[500], borderRadius: 12, paddingVertical: spacing[4], alignItems: "center" },
  buttonDisabled:  { opacity: 0.6 },
  buttonText:      { color: colors.white, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
});
