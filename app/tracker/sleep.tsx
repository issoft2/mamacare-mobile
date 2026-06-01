/**
 * mobile/app/tracker/sleep.tsx
 * Refined Sleep Logger - Soft Indigo Theme
 */

import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";
import { Ionicons } from '@expo/vector-icons';
import { useLogSleep, useProfile } from "@mumcare/api";
import type { SleepDurationBand, SleepQuality } from "@mumcare/types";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";
import promptFinishOnboarding from "@/lib/onboardingPrompt";

const BANDS: { value: SleepDurationBand; label: string }[] = [
  { value: "under_4h", label: "< 4h" },
  { value: "4_6h",     label: "4-6h"   },
  { value: "6_8h",     label: "6-8h"   },
  { value: "over_8h",  label: "8h+"  },
];

const QUALITIES: { value: SleepQuality; label: string; emoji: string }[] = [
  { value: "poor", label: "Poor",  emoji: "😴" },
  { value: "fair", label: "Fair",  emoji: "🌤️" },
  { value: "good", label: "Great",  emoji: "✨" },
];

function getSleepAffirmation(quality: SleepQuality): string {
  if (quality === "good") return "Beautiful. Rest like this helps both you and baby recharge.";
  if (quality === "fair") return "You're doing your best. A gentler bedtime routine can improve tonight's sleep.";
  return "Tough nights happen. Be kind to yourself today and rest whenever you can.";
}

function getLocalDateKey(value: Date): string {
  const yyyy = value.getFullYear();
  const mm = `${value.getMonth() + 1}`.padStart(2, "0");
  const dd = `${value.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function SleepLogScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const hasCompletedOnboarding = Boolean(profile);
  const onboardingRedirectPath = "/onboarding/profile-setup";
  const logSleep = useLogSleep();
  const todayDateKey = getLocalDateKey(new Date());
  const [band, setBand] = useState<SleepDurationBand>("6_8h");
  const [quality, setQuality] = useState<SleepQuality>("good");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      promptFinishOnboarding(router);
    }
  }, [hasCompletedOnboarding, router]);

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
                <Text style={styles.eyebrow}>Night rest</Text>
                <Text style={styles.title}>Sleep Journal</Text>
                <Text style={styles.subtitle}>Track your rest with care so MumCare can better support your energy and wellbeing.</Text>
              </View>
            </View>

            <View style={styles.glassCard}>
              <Text style={styles.label}>Duration</Text>
              <View style={styles.bandRow}>
                {BANDS.map(b => (
                  <TouchableOpacity
                    key={b.value}
                    style={[styles.bandBtn, band === b.value && styles.bandActive]}
                    onPress={() => setBand(b.value)}
                  >
                    <Text style={[styles.bandText, band === b.value && styles.bandTextActive]}>{b.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Quality of rest</Text>
              <View style={styles.qualityGrid}>

              <View style={styles.supportBox}>
                <Ionicons name="moon" size={14} color={AUTH_UI.linkBerry} />
                <Text style={styles.supportText}>{getSleepAffirmation(quality)}</Text>
              </View>
                {QUALITIES.map(q => (
                  <TouchableOpacity
                    key={q.value}
                    style={[styles.qualityCard, quality === q.value && styles.qualityActive]}
                    onPress={() => setQuality(q.value)}
                  >
                    <Text style={styles.qualityEmoji}>{q.emoji}</Text>
                    <Text style={[styles.qualityLabel, quality === q.value && styles.qualityLabelActive]}>{q.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={styles.input}
                placeholder="Any vivid dreams or interruptions?"
                placeholderTextColor={AUTH_UI.placeholder}
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <TouchableOpacity
                style={[ctaButtonStyles.button, styles.submitBtn, logSleep.isPending && styles.submitBtnDisabled]}
                onPress={async () => {
                  await logSleep.mutateAsync({ duration_band: band, quality, notes, log_date: todayDateKey });
                  router.push("/tabs/tracker");
                }}
                disabled={logSleep.isPending}
                activeOpacity={0.88}
              >
                <LinearGradient colors={ctaGradientColors} style={ctaButtonStyles.gradient}>
                  {logSleep.isPending ? (
                    <ActivityIndicator color={AUTH_UI.textWhite} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color={AUTH_UI.textWhite} />
                      <Text style={ctaButtonStyles.text}>Save log</Text>
                    </>
                  )}
                </LinearGradient>
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
        shadowColor: AUTH_UI.shadowNavy,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 12, fontWeight: '700', color: AUTH_UI.textBlack, marginBottom: 6, fontFamily: FONT_FRIENDLY_SANS },
  title: { fontSize: 30, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.5 },
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
  label: { fontSize: 14, fontWeight: '600', color: AUTH_UI.textBlack, marginBottom: 12, marginLeft: 2, fontFamily: FONT_FRIENDLY_SANS },
  bandRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  bandBtn: { flex: 1, marginHorizontal: 4, paddingVertical: 12, borderRadius: AUTH_UI.inputRadius, backgroundColor: AUTH_UI.textWhite, alignItems: 'center', borderWidth: AUTH_UI.borderWidth, borderColor: AUTH_UI.semanticSevereBorder20 },
  bandActive: { borderColor: AUTH_UI.shadowRose, backgroundColor: AUTH_UI.shadowRoseSoft10 },
  bandText: { color: AUTH_UI.textBlack, fontWeight: '700', fontFamily: FONT_FRIENDLY_SANS },
  bandTextActive: { color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  qualityGrid: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  qualityCard: { flex: 1, backgroundColor: AUTH_UI.textWhite, padding: 15, borderRadius: AUTH_UI.inputRadius, alignItems: 'center', borderWidth: AUTH_UI.borderWidth, borderColor: AUTH_UI.semanticSevereBorder20 },
  qualityActive: { borderColor: AUTH_UI.shadowRose, backgroundColor: AUTH_UI.shadowRoseSoft10 },
  qualityEmoji: { fontSize: 30, marginBottom: 5 },
  qualityLabel: { fontSize: 13, color: AUTH_UI.textBlack, fontWeight: '700', fontFamily: FONT_FRIENDLY_SANS },
  qualityLabelActive: { color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  supportBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: AUTH_UI.shadowRoseSoft10,
    borderRadius: 14,
    padding: 12,
    marginTop: -6,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: AUTH_UI.shadowRose,
  },
  supportText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  input: {
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: AUTH_UI.inputRadius,
    paddingHorizontal: AUTH_UI.fieldPaddingX,
    paddingVertical: AUTH_UI.fieldPaddingY,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 15,
    color: AUTH_UI.textBlack,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: AUTH_UI.semanticSevereBorder20,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  submitBtn: { marginTop: 30 },
  submitBtnDisabled: { opacity: 0.72 },
});
