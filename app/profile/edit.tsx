/**
 * mobile/app/profile/edit.tsx
 * Refined Edit Profile - High Depth UI
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
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";
import { Ionicons } from '@expo/vector-icons';
import { ApiRequestError, useCreateProfile, useProfile, useUpdateProfile } from "@mumcare/api";

export default function EditProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data: profile, isError, error, isPending } = useProfile();
  const updateProfile = useUpdateProfile();
  const createProfile = useCreateProfile();

  const isNotFound = isError && error instanceof ApiRequestError && error.isNotFound;
  const isSaving = createProfile.isPending || updateProfile.isPending;
  const isWide = Platform.OS === "web" && width >= 760;

  const [form, setForm] = useState({ firstName: "", lastName: "", week: "", edd: "", dob: "" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.first_name,
        lastName: profile.last_name,
        week: String(profile.gestational_week),
        edd: profile.estimated_due_date,
        dob: profile.date_of_birth,
      });
    }
  }, [profile]);

  async function handleSave() {
    setFormError("");
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const dob = form.dob.trim();
    const edd = form.edd.trim();
    const gestational_week = parseInt(form.week, 10);

    if (!firstName || !lastName || !dob || !edd) {
      setFormError("Please complete all profile fields.");
      return;
    }
    
    if (isNaN(gestational_week) || gestational_week < 1 || gestational_week > 42) {
      setFormError("Gestational week must be between 1 and 42.");
      return;
    }

    try {
      if (isNotFound) {
        await createProfile.mutateAsync({
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dob,
          gestational_week,
          estimated_due_date: edd,
        });
      } else {
        await updateProfile.mutateAsync({
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dob,
          gestational_week,
          estimated_due_date: edd,
        });
      }
      router.replace("/tabs/profile");
    } catch (err: any) {
      setFormError("Failed to save profile changes.");
    }
  }

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C97B6E" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
        <LinearGradient colors={["rgba(255,251,247,0.92)", "rgba(255,244,239,0.68)", "#FFFBF7"]} style={styles.bgOverlay}>
          <ScrollView
            contentContainerStyle={[styles.content, isWide && styles.contentWide]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.push("/tabs/profile")}
                style={styles.backBtn}
                activeOpacity={0.82}
              >
                <Ionicons name="chevron-back" size={24} color="#6D4A45" />
              </TouchableOpacity>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>
                  {isNotFound ? "LET'S BEGIN" : "PROFILE DETAILS"}
                </Text>
                <Text style={styles.title}>
                  {isNotFound ? "Create your care profile" : "Edit your care profile"}
                </Text>
                <Text style={styles.subtitle}>
                  Keep the essentials current so MumCare can support your week,
                  reminders, and pregnancy guidance with more care.
                </Text>
              </View>
            </View>

            {formError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#A32D2D" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <View style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons name="person-circle-outline" size={24} color="#8E5A54" />
                </View>
                <View style={styles.cardHeaderCopy}>
                  <Text style={styles.cardTitle}>About you</Text>
                  <Text style={styles.cardHint}>
                    These details stay private and help personalize your dashboard.
                  </Text>
                </View>
              </View>

              <View style={[styles.row, !isWide && styles.rowStack]}>
                <View style={styles.field}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="person-outline" size={18} color="#9AA2B4" />
                    <TextInput
                      style={styles.input}
                      value={form.firstName}
                      onChangeText={(v) => setForm({...form, firstName: v})}
                      placeholder="Sarah"
                      placeholderTextColor="#AEB5C4"
                    />
                  </View>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Last Name</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="person-outline" size={18} color="#9AA2B4" />
                    <TextInput
                      style={styles.input}
                      value={form.lastName}
                      onChangeText={(v) => setForm({...form, lastName: v})}
                      placeholder="Thompson"
                      placeholderTextColor="#AEB5C4"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.sectionDivider} />

              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons name="heart-outline" size={23} color="#8E5A54" />
                </View>
                <View style={styles.cardHeaderCopy}>
                  <Text style={styles.cardTitle}>Pregnancy timeline</Text>
                  <Text style={styles.cardHint}>
                    A few dates help MumCare show the right weekly context.
                  </Text>
                </View>
              </View>

              <View style={[styles.row, !isWide && styles.rowStack]}>
                <View style={styles.field}>
                  <Text style={styles.label}>Current Week</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="calendar-clear-outline" size={18} color="#9AA2B4" />
                    <TextInput
                      style={styles.input}
                      value={form.week}
                      onChangeText={(v) => setForm({...form, week: v})}
                      keyboardType="number-pad"
                      placeholder="24"
                      placeholderTextColor="#AEB5C4"
                    />
                  </View>
                  <Text style={styles.fieldHint}>Enter a week from 1 to 42.</Text>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Date of Birth</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="calendar-outline" size={18} color="#9AA2B4" />
                    <TextInput
                      style={styles.input}
                      value={form.dob}
                      onChangeText={(v) => setForm({...form, dob: v})}
                      placeholder="1994-04-12"
                      placeholderTextColor="#AEB5C4"
                    />
                  </View>
                  <Text style={styles.fieldHint}>Use YYYY-MM-DD.</Text>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Estimated Due Date</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="calendar-number-outline" size={18} color="#9AA2B4" />
                  <TextInput
                    style={styles.input}
                    value={form.edd}
                    onChangeText={(v) => setForm({...form, edd: v})}
                    placeholder="2026-08-20"
                    placeholderTextColor="#AEB5C4"
                  />
                </View>
                <Text style={styles.fieldHint}>
                  This can be adjusted later if your care team updates it.
                </Text>
              </View>

              <TouchableOpacity
                style={[ctaButtonStyles.button, styles.submitBtn, isSaving && styles.submitBtnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <LinearGradient colors={ctaGradientColors} start={{x:0, y:0}} end={{x:1, y:0}} style={ctaButtonStyles.gradient}>
                  {isSaving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={ctaButtonStyles.text}>Save Changes</Text>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8F4' },
  bgOverlay: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 22, paddingTop: 56, paddingBottom: 40 },
  contentWide: { width: "100%", maxWidth: 860, alignSelf: "center", paddingTop: 64 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#6A4039',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3
  },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: "800", color: "#8E5A54", letterSpacing: 1.2, marginBottom: 7 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "800", color: "#4D3B39" },
  subtitle: { color: "#667085", fontSize: 14, lineHeight: 20, marginTop: 8 },
  errorBox: { flexDirection: 'row', backgroundColor: '#FCEBEB', padding: 15, borderRadius: 15, marginBottom: 20, alignItems: 'center', gap: 10 },
  errorText: { flex: 1, color: '#A32D2D', fontSize: 13, fontWeight: '600' },
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.74)",
    shadowColor: '#C97B6E',
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "rgba(201,123,110,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderCopy: { flex: 1 },
  cardTitle: { color: "#4D3B39", fontSize: 18, fontWeight: "800" },
  cardHint: { color: "#667085", fontSize: 13, lineHeight: 18, marginTop: 3 },
  sectionDivider: { height: 1, backgroundColor: "rgba(154,162,180,0.18)", marginVertical: 22 },
  row: { flexDirection: 'row', gap: 14 },
  rowStack: { flexDirection: "column" },
  field: { flex: 1, minWidth: 0, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '800', color: '#6D4A45', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  inputShell: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(154,162,180,0.18)'
  },
  input: { flex: 1, minWidth: 0, paddingVertical: 14, fontSize: 16, color: '#4D3B39' },
  fieldHint: { color: "#8A93A6", fontSize: 12, lineHeight: 17, marginTop: 7, marginLeft: 4 },
  submitBtn: { marginTop: 30 },
  submitBtnDisabled: { opacity: 0.72 },
});
