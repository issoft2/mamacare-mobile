/**
 * mobile/app/profile/medical.tsx
 *
 * Medical profile screen — lets users add optional medical details after
 * onboarding. All fields are optional; users can save partial information
 * and come back later.
 *
 * Sensitive fields are encrypted server-side before being stored.
 */

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useProfile, useUpdateProfile } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";
import type { UpdateProfileRequest } from "@mamacare/types";
import { getErrorMessage } from "@/lib/errors";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const OPTIONAL_MEDICAL_FIELD_COUNT = 8;

function splitCsv(value: string): string[] | null {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

function parseOptionalNumber(
  label: string,
  value: string,
  min: number
): { value: number | null; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { value: null };
  const parsed = parseInt(trimmed, 10);
  if (Number.isNaN(parsed) || parsed < min) {
    return { value: null, error: `${label} must be ${min} or more.` };
  }
  return { value: parsed };
}

function validateOptionalDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "Use YYYY-MM-DD for the last menstrual period date.";
  }
  return null;
}

export default function MedicalProfileScreen() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  // Form state — initialized from profile when it loads
  const [bloodType, setBloodType] = useState("");
  const [lmpDate, setLmpDate] = useState("");
  const [gravida, setGravida] = useState("");
  const [parity, setParity] = useState("");
  const [allergiesText, setAllergiesText] = useState("");
  const [conditionsText, setConditionsText] = useState("");
  // const [nhsNumber, setNhsNumber] = useState("");
  // const [nhiaNumber, setNhiaNumber] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [autoSavingLabel, setAutoSavingLabel] = useState("");

  // Populate form when profile loads
  useEffect(() => {
    if (!profile) return;
    setBloodType(profile.blood_type ?? "");
    setLmpDate(profile.lmp_date ?? "");
    setGravida(profile.gravida != null ? String(profile.gravida) : "");
    setParity(profile.parity != null ? String(profile.parity) : "");
    setAllergiesText(profile.allergies?.join(", ") ?? "");
    setConditionsText(profile.known_conditions?.join(", ") ?? "");
    // setNhsNumber(profile.nhs_number ?? "");
    // setNhiaNumber(profile.nhia_number ?? "");
  }, [profile]);

  const completedCount = [
    bloodType,
    lmpDate,
    gravida,
    parity,
    splitCsv(allergiesText),
    splitCsv(conditionsText),
    // nhsNumber,
    // nhiaNumber,
  ].filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value != null && String(value).trim().length > 0;
  }).length;

  const completionPercent =
    (completedCount / OPTIONAL_MEDICAL_FIELD_COUNT) * 100;

  function buildFullPayload(): UpdateProfileRequest | null {
    const dateError = validateOptionalDate(lmpDate);
    if (dateError) {
      setError(dateError);
      return null;
    }

    const gravidaResult = parseOptionalNumber("Gravida", gravida, 1);
    if (gravidaResult.error) {
      setError(gravidaResult.error);
      return null;
    }

    const parityResult = parseOptionalNumber("Parity", parity, 0);
    if (parityResult.error) {
      setError(parityResult.error);
      return null;
    }

    return {
      blood_type: bloodType || null,
      lmp_date: lmpDate.trim() || null,
      gravida: gravidaResult.value,
      parity: parityResult.value,
      allergies: splitCsv(allergiesText),
      known_conditions: splitCsv(conditionsText),
      // nhs_number: nhsNumber.trim() || null,
      // nhia_number: nhiaNumber.trim() || null,
    };
  }

  async function savePartial(label: string, payload: UpdateProfileRequest) {
    if (!profile) return;
    setError("");
    setSuccessMessage("");
    setAutoSavingLabel(label);
    try {
      await updateProfile.mutateAsync(payload);
      setSuccessMessage(`${label} saved.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not save. Please try again."));
    } finally {
      setAutoSavingLabel("");
    }
  }

  async function handleSave() {
    setError("");
    setSuccessMessage("");

    const updates = buildFullPayload();
    if (!updates) return;

    try {
      await updateProfile.mutateAsync(updates);
      setSuccessMessage("Saved! Thank you for sharing.");
      // Brief delay so user sees success message, then return
      setTimeout(() => router.back(), 1200);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not save. Please try again."));
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.rose[500]} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Medical details</Text>
      <Text style={styles.subtitle}>
        These help us personalize your care. Every field is optional — skip
        anything you'd rather not share right now.
      </Text>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Profile completeness</Text>
          <Text style={styles.progressText}>
            {completedCount} of {OPTIONAL_MEDICAL_FIELD_COUNT} fields
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${completionPercent}%` as any },
            ]}
          />
        </View>
        <Text style={styles.progressHint}>
          Details save as you leave each field.
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {autoSavingLabel ? (
        <Text style={styles.saving}>Saving {autoSavingLabel}...</Text>
      ) : null}
      {successMessage ? (
        <Text style={styles.success}>{successMessage}</Text>
      ) : null}

      {/* ── Blood type ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Blood type</Text>
        <View style={styles.chipRow}>
          {BLOOD_TYPES.map((bt) => (
            <TouchableOpacity
              key={bt}
              style={[
                styles.chip,
                bloodType === bt && styles.chipActive,
              ]}
              onPress={() => {
                const next = bloodType === bt ? "" : bt;
                setBloodType(next);
                void savePartial("Blood type", { blood_type: next || null });
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Set blood type to ${bt}`}
            >
              <Text
                style={[
                  styles.chipText,
                  bloodType === bt && styles.chipTextActive,
                ]}
              >
                {bt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Pregnancy history ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Pregnancy history</Text>

        <Text style={styles.fieldLabel}>
          Total pregnancies (gravida)
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2"
          placeholderTextColor={colors.gray[400]}
          value={gravida}
          onChangeText={setGravida}
          onBlur={() => {
            const result = parseOptionalNumber("Gravida", gravida, 1);
            if (result.error) {
              setError(result.error);
              return;
            }
            void savePartial("Gravida", { gravida: result.value });
          }}
          keyboardType="number-pad"
        />
        <Text style={styles.fieldHint}>
          Including this one
        </Text>

        <Text style={[styles.fieldLabel, { marginTop: spacing[3] }]}>
          Previous births (parity)
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 1"
          placeholderTextColor={colors.gray[400]}
          value={parity}
          onChangeText={setParity}
          onBlur={() => {
            const result = parseOptionalNumber("Parity", parity, 0);
            if (result.error) {
              setError(result.error);
              return;
            }
            void savePartial("Parity", { parity: result.value });
          }}
          keyboardType="number-pad"
        />

        <Text style={[styles.fieldLabel, { marginTop: spacing[3] }]}>
          Last menstrual period (YYYY-MM-DD)
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2025-11-15"
          placeholderTextColor={colors.gray[400]}
          value={lmpDate}
          onChangeText={setLmpDate}
          onBlur={() => {
            const dateError = validateOptionalDate(lmpDate);
            if (dateError) {
              setError(dateError);
              return;
            }
            void savePartial("Last menstrual period", {
              lmp_date: lmpDate.trim() || null,
            });
          }}
          keyboardType="numbers-and-punctuation"
        />
      </View>

      {/* ── Health info ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Health information</Text>

        <Text style={styles.fieldLabel}>Allergies</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. peanuts, penicillin"
          placeholderTextColor={colors.gray[400]}
          value={allergiesText}
          onChangeText={setAllergiesText}
          onBlur={() =>
            void savePartial("Allergies", {
              allergies: splitCsv(allergiesText),
            })
          }
          multiline
        />
        <Text style={styles.fieldHint}>
          Separate multiple items with commas
        </Text>

        <Text style={[styles.fieldLabel, { marginTop: spacing[3] }]}>
          Known conditions
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. gestational diabetes, anemia"
          placeholderTextColor={colors.gray[400]}
          value={conditionsText}
          onChangeText={setConditionsText}
          onBlur={() =>
            void savePartial("Known conditions", {
              known_conditions: splitCsv(conditionsText),
            })
          }
          multiline
        />
        <Text style={styles.fieldHint}>
          Separate multiple items with commas
        </Text>
      </View>

      {/* ── Healthcare IDs ── */}
       
      {/* ── Actions ── */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          updateProfile.isPending && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={updateProfile.isPending}
        activeOpacity={0.85}
      >
        {updateProfile.isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Save details</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    paddingBottom: spacing[12],
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[700],
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    marginBottom: spacing[6],
    lineHeight: typography.fontSize.base * 1.5,
  },
  progressCard: {
    backgroundColor: colors.rose[50],
    borderColor: colors.rose[100],
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing[5],
    padding: spacing[4],
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  progressTitle: {
    color: colors.navy[700],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  progressText: {
    color: colors.rose[600],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  progressTrack: {
    backgroundColor: colors.white,
    borderRadius: 999,
    height: 7,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.rose[500],
    borderRadius: 999,
    height: "100%",
  },
  progressHint: {
    color: colors.gray[500],
    fontSize: typography.fontSize.xs,
    marginTop: spacing[2],
  },
  error: {
    backgroundColor: "#FCEBEB",
    color: "#A32D2D",
    padding: spacing[3],
    borderRadius: 8,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[4],
  },
  saving: {
    backgroundColor: colors.navy[50],
    color: colors.navy[600],
    padding: spacing[3],
    borderRadius: 8,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[4],
  },
  success: {
    backgroundColor: "#E6F4EA",
    color: "#1E7E34",
    padding: spacing[3],
    borderRadius: 8,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[4],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.rose[500],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing[1],
  },
  fieldHint: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    marginTop: spacing[1],
    fontStyle: "italic",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    backgroundColor: colors.gray[50],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 20,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    ...Platform.select({
      web: { /* @ts-ignore */ cursor: "pointer" },
    }),
  },
  chipActive: {
    backgroundColor: colors.rose[500],
    borderColor: colors.rose[500],
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontWeight: typography.fontWeight.medium,
  },
  chipTextActive: {
    color: colors.white,
  },
  saveButton: {
    backgroundColor: colors.rose[500],
    borderRadius: 12,
    paddingVertical: spacing[4],
    alignItems: "center",
    marginTop: spacing[4],
    ...Platform.select({
      web: { /* @ts-ignore */ cursor: "pointer" },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  cancelButton: {
    paddingVertical: spacing[3],
    alignItems: "center",
    marginTop: spacing[2],
    ...Platform.select({
      web: { /* @ts-ignore */ cursor: "pointer" },
    }),
  },
  cancelButtonText: {
    color: colors.gray[500],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
});
