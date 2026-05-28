/**
 * mobile/app/profile/appointments/new.tsx
 * Add appointment form
 */

import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
import { useCreateAppointment } from "@mumcare/api";

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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient colors={["rgba(255,251,247,0.92)", "rgba(255,244,239,0.68)"]} style={styles.bgOverlay}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#6D4A45" />
            </TouchableOpacity>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>CARE PLANNING</Text>
              <Text style={styles.title}>Add Appointment</Text>
              <Text style={styles.subtitle}>Set your next visit so it appears on Home and in your upcoming list.</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Appointment Type</Text>
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
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Time (HH:MM)</Text>
            <TextInput
              style={styles.input}
              value={timeValue}
              onChangeText={setTimeValue}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="09:30"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Location (optional)</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Clinic or hospital"
              placeholderTextColor="#9CA3AF"
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
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="calendar-outline" size={18} color="#FFF" />
                    <Text style={ctaButtonStyles.text}>Save Appointment</Text>
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
  screen: { flex: 1 },
  bgOverlay: { flex: 1 },
  content: { padding: 20, paddingTop: 56, paddingBottom: 32 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 24 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    elevation: 2,
  },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: "800", color: "#8E5A54", letterSpacing: 1.1, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: "800", color: "#4D3B39" },
  subtitle: { marginTop: 6, fontSize: 13, lineHeight: 19, color: "#6E7890" },
  formCard: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.74)",
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6D4A45",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 10,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E9F5",
  },
  typeChipActive: { borderColor: "#C97B6E", backgroundColor: "rgba(201,123,110,0.10)" },
  typeChipText: { fontSize: 12, color: "#4B5563", fontWeight: "700" },
  typeChipTextActive: { color: "#B4233A" },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#4D3B39",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  errorText: { marginTop: 10, color: "#B4233A", fontSize: 12, fontWeight: "700" },
  saveBtn: { marginTop: 14, borderRadius: 16, overflow: "hidden" },
  saveBtnDisabled: { opacity: 0.6 },
});
