/**
 * mobile/app/tracker/mood.tsx
 * Refined Emotional Check-in
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";
import { useLogMood, useMoodLogs } from "@mumcare/api";
import type { Mood } from "@mumcare/types";
import { Ionicons } from '@expo/vector-icons';
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";


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
      <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.bgOverlay}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
        >
          <ScrollView contentContainerStyle={styles.content}>
        
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.push("/tabs/tracker")} style={styles.backBtn}>
                   <Ionicons name="chevron-back" size={24} color={AUTH_UI.linkBerry} />
              </TouchableOpacity>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Emotional care</Text>
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
                <Ionicons name="heart" size={14} color={AUTH_UI.linkBerry} />
                <Text style={styles.supportText}>{getMoodAffirmation(mood)}</Text>
              </View>

              <Text style={styles.inputLabel}>Additional thoughts</Text>
              <TextInput
                style={styles.input}
                placeholder="What's on your mind?"
                placeholderTextColor={AUTH_UI.semanticNeutral}
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <TouchableOpacity
                style={[ctaButtonStyles.button, styles.submitBtn, logMood.isPending && styles.submitBtnDisabled]}
                onPress={async () => {
                  await logMood.mutateAsync({ mood, notes, log_date: todayDateKey });
                  router.push("/tabs/tracker");
                }}
                disabled={logMood.isPending}
                activeOpacity={0.88}
              >
                <LinearGradient colors={ctaGradientColors} start={{x:0, y:0}} end={{x:1, y:0}} style={ctaButtonStyles.gradient}>
                  {logMood.isPending ? (
                    <ActivityIndicator color={AUTH_UI.textWhite} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color={AUTH_UI.textWhite} />
                      <Text style={ctaButtonStyles.text}>Save reflection</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push("/tabs/tracker")} style={styles.cancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_UI.warmBackground },
  bgOverlay: { flex: 1 },
  keyboardContainer: { flex: 1 },
  content: { flexGrow: 1, padding: 20, paddingTop: 56, paddingBottom: 96 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 12, fontWeight: '700', color: AUTH_UI.textBlack, marginBottom: 6, fontFamily: FONT_FRIENDLY_SANS },
  title: { fontSize: 30, fontWeight: '800', color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.5 },
  subtitle: { marginTop: 6, fontSize: 13, lineHeight: 19, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  glassCard: {
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: AUTH_UI.cardRadius,
    padding: 20,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: AUTH_UI.semanticSevereBorder20,
    ...Platform.select({
      ios: {
        shadowColor: AUTH_UI.shadowRose,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
      },
      android: { elevation: 4 },
    }),
  },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  moodCard: { width: '48%', backgroundColor: AUTH_UI.textWhite, padding: 18, borderRadius: AUTH_UI.inputRadius, alignItems: 'center', borderWidth: AUTH_UI.borderWidth, borderColor: AUTH_UI.semanticSevereBorder20 },
  moodCardActive: { borderColor: AUTH_UI.shadowRose, backgroundColor: AUTH_UI.shadowRoseSoft10 },
  moodEmoji: { fontSize: 40, marginBottom: 8 },
  moodLabel: { fontSize: 14, color: AUTH_UI.textBlack, fontWeight: '700', fontFamily: FONT_FRIENDLY_SANS },
  moodLabelActive: { color: AUTH_UI.shadowRose },
  supportBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: AUTH_UI.shadowRoseSoft10,
    padding: 12,
    borderRadius: 14,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: AUTH_UI.shadowRose,
  },
  supportText: { flex: 1, fontSize: 12.5, color: AUTH_UI.textBlack, lineHeight: 18, fontFamily: FONT_FRIENDLY_SANS },
  inputLabel: { fontSize: 14, fontWeight: '600', color: AUTH_UI.textBlack, marginBottom: 10, marginLeft: 2, fontFamily: FONT_FRIENDLY_SANS },
  input: {
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: AUTH_UI.inputRadius,
    paddingHorizontal: AUTH_UI.fieldPaddingX,
    paddingVertical: AUTH_UI.fieldPaddingY,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    color: AUTH_UI.textBlack,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: AUTH_UI.semanticSevereBorder20,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  submitBtn: { marginTop: 30 },
  submitBtnDisabled: { opacity: 0.72 },
  cancel: { marginTop: 20, alignItems: 'center' },
  cancelText: { color: AUTH_UI.textBlack, fontWeight: '600', fontFamily: FONT_FRIENDLY_SANS },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AUTH_UI.textWhite,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: AUTH_UI.semanticSevereBorder20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    ...Platform.select({
      ios: {
        shadowColor: AUTH_UI.shadowBrown,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },

});