/**
 * mobile/app/profile/medical.tsx
 *
 * Medical profile screen — lets users add optional medical details after
 * onboarding. All fields are optional and auto-save when the user leaves
 * a field, so nothing is ever lost.
 *
 * Sensitive fields are encrypted server-side before being stored.
 *
 * Designed with emotional UX principles:
 *  - Soft cream background reduces visual stress
 *  - Conversational copy (no medical jargon)
 *  - Auto-save removes "I'll lose this" anxiety
 *  - Affirming feedback after each save
 *  - Date picker instead of free-text date entry
 *  - No "save" button — auto-save handles it
 */

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { useProfile, useUpdateProfile } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";
import type { UpdateProfileRequest } from "@mamacare/types";
import { getErrorMessage } from "@/lib/errors";

// ── Constants ────────────────────────────────────────────────────────────────

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const OPTIONAL_FIELD_COUNT = 6;
const CREAM = "#FFF8F4";

// ── Helpers ──────────────────────────────────────────────────────────────────

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
    return { value: null, error: `${label} should be ${min} or more.` };
  }
  return { value: parsed };
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateFriendly(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getProgressMessage(completed: number, total: number): string {
  if (completed === 0) {
    return "Share whatever feels comfortable.";
  }
  if (completed === total) {
    return "All done — thank you for sharing.";
  }
  if (completed === 1) {
    return "Thank you for sharing this.";
  }
  return `You've shared ${completed} things — thank you.`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MedicalProfileScreen() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  // Form state
  const [bloodType, setBloodType] = useState("");
  const [lmpDate, setLmpDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gravida, setGravida] = useState("");
  const [parity, setParity] = useState("");
  const [allergiesText, setAllergiesText] = useState("");
  const [conditionsText, setConditionsText] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [savedField, setSavedField] = useState("");
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
  }, [profile]);

  const completedCount = [
    bloodType,
    lmpDate,
    gravida,
    parity,
    splitCsv(allergiesText),
    splitCsv(conditionsText),
  ].filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value != null && String(value).trim().length > 0;
  }).length;

  const completionPercent = (completedCount / OPTIONAL_FIELD_COUNT) * 100;

  async function savePartial(label: string, payload: UpdateProfileRequest) {
    if (!profile) return;
    setError("");
    setAutoSavingLabel(label);
    try {
      await updateProfile.mutateAsync(payload);
      setSavedField(label);
      // Clear the "saved" feedback after a moment
      setTimeout(() => setSavedField(""), 2000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Couldn't save right now."));
    } finally {
      setAutoSavingLabel("");
    }
  }

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (event.type === "dismissed") {
      return;
    }
    if (selectedDate) {
      const iso = formatDateISO(selectedDate);
      setLmpDate(iso);
      void savePartial("Last menstrual period", { lmp_date: iso });
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.navy[700]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>A little more about you</Text>
        <Text style={styles.subtitle}>
          Sharing helps us personalize your care. Every field is optional —
          skip anything you'd rather not share right now.
        </Text>

        {/* ── Progress card ── */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              {getProgressMessage(completedCount, OPTIONAL_FIELD_COUNT)}
            </Text>
            <Text style={styles.progressText}>
              {completedCount} of {OPTIONAL_FIELD_COUNT}
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
            Your changes save as you go.
          </Text>
        </View>

        {/* Status banners */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle"
              size={18}
              color="#A32D2D"
              style={{ marginRight: spacing[2] }}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {autoSavingLabel ? (
          <View style={styles.savingBanner}>
            <ActivityIndicator
              size="small"
              color={colors.navy[500]}
              style={{ marginRight: spacing[2] }}
            />
            <Text style={styles.savingText}>Saving {autoSavingLabel}…</Text>
          </View>
        ) : null}
        {savedField && !autoSavingLabel ? (
          <View style={styles.successBanner}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#1E7E34"
              style={{ marginRight: spacing[2] }}
            />
            <Text style={styles.successText}>{savedField} saved</Text>
          </View>
        ) : null}

        {/* ── Blood type ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your blood type</Text>
          <Text style={styles.sectionHint}>
            Good to know in case of emergencies.
          </Text>
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
                  void savePartial("Blood type", {
                    blood_type: next || null,
                  });
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

        {/* ── About your pregnancy ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About your pregnancy</Text>
          <Text style={styles.sectionHint}>
            Even a rough idea helps. Skip if you're not sure.
          </Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Total pregnancies</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2"
              placeholderTextColor={colors.gray[400]}
              value={gravida}
              onChangeText={setGravida}
              onBlur={() => {
                const result = parseOptionalNumber("Total pregnancies", gravida, 1);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                void savePartial("Total pregnancies", {
                  gravida: result.value,
                });
              }}
              keyboardType="number-pad"
            />
            <Text style={styles.fieldHint}>Including this one</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Previous births</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1"
              placeholderTextColor={colors.gray[400]}
              value={parity}
              onChangeText={setParity}
              onBlur={() => {
                const result = parseOptionalNumber("Previous births", parity, 0);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                void savePartial("Previous births", { parity: result.value });
              }}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              First day of your last period
            </Text>
            <Pressable
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Pick last menstrual period date"
            >
              <Text
                style={[
                  styles.dateText,
                  !lmpDate && styles.datePlaceholder,
                ]}
              >
                {lmpDate ? formatDateFriendly(lmpDate) : "Tap to choose a date"}
              </Text>
            </Pressable>
            {showDatePicker ? (
              <DateTimePicker
                value={lmpDate ? new Date(lmpDate) : new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            ) : null}
            <Text style={styles.fieldHint}>
              Helps us track gestational timing.
            </Text>
          </View>
        </View>

        {/* ── Health info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Anything we should know?</Text>
          <Text style={styles.sectionHint}>
            Sharing helps us guide you better. Separate items with commas.
          </Text>

          <View style={styles.field}>
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
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Known conditions</Text>
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
          </View>
        </View>

        {/* Done — no Save button since auto-save handles it */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CREAM,
  },

  // Header
  header: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[2],
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
  },

  // Content
  content: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },

  // Titles
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[700],
    marginBottom: spacing[2],
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.navy[500],
    marginBottom: spacing[5],
    lineHeight: typography.fontSize.base * 1.5,
  },

  // Progress card
  progressCard: {
    backgroundColor: colors.white,
    borderColor: colors.rose[100],
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing[5],
    padding: spacing[4],
  },
  progressHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  progressTitle: {
    flex: 1,
    color: colors.navy[700],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  progressText: {
    color: colors.rose[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  progressTrack: {
    backgroundColor: colors.rose[50],
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.rose[500],
    borderRadius: 999,
    height: "100%",
  },
  progressHint: {
    color: colors.navy[400],
    fontSize: typography.fontSize.xs,
    marginTop: spacing[2],
    fontStyle: "italic",
  },

  // Status banners
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCEBEB",
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  errorText: {
    flex: 1,
    color: "#A32D2D",
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  savingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.rose[100],
  },
  savingText: {
    color: colors.navy[600],
    fontSize: typography.fontSize.sm,
    fontStyle: "italic",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F4EA",
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  successText: {
    color: "#1E7E34",
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },

  // Section
  section: {
    marginBottom: spacing[7],
  },
  sectionLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy[700],
    marginBottom: spacing[1],
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: typography.fontSize.sm,
    color: colors.navy[400],
    marginBottom: spacing[4],
    lineHeight: typography.fontSize.sm * 1.5,
    fontStyle: "italic",
  },

  // Field
  field: {
    marginBottom: spacing[4],
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.navy[600],
    marginBottom: spacing[2],
  },
  fieldHint: {
    fontSize: typography.fontSize.xs,
    color: colors.navy[400],
    marginTop: spacing[2],
    fontStyle: "italic",
    lineHeight: typography.fontSize.xs * 1.5,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.rose[100],
    borderRadius: 16,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.navy[700],
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  // Date input
  dateText: {
    fontSize: typography.fontSize.base,
    color: colors.navy[700],
  },
  datePlaceholder: {
    color: colors.gray[400],
  },

  // Blood type chips
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rose[100],
    minWidth: 56,
    alignItems: "center",
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
    color: colors.navy[600],
    fontWeight: typography.fontWeight.medium,
  },
  chipTextActive: {
    color: colors.white,
  },

  // Done button
  doneButton: {
    backgroundColor: colors.rose[500],
    borderRadius: 20,
    paddingVertical: spacing[4],
    alignItems: "center",
    marginTop: spacing[4],
    ...Platform.select({
      ios: {
        shadowColor: colors.rose[400],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      web: {
        // @ts-ignore
        cursor: "pointer",
        // @ts-ignore
        boxShadow: "0px 4px 12px rgba(244, 114, 182, 0.25)",
      },
    }),
  },
  doneButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
});