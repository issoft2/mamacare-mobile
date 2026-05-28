/**
 * mobile/app/symptoms/new.tsx
 * High Depth Symptom Form — with working submit logic
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";
import { Ionicons } from "@expo/vector-icons";
import { useProfile, useSubmitSymptom } from "@mumcare/api";
import { colors } from "@mumcare/ui";
import type { Severity } from "@mumcare/types";
import { resolveCurrentGestationalWeek } from "@/lib/gestationalWeek";

// ── Symptom options ───────────────────────────────────────────────────────────

const SYMPTOMS = [
  { code: "HEADACHE",              label: "Headache" },
  { code: "NAUSEA_VOMITING",       label: "Nausea" },
  { code: "BACK_PAIN",             label: "Back Pain" },
  { code: "REDUCED_FETAL_MOVEMENT",label: "Fetal Motion" },
  { code: "SWELLING",              label: "Swelling" },
  { code: "BLEEDING",              label: "Bleeding" },
  { code: "ABDOMINAL_PAIN",        label: "Abdominal Pain" },
  { code: "FATIGUE",               label: "Fatigue" },
];

const SEVERITIES: { key: Severity; label: string; color: string; bg: string }[] = [
  { key: "mild",     label: "Mild",     color: "#6DBF8C", bg: "rgba(109,191,140,0.10)" },
  { key: "moderate", label: "Moderate", color: "#F4A460", bg: "rgba(244,164,96,0.10)"  },
  { key: "severe",   label: "Severe",   color: "#E8697C", bg: "rgba(232,105,124,0.10)" },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function NewSymptomScreen() {
  const router        = useRouter();
  const { data: profile } = useProfile();
  const submitSymptom = useSubmitSymptom();

  const [selected, setSelected] = useState<string[]>([]);
  const [severity, setSeverity] = useState<Severity>("mild");
  const [notes, setNotes]       = useState("");

  function toggleSymptom(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    // Guard — must select at least one symptom
    if (selected.length === 0) {
      Alert.alert(
        "Select a symptom",
        "Please choose at least one symptom before saving."
      );
      return;
    }

    // Guard — need gestational week from profile
    const gestationalWeek = resolveCurrentGestationalWeek(profile);
    if (!gestationalWeek) {
      Alert.alert(
        "Week not set",
        "Please add your due date or last menstrual period in profile setup before logging symptoms."
      );
      return;
    }

    try {
      await submitSymptom.mutateAsync({
        symptoms: selected.map((code) => ({
          symptom_code:  code,
          symptom_label: SYMPTOMS.find((s) => s.code === code)?.label ?? code,
        })),
        severity,
        free_text_notes: notes.trim() || undefined,
        gestational_week: gestationalWeek,
        source: "manual",
      });

      // Success — go back to symptoms list
      Alert.alert(
        "Logged ✓",
        "Your symptoms have been saved. We're here with you.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      Alert.alert("Couldn't save", message);
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["rgba(255,251,247,0.92)", "rgba(255,244,239,0.68)"]}
        style={styles.bgOverlay}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.navy[700]} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>How are you feeling?</Text>
            <Text style={styles.subtitle}>
              Log your symptoms — every detail helps us support you better.
            </Text>
          </View>

          {/* Form card */}
          <View style={styles.formCard}>

            {/* Symptom chips */}
            <Text style={styles.label}>Select Symptoms</Text>
            <View style={styles.chips}>
              {SYMPTOMS.map((s) => {
                const active = selected.includes(s.code);
                return (
                  <TouchableOpacity
                    key={s.code}
                    onPress={() => toggleSymptom(s.code)}
                    style={[styles.chip, active && styles.chipActive]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Severity */}
            <Text style={[styles.label, { marginTop: 28 }]}>Severity</Text>
            <View style={styles.severityRow}>
              {SEVERITIES.map((s) => {
                const active = severity === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => setSeverity(s.key)}
                    style={[
                      styles.sevBtn,
                      active && { borderColor: s.color, backgroundColor: s.bg },
                    ]}
                    activeOpacity={0.8}
                  >
                    {/* Colour dot */}
                    <View style={[styles.sevDot, { backgroundColor: s.color }]} />
                    <Text
                      style={[
                        styles.sevText,
                        active && { color: s.color, fontWeight: "700" },
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notes */}
            <Text style={[styles.label, { marginTop: 28 }]}>Notes</Text>
            <TextInput
              style={styles.input}
              placeholder="Anything else we should know? Describe how you feel..."
              placeholderTextColor={colors.navy[300]}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />

            {/* Submit */}
            <TouchableOpacity
              style={[ctaButtonStyles.button, styles.submitBtn, submitSymptom.isPending && { opacity: 0.75 }]}
              onPress={handleSubmit}
              disabled={submitSymptom.isPending}
              activeOpacity={0.87}
            >
              <LinearGradient
                colors={ctaGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={ctaButtonStyles.gradient}
              >
                {submitSymptom.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={ctaButtonStyles.text}>Save Journal Entry</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.cancel}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:    { flex: 1 },
  bgOverlay: { flex: 1 },
  content: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 48,
  },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,251,247,0.92)",
    borderWidth: 1,
    borderColor: "rgba(140,90,82,0.18)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 20,
  },

  header: { marginBottom: 28 },
  title: { fontSize: 26, fontWeight: "700", color: "#4D3B39" },
  subtitle: { fontSize: 15, color: "#7B6A66", marginTop: 6, lineHeight: 22 },

  formCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 30,
    padding: 24,
    elevation: 10,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowColor: "#C97B6E",
    shadowOffset: { width: 0, height: 4 },
  },

  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8E5A54",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  // Symptom chips
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: colors.rose[100],
  },
  chipActive: {
    backgroundColor: "#C97B6E",
    borderColor: "#C97B6E",
  },
  chipText:       { color: colors.navy[400], fontSize: 14 },
  chipTextActive: { color: "#FFF", fontWeight: "700" },

  // Severity
  severityRow: { flexDirection: "row", gap: 10 },
  sevBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: colors.rose[100],
  },
  sevDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  sevText: { color: colors.navy[400], textTransform: "capitalize", fontSize: 14 },

  // Notes input
  input: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
    marginTop: 4,
    color: colors.navy[700],
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 1.5,
    borderColor: colors.rose[100],
  },

  // Submit
  submitBtn: {
    marginTop: 28,
  },

  // Cancel
  cancel: { marginTop: 16, alignItems: "center" },
  cancelText: { color: colors.navy[300], fontSize: 15 },
});