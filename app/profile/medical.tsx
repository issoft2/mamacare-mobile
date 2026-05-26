/**
 * mobile/app/profile/medical.tsx
 * Refined Medical Profile - Soft Guided Entry
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
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useProfile, useUpdateProfile } from "@mumcare/api";
import { ctaButtonStyles, ctaGradientColors } from "@/components/styles/ctaButton";

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

  if (isLoading) return <View style={styles.centered}><ActivityIndicator color="#E8697C" /></View>;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/tabs/profile")} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1A237E" />
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
              colors={["#E8697C", "#FFA07A"]} 
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
          <Text style={styles.label}>Blood Type</Text>
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
            <Text style={styles.label}>Last Menstrual Period</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateValue}>{form.lmpDate || "Select Date"}</Text>
              <Ionicons name="calendar" size={20} color="#E8697C" />
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
              <Text style={styles.label}>Total Pregnancies</Text>
              <TextInput 
                style={styles.input} 
                value={form.gravida} 
                keyboardType="number-pad"
                onBlur={() => save("Pregnancies", { gravida: parseInt(form.gravida) })}
                onChangeText={(v) => setForm({...form, gravida: v})}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Previous Births</Text>
              <TextInput 
                style={styles.input} 
                value={form.parity} 
                keyboardType="number-pad"
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8F4' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 25, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 24, fontWeight: "800", color: "#1A237E" },
  progressCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 25, elevation: 3, marginBottom: 25 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { fontWeight: '700', color: '#1A237E' },
  progressPercent: { color: '#E8697C', fontWeight: '800' },
  track: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  autoSaveText: { fontSize: 11, color: '#BDBDBD', marginTop: 10, fontStyle: 'italic' },
  section: { marginBottom: 25 },
  label: { fontSize: 12, fontWeight: '800', color: '#1A237E', textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0' },
  chipActive: { backgroundColor: '#E8697C', borderColor: '#E8697C' },
  chipText: { fontWeight: '600', color: '#757575' },
  chipTextActive: { color: '#FFF' },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 25, padding: 20 },
  field: { marginBottom: 20 },
  dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15 },
  dateValue: { fontSize: 16, color: '#1A237E' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  half: { flex: 1 },
  input: { backgroundColor: '#FFF', borderRadius: 15, padding: 14, fontSize: 16, color: '#1A237E' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  doneBtn: { marginTop: 20, backgroundColor: '#1A237E', padding: 18, borderRadius: 20, alignItems: 'center' },
  doneBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});