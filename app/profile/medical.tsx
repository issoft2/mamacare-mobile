/**
 * mobile/app/profile/medical.tsx
 * Refined Medical Profile - Soft Guided Entry
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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useProfile, useUpdateProfile } from "@mumcare/api";
import { ctaButtonStyles, ctaGradientColors } from "@/components/styles/ctaButton";
import { colors } from "@mumcare/ui";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function MedicalProfileScreen() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [form, setForm] = useState({ 
    bloodType: "", lmpDate: "", gravida: "", parity: "", allergies: "", conditions: "" 
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeField, setActiveField] = useState("");

  useEffect(() => {
    if (!profile) return;
    setForm({
      bloodType: profile.blood_type ?? "",
      lmpDate: profile.lmp_date ?? "",
      gravida: profile.gravida != null ? String(profile.gravida) : "",
      parity: profile.parity != null ? String(profile.parity) : "",
      allergies: profile.allergies?.join(", ") ?? "",
      conditions: profile.known_conditions?.join(", ") ?? ""
    });
  }, [profile]);

  const completedCount = Object.values(form).filter(v => v !== "").length;
  const progress = (completedCount / 6) * 100;

  async function save(label: string, payload: any) {
    setActiveField(label);
    try {
      await updateProfile.mutateAsync(payload);
      setTimeout(() => setActiveField(""), 1500);
    } catch (e) {
      setActiveField("Error saving");
    }
  }

  if (isLoading) return <View style={styles.centered}><ActivityIndicator color={colors.rose[500]} /></View>;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.bgOverlay}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/tabs/profile")} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={AUTH_UI.linkBerry} />
          </TouchableOpacity>
          <Text style={styles.title}>Medical Details</Text>
        </View>

        {/* Dynamic Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              {progress === 100 ? "Profile Complete ✨" : "Almost there, Mama"}
            </Text>
            <Text style={styles.progressPercent}>{completedCount}/6</Text>
          </View>
          <View style={styles.track}>
            <LinearGradient 
              colors={[colors.rose[500], AUTH_UI.shadowRose]} 
              start={{x:0, y:0}} end={{x:1, y:0}} 
              style={[styles.fill, { width: `${progress}%` }]} 
            />
          </View>
          <Text style={styles.autoSaveText}>
            {activeField ? `Saving ${activeField}...` : "Changes save automatically"}
          </Text>
        </View>

        {/* Blood Type Chips */}
        <View style={styles.section}>
          <Text style={styles.label}>Blood type</Text>
          <View style={styles.chipRow}>
            {BLOOD_TYPES.map(bt => (
              <TouchableOpacity
                key={bt}
                style={[styles.chip, form.bloodType === bt && styles.chipActive]}
                onPress={() => {
                  setForm({...form, bloodType: bt});
                  save("Blood Type", { blood_type: bt });
                }}
              >
                <Text style={[styles.chipText, form.bloodType === bt && styles.chipTextActive]}>{bt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.glassCard}>
          <View style={styles.field}>
            <Text style={styles.label}>Last menstrual period</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateValue}>{form.lmpDate || "Select date"}</Text>
              <Ionicons name="calendar" size={20} color={AUTH_UI.linkBerry} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={form.lmpDate ? new Date(form.lmpDate) : new Date()}
                mode="date"
                onChange={(e, d) => {
                  setShowDatePicker(false);
                  if(d) {
                    const iso = d.toISOString().split('T')[0];
                    setForm({...form, lmpDate: iso});
                    save("LMP Date", { lmp_date: iso });
                  }
                }}
              />
            )}
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Total pregnancies</Text>
              <TextInput 
                style={styles.input} 
                value={form.gravida} 
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={AUTH_UI.textBlack}
                onBlur={() => save("Pregnancies", { gravida: parseInt(form.gravida) })}
                onChangeText={(v) => setForm({...form, gravida: v})}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Previous births</Text>
              <TextInput 
                style={styles.input} 
                value={form.parity} 
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={AUTH_UI.textBlack}
                onBlur={() => save("Births", { parity: parseInt(form.parity) })}
                onChangeText={(v) => setForm({...form, parity: v})}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Allergies</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              multiline 
              placeholder="e.g. Peanuts, Penicillin"
              placeholderTextColor={AUTH_UI.textBlack}
              value={form.allergies}
              onBlur={() => save("Allergies", { allergies: form.allergies.split(',').map(s => s.trim()) })}
              onChangeText={(v) => setForm({...form, allergies: v})}
            />
          </View>
        </View>

        <TouchableOpacity 
        style={ctaButtonStyles.button}
        onPress={() => router.back()}
        >
           <LinearGradient
              colors={ctaGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={ctaButtonStyles.gradient}
            >
          <Text style={ctaButtonStyles.text}>Finish</Text>
        </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_UI.warmBackground },
  bgOverlay: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 34 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    backgroundColor: AUTH_UI.textWhite,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: { fontSize: 30, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.5 },
  progressCard: { backgroundColor: AUTH_UI.textWhite, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20, borderRadius: AUTH_UI.cardRadius, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200], elevation: 2, marginBottom: 25 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { fontWeight: '700', color: AUTH_UI.textHeading, fontSize: 16, fontFamily: FONT_FRIENDLY_SANS },
  progressPercent: { color: AUTH_UI.linkBerry, fontWeight: '800', fontSize: 15, fontFamily: FONT_FRIENDLY_SANS },
  track: { height: 8, backgroundColor: AUTH_UI.semanticNeutralSofter, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  autoSaveText: { fontSize: 12, color: AUTH_UI.textBlack, marginTop: 10, fontFamily: FONT_FRIENDLY_SANS },
  section: { marginBottom: 25 },
  label: { fontSize: 14, fontWeight: '600', color: AUTH_UI.textBlack, marginBottom: 10, marginLeft: 2, fontFamily: FONT_FRIENDLY_SANS },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: AUTH_UI.inputRadius, backgroundColor: AUTH_UI.textWhite, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200] },
  chipActive: { backgroundColor: AUTH_UI.shadowRose, borderColor: AUTH_UI.shadowRose },
  chipText: { fontWeight: '600', color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  chipTextActive: { color: AUTH_UI.textWhite, fontFamily: FONT_FRIENDLY_SANS },
  glassCard: { backgroundColor: AUTH_UI.textWhite, borderRadius: AUTH_UI.cardRadius, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200] },
  field: { marginBottom: 20 },
  dateInput: { minHeight: 54, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: AUTH_UI.textWhite, paddingHorizontal: AUTH_UI.fieldPaddingX, borderRadius: AUTH_UI.inputRadius, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200] },
  dateValue: { fontSize: 16, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  half: { flex: 1 },
  input: { backgroundColor: AUTH_UI.textWhite, borderRadius: AUTH_UI.inputRadius, paddingHorizontal: AUTH_UI.fieldPaddingX, paddingVertical: AUTH_UI.fieldPaddingY, fontSize: 16, color: AUTH_UI.textBlack, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200], fontFamily: FONT_FRIENDLY_SANS },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  doneBtn: { marginTop: 20, backgroundColor: AUTH_UI.brandNavy, padding: 18, borderRadius: 20, alignItems: 'center' },
  doneBtnText: { color: AUTH_UI.textWhite, fontWeight: '700', fontSize: 16 }
});