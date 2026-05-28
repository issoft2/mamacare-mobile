/**
 * mobile/app/tracker/mood.tsx
 * Refined Emotional Check-in
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";
import { useLogMood, useMoodLogs } from "@mumcare/api";
import type { Mood } from "@mumcare/types";
import { Ionicons } from '@expo/vector-icons';


const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: "happy", emoji: "😊", label: "Hopeful" },
  { value: "neutral", emoji: "😐", label: "Steady" },
  { value: "anxious", emoji: "😰", label: "Anxious" },
  { value: "low", emoji: "😔", label: "Tired" },
];

function isMood(value: unknown): value is Mood {
  return value === "happy" || value === "neutral" || value === "anxious" || value === "low";
}

function getLocalDateKey(value: Date): string {
  const yyyy = value.getFullYear();
  const mm = `${value.getMonth() + 1}`.padStart(2, "0");
  const dd = `${value.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDateKeyFromRaw(value: string | undefined): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return getLocalDateKey(date);
}

function getMoodAffirmation(value: Mood): string {
  if (value === "happy") return "Beautiful energy today. Keep leaning into what makes you feel safe and joyful.";
  if (value === "neutral") return "Steady days matter too. Gentle routines help keep your mind and body grounded.";
  if (value === "anxious") return "You are not alone. Slow breaths and small pauses can help your nervous system soften.";
  return "Low days happen. Be extra kind to yourself and reach out if you need more support today.";
}

export default function MoodLogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mood?: string }>();
  const { data: moodLogs } = useMoodLogs();
  const logMood = useLogMood();
  const [mood, setMood] = useState<Mood>("neutral");
  const [notes, setNotes] = useState("");
  const [isMoodChosenManually, setIsMoodChosenManually] = useState(false);
  const todayDateKey = getLocalDateKey(new Date());

  useEffect(() => {
    if (isMoodChosenManually) return;

    const routeMood = params.mood;
    if (isMood(routeMood)) {
      setMood(routeMood);
      return;
    }

    const latestMood = moodLogs?.find((entry) => {
      const dateKey = getDateKeyFromRaw(entry.log_date) ?? getDateKeyFromRaw(entry.created_at);
      return dateKey === todayDateKey;
    })?.mood;

    if (latestMood) {
      setMood(latestMood);
      return;
    }

    setMood("neutral");
  }, [isMoodChosenManually, moodLogs, params.mood, todayDateKey]);

  return (
    <View style={styles.screen}>
        <LinearGradient colors={["rgba(255,251,247,0.92)", "rgba(255,244,239,0.68)"]} style={styles.bgOverlay}>
          <ScrollView contentContainerStyle={styles.content}>
        
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.push("/tabs/tracker")} style={styles.backBtn}>
                   <Ionicons name="chevron-back" size={24} color="#6D4A45" />
              </TouchableOpacity>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>EMOTIONAL CARE</Text>
                <Text style={styles.title}>Emotional Check-in</Text>
                <Text style={styles.subtitle}>Capture how you feel today so MumCare can support you with warmth and better guidance.</Text>
              </View>
            </View>

            <View style={styles.glassCard}>
              <Text style={styles.inputLabel}>How are you feeling?</Text>
              <View style={styles.moodGrid}>
                {MOODS.map(m => (
                  <TouchableOpacity
                    key={m.value}
                    style={[styles.moodCard, mood === m.value && styles.moodCardActive]}
                    onPress={() => {
                      setIsMoodChosenManually(true);
                      setMood(m.value);
                    }}
                  >
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text style={[styles.moodLabel, mood === m.value && styles.moodLabelActive]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.supportBanner}>
                <Ionicons name="heart" size={14} color="#8E5A54" />
                <Text style={styles.supportText}>{getMoodAffirmation(mood)}</Text>
              </View>

              <Text style={styles.inputLabel}>Additional Thoughts</Text>
              <TextInput
                style={styles.input}
                placeholder="What's on your mind?"
                placeholderTextColor="#BDBDBD"
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <TouchableOpacity
                style={[ctaButtonStyles.button, styles.submitBtn, logMood.isPending && styles.submitBtnDisabled]}
                onPress={() => logMood.mutateAsync({ mood, notes, log_date: todayDateKey })}
                disabled={logMood.isPending}
                activeOpacity={0.88}
              >
                <LinearGradient colors={ctaGradientColors} start={{x:0, y:0}} end={{x:1, y:0}} style={ctaButtonStyles.gradient}>
                  {logMood.isPending ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                      <Text style={ctaButtonStyles.text}>Save Reflection</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={styles.cancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgOverlay: { flex: 1 },
  content: { padding: 20, paddingTop: 56, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#8E5A54', letterSpacing: 1.1, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: '800', color: '#4D3B39' },
  subtitle: { marginTop: 6, fontSize: 13, lineHeight: 19, color: '#6E7890' },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.74)',
    ...Platform.select({
      ios: {
        shadowColor: '#C97B6E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
      },
      android: { elevation: 4 },
    }),
  },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  moodCard: { width: '48%', backgroundColor: '#FFF', padding: 18, borderRadius: 20, alignItems: 'center', borderWidth: 1.2, borderColor: 'rgba(140,90,82,0.16)' },
  moodCardActive: { borderColor: '#C97B6E', backgroundColor: 'rgba(201, 123, 110, 0.10)' },
  moodEmoji: { fontSize: 40, marginBottom: 8 },
  moodLabel: { fontSize: 14, color: '#757575', fontWeight: '700' },
  moodLabelActive: { color: '#8E5A54' },
  supportBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(201, 123, 110, 0.10)',
    padding: 12,
    borderRadius: 14,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#C97B6E',
  },
  supportText: { flex: 1, fontSize: 12.5, color: '#6D4A45', lineHeight: 18 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#8E5A54', textTransform: 'uppercase', marginBottom: 10, marginLeft: 5, letterSpacing: 1.1 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#4D3B39',
    borderWidth: 1.2,
    borderColor: 'rgba(140,90,82,0.16)',
  },
  submitBtn: { marginTop: 30 },
  submitBtnDisabled: { opacity: 0.72 },
  cancel: { marginTop: 20, alignItems: 'center' },
  cancelText: { color: '#98A2B8', fontWeight: '600' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#6A4039',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },

});