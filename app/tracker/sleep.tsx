/**
 * mobile/app/tracker/sleep.tsx
 * Refined Sleep Logger - Soft Indigo Theme
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";
import { Ionicons } from '@expo/vector-icons';
import { useLogSleep } from "@mumcare/api";
import type { SleepDurationBand, SleepQuality } from "@mumcare/types";

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
  const logSleep = useLogSleep();
  const todayDateKey = getLocalDateKey(new Date());
  const [band, setBand] = useState<SleepDurationBand>("6_8h");
  const [quality, setQuality] = useState<SleepQuality>("good");
  const [notes, setNotes] = useState("");

  return (
    <View style={styles.screen}>
        <LinearGradient colors={["rgba(255,251,247,0.92)", "rgba(255,244,239,0.68)"]} style={styles.bgOverlay}>
          <ScrollView contentContainerStyle={styles.content}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.push("/tabs/tracker")} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#6D4A45" />
              </TouchableOpacity>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>NIGHT REST</Text>
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

              <Text style={styles.label}>Quality of Rest</Text>
              <View style={styles.qualityGrid}>

              <View style={styles.supportBox}>
                <Ionicons name="moon" size={14} color="#8E5A54" />
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
                placeholderTextColor="#9E9E9E"
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <TouchableOpacity
                style={[ctaButtonStyles.button, styles.submitBtn, logSleep.isPending && styles.submitBtnDisabled]}
                onPress={() => logSleep.mutateAsync({ duration_band: band, quality, notes, log_date: todayDateKey })}
                disabled={logSleep.isPending}
                activeOpacity={0.88}
              >
                <LinearGradient colors={ctaGradientColors} style={ctaButtonStyles.gradient}>
                  {logSleep.isPending ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                      <Text style={ctaButtonStyles.text}>Save Log</Text>
                    </>
                  )}
                </LinearGradient>
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
        shadowColor: '#1A2E4A',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#8E5A54', letterSpacing: 1.1, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: "800", color: "#4D3B39" },
  subtitle: { marginTop: 6, fontSize: 13, lineHeight: 19, color: '#6E7890' },
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.74)",
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
  label: { fontSize: 11, fontWeight: '800', color: '#8E5A54', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 12, marginLeft: 4 },
  bandRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  bandBtn: { flex: 1, marginHorizontal: 4, paddingVertical: 12, borderRadius: 14, backgroundColor: '#FFF', alignItems: 'center', borderWidth: 1.2, borderColor: 'rgba(140,90,82,0.16)' },
  bandActive: { borderColor: '#C97B6E', backgroundColor: 'rgba(201, 123, 110, 0.10)' },
  bandText: { color: '#757575', fontWeight: '700' },
  bandTextActive: { color: '#6D4A45' },
  qualityGrid: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  qualityCard: { flex: 1, backgroundColor: '#FFF', padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1.2, borderColor: 'rgba(140,90,82,0.16)' },
  qualityActive: { borderColor: '#C97B6E', backgroundColor: 'rgba(201, 123, 110, 0.10)' },
  qualityEmoji: { fontSize: 30, marginBottom: 5 },
  qualityLabel: { fontSize: 13, color: '#757575', fontWeight: '700' },
  qualityLabelActive: { color: '#6D4A45' },
  supportBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(201, 123, 110, 0.10)',
    borderRadius: 14,
    padding: 12,
    marginTop: -6,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#C97B6E',
  },
  supportText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: '#6D4A45' },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 15,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#4D3B39',
    borderWidth: 1.2,
    borderColor: 'rgba(140,90,82,0.16)',
  },
  submitBtn: { marginTop: 30 },
  submitBtnDisabled: { opacity: 0.72 },
});
