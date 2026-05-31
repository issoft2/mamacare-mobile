/**
 * mobile/app/symptoms/new.tsx
 * High Depth Symptom Form — with working submit logic
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

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
  { key: "mild",     label: "Mild",     color: AUTH_UI.semanticMild, bg: AUTH_UI.semanticMildBgSoft },
  { key: "moderate", label: "Moderate", color: AUTH_UI.semanticModerate, bg: AUTH_UI.semanticModerateBgSoft  },
  { key: "severe",   label: "Severe",   color: colors.rose[500], bg: AUTH_UI.semanticSevereBgSoft },
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
        [{ text: "OK", onPress: () => router.push("/tabs/symptoms") }]
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
        colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]}
        style={styles.bgOverlay}
      >
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
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
            <Text style={styles.title}>How are you feeling today?</Text>
            <Text style={styles.subtitle}>
              Log your symptoms — every detail helps us support you better.
            </Text>
          </View>

          {/* Form card */}
          <View style={styles.formCard}>

            {/* Symptom chips */}
            <Text style={styles.label}>Select symptoms</Text>
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
              placeholderTextColor={AUTH_UI.textWarmMuted}
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
                  <ActivityIndicator color={AUTH_UI.textWhite} />
                ) : (
                  <Text style={ctaButtonStyles.text}>Save journal entry</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              onPress={() => router.push("/tabs/symptoms")}
              style={styles.cancel}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: AUTH_UI.cream },
  bgOverlay: { flex: 1 },
  keyboardContainer: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 96,
  },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: AUTH_UI.overlayStart,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    justifyContent: "center", alignItems: "center",
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: AUTH_UI.shadowBrown,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },

  header: { marginBottom: 28 },
  title: { fontSize: 30, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.6 },
  subtitle: { fontSize: 16, color: AUTH_UI.textBlack, marginTop: 8, lineHeight: 24, fontFamily: FONT_FRIENDLY_SANS },

  formCard: {
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: AUTH_UI.cardRadius,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
    elevation: 8,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowColor: colors.rose[500],
    shadowOffset: { width: 0, height: 4 },
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: AUTH_UI.textBlack,
    marginBottom: 12,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  // Symptom chips
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: AUTH_UI.inputRadius,
    backgroundColor: AUTH_UI.textWhite,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
  },
  chipActive: {
    backgroundColor: colors.rose[500],
    borderColor: colors.rose[500],
  },
  chipText:       { color: AUTH_UI.textBlack, fontSize: 14, fontFamily: FONT_FRIENDLY_SANS },
  chipTextActive: { color: AUTH_UI.textWhite, fontWeight: "700", fontFamily: FONT_FRIENDLY_SANS },

  // Severity
  severityRow: { flexDirection: "row", gap: 10 },
  sevBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: AUTH_UI.inputRadius,
    backgroundColor: AUTH_UI.textWhite,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
  },
  sevDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  sevText: { color: AUTH_UI.textBlack, textTransform: "capitalize", fontSize: 14, fontFamily: FONT_FRIENDLY_SANS },

  // Notes input
  input: {
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: 16,
    paddingHorizontal: AUTH_UI.fieldPaddingX,
    paddingVertical: AUTH_UI.fieldPaddingY,
    minHeight: 110,
    marginTop: 4,
    color: AUTH_UI.textBlack,
    fontSize: 16,
    lineHeight: 22,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    fontFamily: FONT_FRIENDLY_SANS,
  },

  // Submit
  submitBtn: {
    marginTop: 28,
  },

  // Cancel
  cancel: { marginTop: 16, alignItems: "center" },
  cancelText: { color: AUTH_UI.linkBerry, fontSize: 16, fontWeight: "700", fontFamily: FONT_FRIENDLY_SANS },
});