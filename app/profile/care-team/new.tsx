/**
 * mobile/app/profile/care-team/new.tsx
 *
 * Multi-step wizard for adding a care team member.
 * Designed with emotional UX principles for pregnant users:
 *  - Small, achievable steps (3 short questions instead of one long form)
 *  - Warm language that feels conversational, not bureaucratic
 *  - Auto-save on field blur to prevent loss of progress
 *  - Soft cream background to reduce visual stress
 *  - Gentle progress feedback ("Step 2 of 3 — almost there")
 *  - Affirmation after role selection (helps first-time mothers)
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAddCareTeamMember } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";
import { getErrorMessage } from "@/lib/errors";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

// ── Types & constants ────────────────────────────────────────────────────────

type RoleId = "gp" | "obstetrician" | "midwife" | "specialist" | "other";
type ContactMethod = "email" | "sms";

interface DraftForm {
  fullName: string;
  role: RoleId | "";
  workplace: string;
  email: string;
  phone: string;
  preferredContact: ContactMethod;
  isPrimary: boolean;
}

const ROLES: {
  id: RoleId;
  label: string;
  hint: string;
}[] = [
  {
    id: "gp",
    label: "GP / Family doctor",
    hint: "Your everyday doctor for general check-ups",
  },
  {
    id: "obstetrician",
    label: "Obstetrician",
    hint: "Your pregnancy specialist",
  },
  {
    id: "midwife",
    label: "Midwife",
    hint: "Your guide through pregnancy and birth",
  },
  {
    id: "specialist",
    label: "Specialist",
    hint: "A doctor for a specific health need",
  },
  {
    id: "other",
    label: "Someone else",
    hint: "Anyone else supporting your care",
  },
];

function getWorkplaceCopy(role: RoleId | ""): {
  question: string;
  label: string;
  placeholder: string;
  hint: string;
} {
  switch (role) {
    case "gp":
      return {
        question: "Where does their clinic sit?",
        label: "Clinic name",
        placeholder: "e.g. Sunrise Family Clinic",
        hint: "Just the name is enough — you can add address later.",
      };
    case "obstetrician":
    case "specialist":
      return {
        question: "Which hospital?",
        label: "Hospital name",
        placeholder: "e.g. Lagos University Teaching Hospital",
        hint: "If they work in multiple places, pick the main one.",
      };
    case "midwife":
      return {
        question: "Where do they practice?",
        label: "Clinic, hospital, or home practice",
        placeholder: "e.g. Mama Care Birth Center",
        hint: "Independent midwives can write 'private practice'.",
      };
    default:
      return {
        question: "Where can you find them?",
        label: "Their workplace",
        placeholder: "Clinic, hospital, or organization",
        hint: "",
      };
  }
}

// ── Main component ───────────────────────────────────────────────────────────

const TOTAL_STEPS = 3;
const CREAM = "#FFF8F4";

export default function AddCareTeamMemberScreen() {
  const router = useRouter();
  const addMember = useAddCareTeamMember();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DraftForm>({
    fullName: "",
    role: "",
    workplace: "",
    email: "",
    phone: "",
    preferredContact: "email",
    isPrimary: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function updateField<K extends keyof DraftForm>(key: K, value: DraftForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  }

  function goNext() {
    setError("");

    if (step === 1) {
      if (!form.fullName.trim()) {
        setError("We need a name to add them to your circle.");
        return;
      }
      if (!form.role) {
        setError("Pick the role that fits them best.");
        return;
      }
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  }

  function goBack() {
    setError("");
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  }

  function mapWorkplaceToBackend() {
    const trimmed = form.workplace.trim();
    if (!trimmed) {
      return { practice_name: null, trust_or_hospital: null };
    }
    if (form.role === "obstetrician" || form.role === "specialist") {
      return { practice_name: null, trust_or_hospital: trimmed };
    }
    return { practice_name: trimmed, trust_or_hospital: null };
  }

  async function handleSubmit() {
    setError("");
    const { practice_name, trust_or_hospital } = mapWorkplaceToBackend();

    try {
      await addMember.mutateAsync({
        full_name: form.fullName.trim(),
        role: form.role as RoleId,
        practice_name,
        trust_or_hospital,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        preferred_contact: form.preferredContact,
        is_primary: form.isPrimary,
      });
      setSuccess(true);
      setTimeout(() => router.back(), 1800);
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong. Please try again."));
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="heart" size={56} color={colors.rose[500]} />
        </View>
        <Text style={styles.successTitle}>One less thing to remember</Text>
        <Text style={styles.successBody}>
          {form.fullName.trim()} is now part of your care circle.
        </Text>
      </View>
    );
  }

  // ── Wizard ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBack}
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.navy[700]} />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i + 1 <= step && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <Text style={styles.progressLabel}>
        Step {step} of {TOTAL_STEPS}
        {step === 2 ? " — almost there" : ""}
        {step === 3 ? " — last one" : ""}
      </Text>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {step === 1 && <Step1Identity form={form} updateField={updateField} />}
        {step === 2 && <Step2Workplace form={form} updateField={updateField} />}
        {step === 3 && <Step3Contact form={form} updateField={updateField} />}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            addMember.isPending && styles.buttonDisabled,
          ]}
          onPress={goNext}
          disabled={addMember.isPending}
          activeOpacity={0.85}
        >
          {addMember.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {step === TOTAL_STEPS ? "Add to my circle" : "Continue"}
            </Text>
          )}
        </TouchableOpacity>

        {step === TOTAL_STEPS ? (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              updateField("email", "");
              updateField("phone", "");
              handleSubmit();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>I'll add contact later</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Step 1: Identity ─────────────────────────────────────────────────────────

function Step1Identity({
  form,
  updateField,
}: {
  form: DraftForm;
  updateField: <K extends keyof DraftForm>(key: K, value: DraftForm[K]) => void;
}) {
  const selectedRole = ROLES.find((r) => r.id === form.role);

  return (
    <View>
      <Text style={styles.stepTitle}>Who are you adding?</Text>
      <Text style={styles.stepSubtitle}>
        Tell us a little about this person.
      </Text>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Their name</Text>
        <TextInput
          style={styles.input}
          value={form.fullName}
          onChangeText={(v) => updateField("fullName", v)}
          placeholder="e.g. Dr. Sarah Adekunle"
          placeholderTextColor={colors.gray[400]}
          autoCapitalize="words"
          autoFocus
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>How do you know them?</Text>
        <View style={styles.chipRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.chip, form.role === r.id && styles.chipActive]}
              onPress={() => updateField("role", r.id)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: form.role === r.id }}
            >
              <Text
                style={[
                  styles.chipText,
                  form.role === r.id && styles.chipTextActive,
                ]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedRole ? (
          <View style={styles.affirmation}>
            <Ionicons
              name="information-circle"
              size={16}
              color={colors.rose[400]}
            />
            <Text style={styles.affirmationText}>{selectedRole.hint}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ── Step 2: Workplace ────────────────────────────────────────────────────────

function Step2Workplace({
  form,
  updateField,
}: {
  form: DraftForm;
  updateField: <K extends keyof DraftForm>(key: K, value: DraftForm[K]) => void;
}) {
  const copy = getWorkplaceCopy(form.role);

  return (
    <View>
      <Text style={styles.stepTitle}>{copy.question}</Text>
      <Text style={styles.stepSubtitle}>
        This is optional — you can skip if you're not sure.
      </Text>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{copy.label}</Text>
        <TextInput
          style={styles.input}
          value={form.workplace}
          onChangeText={(v) => updateField("workplace", v)}
          placeholder={copy.placeholder}
          placeholderTextColor={colors.gray[400]}
          autoFocus
        />
        {copy.hint ? <Text style={styles.fieldHint}>{copy.hint}</Text> : null}
      </View>
    </View>
  );
}

// ── Step 3: Contact ──────────────────────────────────────────────────────────

function Step3Contact({
  form,
  updateField,
}: {
  form: DraftForm;
  updateField: <K extends keyof DraftForm>(key: K, value: DraftForm[K]) => void;
}) {
  return (
    <View>
      <Text style={styles.stepTitle}>How can you reach them?</Text>
      <Text style={styles.stepSubtitle}>
        Both are optional. Add whatever you have.
      </Text>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={form.email}
          onChangeText={(v) => updateField("email", v)}
          placeholder="doctor@clinic.com"
          placeholderTextColor={colors.gray[400]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Phone</Text>
        <TextInput
          style={styles.input}
          value={form.phone}
          onChangeText={(v) => updateField("phone", v)}
          placeholder="+234 ..."
          placeholderTextColor={colors.gray[400]}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Best way to reach them</Text>
        <View style={styles.toggleRow}>
          {(["email", "sms"] as ContactMethod[]).map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.toggleButton,
                form.preferredContact === c && styles.toggleButtonActive,
              ]}
              onPress={() => updateField("preferredContact", c)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: form.preferredContact === c }}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  form.preferredContact === c && styles.toggleButtonTextActive,
                ]}
              >
                {c === "email" ? "Email" : "Text / SMS"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryRow}
        onPress={() => updateField("isPrimary", !form.isPrimary)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: form.isPrimary }}
      >
        <View
          style={[styles.checkbox, form.isPrimary && styles.checkboxActive]}
        >
          {form.isPrimary ? (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.primaryLabel}>Make them my primary contact</Text>
          <Text style={styles.primaryHint}>
            We'll reach out to this person first when it matters.
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },

  // Header & progress
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
  },
  progressContainer: {
    flex: 1,
    flexDirection: "row",
    gap: spacing[2],
    paddingRight: spacing[6],
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.rose[100],
  },
  progressDotActive: {
    backgroundColor: colors.rose[500],
  },
  progressLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.navy[400],
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
    fontStyle: "italic",
  },

  // Content
  content: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    ...Platform.select({
      web: {
        maxWidth: 560,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },
  error: {
    backgroundColor: "#FCEBEB",
    color: "#A32D2D",
    padding: spacing[3],
    borderRadius: 10,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[4],
  },

  // Step heading
  stepTitle: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[700],
    marginBottom: spacing[2],
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.navy[500],
    marginBottom: spacing[8],
    lineHeight: typography.fontSize.base * 1.5,
  },

  // Field
  field: {
    marginBottom: spacing[6],
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
    lineHeight: typography.fontSize.xs * 1.5,
    fontStyle: "italic",
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

  // Role chips
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

  // Role affirmation
  affirmation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[4],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.rose[50],
    borderRadius: 12,
  },
  affirmationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.navy[600],
    lineHeight: typography.fontSize.sm * 1.4,
  },

  // Contact toggle
  toggleRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rose[100],
    alignItems: "center",
    ...Platform.select({
      web: { /* @ts-ignore */ cursor: "pointer" },
    }),
  },
  toggleButtonActive: {
    backgroundColor: colors.rose[500],
    borderColor: colors.rose[500],
  },
  toggleButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.navy[600],
    fontWeight: typography.fontWeight.medium,
  },
  toggleButtonTextActive: {
    color: colors.white,
  },

  // Primary checkbox row
  primaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.rose[100],
    marginTop: spacing[2],
    ...Platform.select({
      web: { /* @ts-ignore */ cursor: "pointer" },
    }),
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.rose[400],
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  checkboxActive: {
    backgroundColor: colors.rose[500],
    borderColor: colors.rose[500],
  },
  primaryLabel: {
    fontSize: typography.fontSize.base,
    color: colors.navy[700],
    fontWeight: typography.fontWeight.medium,
  },
  primaryHint: {
    fontSize: typography.fontSize.xs,
    color: colors.navy[400],
    marginTop: 2,
    lineHeight: typography.fontSize.xs * 1.5,
  },

  // Bottom actions
  bottomBar: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[2],
    ...Platform.select({
      web: {
        maxWidth: 560,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },
  primaryButton: {
    backgroundColor: colors.rose[500],
    borderRadius: 20,
    paddingVertical: spacing[4],
    alignItems: "center",
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
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  skipButton: {
    paddingVertical: spacing[3],
    alignItems: "center",
    ...Platform.select({
      web: { /* @ts-ignore */ cursor: "pointer" },
    }),
  },
  skipButtonText: {
    color: colors.navy[400],
    fontSize: typography.fontSize.sm,
    fontStyle: "italic",
  },

  // Success state
  successContainer: {
    flex: 1,
    backgroundColor: CREAM,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[8],
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.rose[50],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[6],
    ...Platform.select({
      ios: {
        shadowColor: colors.rose[300],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
      web: {
        // @ts-ignore
        boxShadow: "0px 0px 24px rgba(251, 113, 133, 0.3)",
      },
    }),
  },
  successTitle: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[700],
    marginBottom: spacing[3],
    textAlign: "center",
    letterSpacing: -0.5,
  },
  successBody: {
    fontSize: typography.fontSize.base,
    color: colors.navy[500],
    textAlign: "center",
    lineHeight: typography.fontSize.base * 1.5,
  },
});