/**
 * mobile/app/onboarding/profile-setup.tsx
 * First-time profile setup after registration.
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
import { useCreateProfile } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";

import { getErrorMessage } from "@/lib/errors";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const createProfile = useCreateProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [dob, setDob]             = useState("");
  const [edd, setEdd]             = useState("");
  const [week, setWeek]           = useState("");
  const [error, setError]         = useState("");

  async function handleSubmit() {
    setError("");

    if (!firstName || !lastName || !dob || !edd || !week) {
      setError("Please fill in all required fields.");
      return;
    }

    const gestational_week = parseInt(week, 10);
    if (isNaN(gestational_week) || gestational_week < 4 || gestational_week > 42) {
      setError("Gestational week must be between 4 and 42.");
      return;
    }

    try {
      await createProfile.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob,
        estimated_due_date: edd,
        gestational_week,
      });
      router.replace("/tabs/home");
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Failed to save profile. Please try again.")
      );
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Tell us about yourself</Text>
      <Text style={styles.subtitle}>
        This helps us personalise your pregnancy companion
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.form}>
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>First name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Sarah"
              placeholderTextColor={colors.gray[400]}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Last name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Thompson"
              placeholderTextColor={colors.gray[400]}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>
        </View>

        <Text style={styles.label}>Date of birth * (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="1995-06-15"
          placeholderTextColor={colors.gray[400]}
          value={dob}
          onChangeText={setDob}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>Estimated due date * (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2026-08-20"
          placeholderTextColor={colors.gray[400]}
          value={edd}
          onChangeText={setEdd}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>Current gestational week *</Text>
        <TextInput
          style={styles.input}
          placeholder="24"
          placeholderTextColor={colors.gray[400]}
          value={week}
          onChangeText={setWeek}
          keyboardType="number-pad"
        />

        <TouchableOpacity
          style={[styles.button, createProfile.isPending && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={createProfile.isPending}
        >
          {createProfile.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Continue to MamaCare</Text>
          )}
        </TouchableOpacity>
      </View>
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
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
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
    marginBottom: spacing[8],
  },
  error: {
    backgroundColor: "#FCEBEB",
    color: "#A32D2D",
    padding: spacing[3],
    borderRadius: 8,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[4],
  },
  form: {
    gap: spacing[4],
  },
  row: {
    flexDirection: "row",
    gap: spacing[3],
  },
  half: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing[1],
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
  button: {
    backgroundColor: colors.rose[500],
    borderRadius: 12,
    paddingVertical: spacing[4],
    alignItems: "center",
    marginTop: spacing[4],
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
