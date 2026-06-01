/**
 * mobile/app/profile/appointments/new.tsx
 * Add appointment form
 */

import { useRouter } from "expo-router";
import { useMemo, useState, useEffect } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { ctaButtonStyles, ctaGradientColors } from "../../../components/styles/ctaButton";
import { useCreateAppointment, useProfile } from "@mumcare/api";
import promptFinishOnboarding from "@/lib/onboardingPrompt";
import { colors } from "@mumcare/ui";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

const APPOINTMENT_TYPES = [
  "Antenatal Check-up",
  "Ultrasound",
  "Lab Test",
  "Consultation",
  "Vaccination",
  "Other",
] as const;

function toLocalDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocalTimeInput(date: Date): string {
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
}

function buildLocalIso(dateValue: string, timeValue: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return null;
  if (!/^\d{2}:\d{2}$/.test(timeValue)) return null;
  const combined = new Date(`${dateValue}T${timeValue}:00`);
  if (Number.isNaN(combined.getTime())) return null;
  return combined.toISOString();
}

export default function AddAppointmentScreen() {
  const router = useRouter();
  const createAppointment = useCreateAppointment();
  const { data: profile } = useProfile();
  const hasCompletedOnboarding = Boolean(profile);
  const onboardingRedirectPath = "/onboarding/profile-setup";

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      promptFinishOnboarding(router);
    }
  }, [hasCompletedOnboarding, router]);

  const initialDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  const [appointmentType, setAppointmentType] = useState<string>(APPOINTMENT_TYPES[0]);
  const [dateValue, setDateValue] = useState(toLocalDateInput(initialDate));
  const [timeValue, setTimeValue] = useState(toLocalTimeInput(initialDate));
  const [location, setLocation] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSave = async () => {
    setErrorText(null);
    const scheduledAt = buildLocalIso(dateValue, timeValue);

    if (!scheduledAt) {
      setErrorText("Please enter a valid date and time.");
      return;
    }

    if (new Date(scheduledAt) < new Date()) {
      setErrorText("Appointment must be in the future.");
      return;
    }

    try {
      await createAppointment.mutateAsync({
        appointment_type: appointmentType,
        scheduled_at: scheduledAt,
        location: location.trim() ? location.trim() : null,
      });
      router.replace("/profile/appointments");
    } catch (error) {
      console.error("Failed to create appointment:", error);
      setErrorText("We could not save this appointment. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.bgOverlay}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={AUTH_UI.textHeading} />
            </TouchableOpacity>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Care planning</Text>
              <Text style={styles.title}>Add appointment</Text>
              <Text style={styles.subtitle}>Set your next visit so it appears on Home and in your upcoming list.</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Appointment type</Text>
            <View style={styles.chipWrap}>
              {APPOINTMENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, appointmentType === type && styles.typeChipActive]}
                  onPress={() => setAppointmentType(type)}
                  activeOpacity={0.88}
                >
                  <Text style={[styles.typeChipText, appointmentType === type && styles.typeChipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={dateValue}
              onChangeText={setDateValue}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="2026-06-03"
              placeholderTextColor={AUTH_UI.textWarmMuted}
            />

            <Text style={styles.label}>Time (HH:MM)</Text>
            <TextInput
              style={styles.input}
              value={timeValue}
              onChangeText={setTimeValue}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="09:30"
              placeholderTextColor={AUTH_UI.textWarmMuted}
            />

            <Text style={styles.label}>Location (optional)</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Clinic or hospital"
              placeholderTextColor={AUTH_UI.textWarmMuted}
            />

            {errorText && <Text style={styles.errorText}>{errorText}</Text>}

            <TouchableOpacity
              style={[ctaButtonStyles.button, styles.saveBtn, createAppointment.isPending && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={createAppointment.isPending}
              activeOpacity={0.88}
            >
              <LinearGradient colors={ctaGradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ctaButtonStyles.gradient}>
                {createAppointment.isPending ? (
                  <ActivityIndicator color={AUTH_UI.textWhite} />
                ) : (
                  <>
                    <Ionicons name="calendar-outline" size={18} color={AUTH_UI.textWhite} />
                    <Text style={ctaButtonStyles.text}>Save appointment</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_UI.cream },
  bgOverlay: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 96 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 24 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AUTH_UI.textWhite,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    elevation: 2,
  },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 13, fontWeight: "700", color: AUTH_UI.textBlack, marginBottom: 6, fontFamily: FONT_FRIENDLY_SANS },
  title: { fontSize: 30, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.5 },
  subtitle: { marginTop: 8, fontSize: 16, lineHeight: 24, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  formCard: {
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: AUTH_UI.cardRadius,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: AUTH_UI.textBlack,
    marginTop: 10,
    marginBottom: 8,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: AUTH_UI.textWhite,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
  },
  typeChipActive: { borderColor: colors.rose[500], backgroundColor: colors.rose[50] },
  typeChipText: { fontSize: 13, color: AUTH_UI.textBlack, fontWeight: "700", fontFamily: FONT_FRIENDLY_SANS },
  typeChipTextActive: { color: AUTH_UI.linkBerry },
  input: {
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: AUTH_UI.inputRadius,
    paddingHorizontal: AUTH_UI.fieldPaddingX,
    paddingVertical: AUTH_UI.fieldPaddingY,
    fontSize: 16,
    color: AUTH_UI.textBlack,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    fontFamily: FONT_FRIENDLY_SANS,
  },
  errorText: { marginTop: 10, color: colors.rose[700], fontSize: 14, fontWeight: "700", fontFamily: FONT_FRIENDLY_SANS },
  saveBtn: { marginTop: 14, borderRadius: 16, overflow: "hidden" },
  saveBtnDisabled: { opacity: 0.6 },
});
