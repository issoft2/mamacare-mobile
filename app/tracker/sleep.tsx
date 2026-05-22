/**
 * mobile/app/tracker/sleep.tsx
 * Refined Sleep Logger - Soft Indigo Theme
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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

export default function SleepLogScreen() {
  const router = useRouter();
  const logSleep = useLogSleep();
  const [band, setBand] = useState<SleepDurationBand>("6_8h");
  const [quality, setQuality] = useState<SleepQuality>("good");
  const [notes, setNotes] = useState("");

  return (
    <View style={styles.screen}>
      {/* <ImageBackground source={require("@/assets/welcome-bg.png")} style={styles.bgImage}> */}
        <LinearGradient colors={["rgba(26, 35, 126, 0.05)", "rgba(255, 255, 255, 0.9)"]} style={styles.bgOverlay}>
          <ScrollView contentContainerStyle={styles.content}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#1A237E" />
              </TouchableOpacity>
              <Text style={styles.title}>Sleep Journal</Text>
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

              <TouchableOpacity style={styles.submitBtn} onPress={() => logSleep.mutateAsync({ duration_band: band, quality, notes })}>
                <LinearGradient colors={["#6B7BB8", "#1A237E"]} style={styles.submitGradient}>
                  {logSleep.isPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Save Log</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      {/* </ImageBackground> */}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgImage: { flex: 1 },
  bgOverlay: { flex: 1 },
  content: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginRight: 15, elevation: 3 },
  title: { fontSize: 24, fontWeight: "800", color: "#1A237E" },
  glassCard: { backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 30, padding: 20, elevation: 5 },
  label: { fontSize: 12, fontWeight: '800', color: '#1A237E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  bandRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  bandBtn: { flex: 1, marginHorizontal: 4, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  bandActive: { borderColor: '#6B7BB8', backgroundColor: 'rgba(107, 123, 184, 0.1)' },
  bandText: { color: '#757575', fontWeight: '600' },
  bandTextActive: { color: '#1A237E' },
  qualityGrid: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  qualityCard: { flex: 1, backgroundColor: '#FFF', padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  qualityActive: { borderColor: '#6B7BB8', backgroundColor: 'rgba(107, 123, 184, 0.05)' },
  qualityEmoji: { fontSize: 30, marginBottom: 5 },
  qualityLabel: { fontSize: 13, color: '#757575', fontWeight: '600' },
  qualityLabelActive: { color: '#1A237E' },
  input: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, minHeight: 80, textAlignVertical: 'top', fontSize: 15 },
  submitBtn: { marginTop: 30, borderRadius: 20, overflow: 'hidden' },
  submitGradient: { padding: 18, alignItems: 'center' },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});
