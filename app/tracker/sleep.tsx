/**
 * mobile/app/tracker/sleep.tsx
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useLogSleep } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";
import type { SleepDurationBand, SleepQuality } from "@mamacare/types";

import { getErrorMessage } from "@/lib/errors";

const BANDS: { value: SleepDurationBand; label: string }[] = [
  { value: "under_4h", label: "Under 4 hours" },
  { value: "4_6h",     label: "4 – 6 hours"   },
  { value: "6_8h",     label: "6 – 8 hours"   },
  { value: "over_8h",  label: "Over 8 hours"  },
];

const QUALITIES: { value: SleepQuality; label: string; emoji: string }[] = [
  { value: "poor", label: "Poor",  emoji: "😔" },
  { value: "fair", label: "Fair",  emoji: "😐" },
  { value: "good", label: "Good",  emoji: "😊" },
];

export default function SleepLogScreen() {
  const router = useRouter();
  const logSleep = useLogSleep();
  const [band,    setBand]    = useState<SleepDurationBand>("6_8h");
  const [quality, setQuality] = useState<SleepQuality>("good");
  const [notes,   setNotes]   = useState("");
  const [error,   setError]   = useState("");

  async function handleSubmit() {
    setError("");
    try {
      await logSleep.mutateAsync({ duration_band: band, quality, notes: notes || undefined });
      router.back();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save sleep log."));
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Log Sleep</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>How long did you sleep?</Text>
      <View style={styles.options}>
        {BANDS.map(b => (
          <TouchableOpacity
            key={b.value}
            style={[styles.option, band === b.value && styles.optionActive]}
            onPress={() => setBand(b.value)}
          >
            <Text style={[styles.optionText, band === b.value && styles.optionTextActive]}>
              {b.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Sleep quality</Text>
      <View style={styles.qualityRow}>
        {QUALITIES.map(q => (
          <TouchableOpacity
            key={q.value}
            style={[styles.qualityBtn, quality === q.value && styles.qualityBtnActive]}
            onPress={() => setQuality(q.value)}
          >
            <Text style={styles.qualityEmoji}>{q.emoji}</Text>
            <Text style={[styles.qualityText, quality === q.value && styles.qualityTextActive]}>
              {q.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={styles.textarea}
        placeholder="Any sleep issues, dreams, or notes..."
        placeholderTextColor={colors.gray[400]}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.button, logSleep.isPending && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={logSleep.isPending}
      >
        {logSleep.isPending
          ? <ActivityIndicator color={colors.white} />
          : <Text style={styles.buttonText}>Save Sleep Log</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.white },
  content:        { padding: spacing[6], maxWidth: 480, alignSelf: "center", width: "100%", gap: spacing[4] },
  title:          { fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.navy[700] },
  error:          { backgroundColor: "#FCEBEB", color: "#A32D2D", padding: spacing[3], borderRadius: 8, fontSize: typography.fontSize.sm },
  label:          { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.gray[700] },
  options:        { gap: spacing[2] },
  option:         { borderWidth: 1, borderColor: colors.gray[200], borderRadius: 10, paddingVertical: spacing[3], paddingHorizontal: spacing[4] },
  optionActive:   { borderColor: colors.rose[500], backgroundColor: colors.rose[100] },
  optionText:     { fontSize: typography.fontSize.base, color: colors.gray[700] },
  optionTextActive: { color: colors.rose[600], fontWeight: typography.fontWeight.medium },
  qualityRow:     { flexDirection: "row", gap: spacing[3] },
  qualityBtn:     { flex: 1, borderWidth: 1, borderColor: colors.gray[200], borderRadius: 12, padding: spacing[3], alignItems: "center", gap: spacing[1] },
  qualityBtnActive: { borderColor: colors.rose[500], backgroundColor: colors.rose[100] },
  qualityEmoji:   { fontSize: 28 },
  qualityText:    { fontSize: typography.fontSize.sm, color: colors.gray[600] },
  qualityTextActive: { color: colors.rose[600], fontWeight: typography.fontWeight.medium },
  textarea:       { borderWidth: 1, borderColor: colors.gray[200], borderRadius: 12, padding: spacing[4], fontSize: typography.fontSize.base, color: colors.gray[900], backgroundColor: colors.gray[50], minHeight: 80 },
  button:         { backgroundColor: colors.rose[500], borderRadius: 12, paddingVertical: spacing[4], alignItems: "center", marginTop: spacing[2] },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: colors.white, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
});
