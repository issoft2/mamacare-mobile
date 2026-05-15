/**
 * mobile/app/profile/edit.tsx
 *
 * PATCH /profile only works when a row already exists. If GET /profile returns
 * 404, we POST to create the profile first (same form; date of birth required).
 */

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ApiRequestError, useCreateProfile, useProfile, useUpdateProfile } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";

import { getErrorMessage } from "@/lib/errors";

export default function EditProfileScreen() {
  const router = useRouter();
  const { data: profile, isError, error, isPending } = useProfile();
  const updateProfile = useUpdateProfile();
  const createProfile = useCreateProfile();

  const isNotFound =
    isError && error instanceof ApiRequestError && error.isNotFound;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [week, setWeek] = useState("");
  const [edd, setEdd] = useState("");
  const [dob, setDob] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
      setWeek(String(profile.gestational_week));
      setEdd(profile.estimated_due_date);
      setDob(profile.date_of_birth);
    }
  }, [profile]);

  async function handleSave() {
    setFormError("");
    const gestational_week = parseInt(week, 10);
    if (isNaN(gestational_week) || gestational_week < 4 || gestational_week > 42) {
      setFormError("Gestational week must be between 4 and 42.");
      return;
    }
    if (isNotFound) {
      const d = dob.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        setFormError("Date of birth is required (YYYY-MM-DD).");
        return;
      }
      const eddTrim = edd.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(eddTrim)) {
        setFormError("Estimated due date is required (YYYY-MM-DD).");
        return;
      }
    }
    try {
      if (isNotFound) {
        await createProfile.mutateAsync({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dob.trim(),
          gestational_week,
          estimated_due_date: edd.trim(),
        });
      } else {
        await updateProfile.mutateAsync({
          first_name: firstName,
          last_name: lastName,
          gestational_week,
          estimated_due_date: edd,
        });
      }
      router.back();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to save profile."));
    }
  }

  const busy = createProfile.isPending || updateProfile.isPending;
  const loadFailed = isError && !isNotFound;

  if (isPending) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.rose[500]} />
      </View>
    );
  }

  if (loadFailed) {
    return (
      <View style={[styles.container, styles.centered, { padding: spacing[6] }]}>
        <Text style={styles.title}>Profile unavailable</Text>
        <Text style={styles.hint}>
          {getErrorMessage(error, "Could not load your profile. Try again later.")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isNotFound ? "Your profile" : "Edit profile"}</Text>
      {isNotFound ? (
        <Text style={styles.hint}>
          We don&apos;t have a profile on file yet. Fill in the details below to create
          one.
        </Text>
      ) : null}

      {formError ? <Text style={styles.error}>{formError}</Text> : null}

      <View style={styles.form}>
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>First name</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Last name</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
          </View>
        </View>

        <Text style={styles.label}>Gestational week</Text>
        <TextInput
          style={styles.input}
          value={week}
          onChangeText={setWeek}
          keyboardType="number-pad"
          placeholder="e.g. 24"
          placeholderTextColor={colors.gray[400]}
        />

        <Text style={styles.label}>Estimated due date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={edd}
          onChangeText={setEdd}
          placeholder="2026-08-20"
          placeholderTextColor={colors.gray[400]}
        />

        {isNotFound ? (
          <>
            <Text style={styles.label}>Date of birth (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={dob}
              onChangeText={setDob}
              placeholder="1990-01-15"
              placeholderTextColor={colors.gray[400]}
            />
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>
              {isNotFound ? "Create profile" : "Save changes"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancel} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.white },
  centered:   { justifyContent: "center", alignItems: "center" },
  content:    { padding: spacing[6], maxWidth: 480, alignSelf: "center", width: "100%" },
  title:      { fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.navy[700], marginBottom: spacing[2] },
  hint:       { fontSize: typography.fontSize.sm, color: colors.gray[600], marginBottom: spacing[4] },
  error:      { backgroundColor: "#FCEBEB", color: "#A32D2D", padding: spacing[3], borderRadius: 8, fontSize: typography.fontSize.sm, marginBottom: spacing[4] },
  form:       { gap: spacing[4] },
  row:        { flexDirection: "row", gap: spacing[3] },
  half:       { flex: 1 },
  label:      { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.gray[700], marginBottom: spacing[1] },
  input:      { borderWidth: 1, borderColor: colors.gray[200], borderRadius: 12, paddingHorizontal: spacing[4], paddingVertical: spacing[4], fontSize: typography.fontSize.base, color: colors.gray[900], backgroundColor: colors.gray[50] },
  button:     { backgroundColor: colors.rose[500], borderRadius: 12, paddingVertical: spacing[4], alignItems: "center", marginTop: spacing[4] },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
  cancel:     { alignItems: "center", paddingVertical: spacing[3] },
  cancelText: { color: colors.gray[400], fontSize: typography.fontSize.sm },
});
