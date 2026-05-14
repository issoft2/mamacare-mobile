/**
 * mobile/app/symptoms/new.tsx
 * Symptom submission form.
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useProfile, useSubmitSymptom } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";
import type { Severity } from "@mamacare/types";

import { getErrorMessage } from "@/lib/errors";

const SYMPTOMS = [
  { code: "HEADACHE",                label: "Headache" },
  { code: "NAUSEA_VOMITING",         label: "Nausea / Vomiting" },
  { code: "BACK_PAIN",               label: "Back Pain" },
  { code: "REDUCED_FETAL_MOVEMENT",  label: "Reduced Fetal Movement" },
  { code: "SWELLING",                label: "Swelling" },
  { code: "BLEEDING",                label: "Bleeding" },
  { code: "ABDOMINAL_PAIN",          label: "Abdominal Pain" },
  { code: "DIZZINESS",               label: "Dizziness" },
  { code: "SHORTNESS_OF_BREATH",     label: "Shortness of Breath" },
  { code: "FATIGUE",                 label: "Fatigue" },
];

const SEVERITIES: Severity[] = ["mild", "moderate", "severe"];

export default function NewSymptomScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const submitSymptom = useSubmitSymptom();

  const [selected, setSelected]   = useState<string[]>([]);
  const [severity, setSeverity]   = useState<Severity>("mild");
  const [notes, setNotes]         = useState("");
  const [error, setError]         = useState("");

  function toggleSymptom(code: string) {
    setSelected(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  }

  async function handleSubmit() {
    setError("");
    if (selected.length === 0) {
      setError("Please select at least one symptom.");
      return;
    }

    try {
      await submitSymptom.mutateAsync({
        symptoms: selected.map(code => ({
          symptom_code: code,
          symptom_label: SYMPTOMS.find(s => s.code === code)?.label ?? code,
        })),
        severity,
        free_text_notes: notes || undefined,
        gestational_week: profile?.gestational_week ?? 12,
        source: "builder",
      });
      router.replace("/tabs/symptoms");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to submit."));
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Log Symptoms</Text>
      <Text style={styles.subtitle}>Select all that apply</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Symptom chips */}
      <Text style={styles.sectionLabel}>Symptoms *</Text>
      <View style={styles.chips}>
        {SYMPTOMS.map(symptom => {
          const active = selected.includes(symptom.code);
          return (
            <TouchableOpacity
              key={symptom.code}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleSymptom(symptom.code)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {symptom.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Severity */}
      <Text style={styles.sectionLabel}>Severity *</Text>
      <View style={styles.severityRow}>
        {SEVERITIES.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.severityBtn, severity === s && styles.severityBtnActive]}
            onPress={() => setSeverity(s)}
          >
            <Text style={[styles.severityText, severity === s && styles.severityTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes */}
      <Text style={styles.sectionLabel}>Additional notes (optional)</Text>
      <TextInput
        style={styles.textarea}
        placeholder="Describe how you are feeling..."
        placeholderTextColor={colors.gray[400]}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Submit */}
      <TouchableOpacity
        style={[styles.button, submitSymptom.isPending && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitSymptom.isPending}
      >
        {submitSymptom.isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Submit Symptoms</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancel} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.white },
  content: {
    padding: spacing[6],
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[700],
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    marginBottom: spacing[6],
  },
  error: {
    backgroundColor: "#FCEBEB",
    color: "#A32D2D",
    padding: spacing[3],
    borderRadius: 8,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[4],
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing[3],
    marginTop: spacing[4],
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 20,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.white,
  },
  chipActive: {
    borderColor: colors.rose[500],
    backgroundColor: colors.rose[100],
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  chipTextActive: {
    color: colors.rose[600],
    fontWeight: typography.fontWeight.medium,
  },
  severityRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  severityBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 10,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  severityBtnActive: {
    borderColor: colors.rose[500],
    backgroundColor: colors.rose[100],
  },
  severityText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  severityTextActive: {
    color: colors.rose[600],
    fontWeight: typography.fontWeight.semibold,
  },
  textarea: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    padding: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    backgroundColor: colors.gray[50],
    minHeight: 100,
  },
  button: {
    backgroundColor: colors.rose[500],
    borderRadius: 12,
    paddingVertical: spacing[4],
    alignItems: "center",
    marginTop: spacing[6],
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: spacing[4],
  },
  cancelText: {
    color: colors.gray[400],
    fontSize: typography.fontSize.sm,
  },
});
