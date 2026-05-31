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
import { colors } from "@mumcare/ui";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

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

  function parseIsoDate(value: string): Date | null {
    const trimmed = value.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);

    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return null;
    }

    return parsed;
  }

  function isPastDate(date: Date): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return inputDate < today;
  }

  function handleEddChange(value: string) {
    setForm((prev) => ({ ...prev, edd: value }));

    const parsed = parseIsoDate(value);
    if (!parsed) {
      return;
    }

    if (isPastDate(parsed)) {
      setFormError("Estimated due date cannot be in the past.");
      return;
    }

    setFormError("");
  }

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

    const parsedEdd = parseIsoDate(edd);
    if (!parsedEdd) {
      setFormError("Estimated due date must be in YYYY-MM-DD format.");
      return;
    }

    if (isPastDate(parsedEdd)) {
      setFormError("Estimated due date cannot be in the past.");
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
        <ActivityIndicator size="large" color={colors.rose[500]} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
        <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.bgOverlay}>
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
                <Ionicons name="chevron-back" size={24} color={AUTH_UI.linkBerry} />
              </TouchableOpacity>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>
                  {isNotFound ? "Let's begin" : "Profile details"}
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
                <Ionicons name="alert-circle" size={18} color={AUTH_UI.redAlertText} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <View style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons name="person-circle-outline" size={24} color={AUTH_UI.linkBerry} />
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
                  <Text style={styles.label}>First name</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="person-outline" size={18} color={AUTH_UI.mutedIcon} />
                    <TextInput
                      style={styles.input}
                      value={form.firstName}
                      onChangeText={(v) => setForm({...form, firstName: v})}
                      placeholder="Sarah"
                      placeholderTextColor={AUTH_UI.textBlack}
                    />
                  </View>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Last name</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="person-outline" size={18} color={AUTH_UI.mutedIcon} />
                    <TextInput
                      style={styles.input}
                      value={form.lastName}
                      onChangeText={(v) => setForm({...form, lastName: v})}
                      placeholder="Thompson"
                      placeholderTextColor={AUTH_UI.textBlack}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.sectionDivider} />

              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons name="heart-outline" size={23} color={AUTH_UI.linkBerry} />
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
                  <Text style={styles.label}>Current week</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="calendar-clear-outline" size={18} color={AUTH_UI.mutedIcon} />
                    <TextInput
                      style={styles.input}
                      value={form.week}
                      onChangeText={(v) => setForm({...form, week: v})}
                      keyboardType="number-pad"
                      placeholder="24"
                      placeholderTextColor={AUTH_UI.textBlack}
                    />
                  </View>
                  <Text style={styles.fieldHint}>Enter a week from 1 to 42.</Text>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Date of birth</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="calendar-outline" size={18} color={AUTH_UI.mutedIcon} />
                    <TextInput
                      style={styles.input}
                      value={form.dob}
                      onChangeText={(v) => setForm({...form, dob: v})}
                      placeholder="1994-04-12"
                      placeholderTextColor={AUTH_UI.textBlack}
                    />
                  </View>
                  <Text style={styles.fieldHint}>Use YYYY-MM-DD.</Text>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Estimated due date</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="calendar-number-outline" size={18} color={AUTH_UI.mutedIcon} />
                  <TextInput
                    style={styles.input}
                    value={form.edd}
                    onChangeText={handleEddChange}
                    placeholder="2026-08-20"
                    placeholderTextColor={AUTH_UI.textBlack}
                  />
                </View>
                <Text style={styles.fieldHint}>
                  Use YYYY-MM-DD. Today or a future date only.
                </Text>
              </View>

              <TouchableOpacity
                style={[ctaButtonStyles.button, styles.submitBtn, isSaving && styles.submitBtnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <LinearGradient colors={ctaGradientColors} start={{x:0, y:0}} end={{x:1, y:0}} style={ctaButtonStyles.gradient}>
                  {isSaving ? (
                    <ActivityIndicator color={AUTH_UI.textWhite} />
                  ) : (
                    <>
                        <Text style={ctaButtonStyles.text}>Save changes</Text>
                      <Ionicons name="checkmark-circle-outline" size={20} color={AUTH_UI.textWhite} />
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
  screen: { flex: 1, backgroundColor: AUTH_UI.warmBackground },
  bgOverlay: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  contentWide: { width: "100%", maxWidth: 860, alignSelf: "center", paddingTop: 64 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: AUTH_UI.textWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: AUTH_UI.shadowBrown,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3
  },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 13, fontWeight: "700", color: AUTH_UI.textBlack, marginBottom: 7, fontFamily: FONT_FRIENDLY_SANS },
  title: { fontSize: 30, lineHeight: 36, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.5 },
  subtitle: { color: AUTH_UI.textBlack, fontSize: 16, lineHeight: 24, marginTop: 8, fontFamily: FONT_FRIENDLY_SANS },
  errorBox: { flexDirection: 'row', backgroundColor: AUTH_UI.redAlertBg, padding: 15, borderRadius: 15, marginBottom: 20, alignItems: 'center', gap: 10 },
  errorText: { flex: 1, color: AUTH_UI.redAlertText, fontSize: 14, fontWeight: '600', fontFamily: FONT_FRIENDLY_SANS },
  glassCard: {
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: AUTH_UI.cardRadius,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    shadowColor: AUTH_UI.shadowRose,
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
    backgroundColor: AUTH_UI.shadowRoseSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderCopy: { flex: 1 },
  cardTitle: { color: AUTH_UI.textHeading, fontSize: 22, fontWeight: "800", fontFamily: FONT_WARM_SERIF },
  cardHint: { color: AUTH_UI.textBlack, fontSize: 14, lineHeight: 21, marginTop: 3, fontFamily: FONT_FRIENDLY_SANS },
  sectionDivider: { height: 1, backgroundColor: AUTH_UI.borderTealSoft, marginVertical: 22 },
  row: { flexDirection: 'row', gap: 14 },
  rowStack: { flexDirection: "column" },
  field: { flex: 1, minWidth: 0, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: AUTH_UI.textBlack, marginBottom: 8, marginLeft: 2, fontFamily: FONT_FRIENDLY_SANS },
  inputShell: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: AUTH_UI.inputRadius,
    paddingHorizontal: AUTH_UI.fieldPaddingX,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200]
  },
  input: { flex: 1, minWidth: 0, paddingVertical: AUTH_UI.fieldPaddingY, fontSize: 16, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  fieldHint: { color: AUTH_UI.textBlack, fontSize: 13, lineHeight: 19, marginTop: 7, marginLeft: 2, fontFamily: FONT_FRIENDLY_SANS },
  submitBtn: { marginTop: 30 },
  submitBtnDisabled: { opacity: 0.72 },
});
