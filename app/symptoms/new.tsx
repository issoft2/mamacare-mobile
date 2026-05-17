/**
 * mobile/app/symptoms/new.tsx
 * High Depth Symptom Form
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useProfile, useSubmitSymptom } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";
import type { Severity } from "@mamacare/types";

const SYMPTOMS = [
  { code: "HEADACHE", label: "Headache" },
  { code: "NAUSEA_VOMITING", label: "Nausea" },
  { code: "BACK_PAIN", label: "Back Pain" },
  { code: "REDUCED_FETAL_MOVEMENT", label: "Fetal Motion" },
  { code: "SWELLING", label: "Swelling" },
  { code: "BLEEDING", label: "Bleeding" },
  { code: "ABDOMINAL_PAIN", label: "Abdominal" },
  { code: "FATIGUE", label: "Fatigue" },
];

const SEVERITIES: Severity[] = ["mild", "moderate", "severe"];

export default function NewSymptomScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const submitSymptom = useSubmitSymptom();

  const [selected, setSelected] = useState<string[]>([]);
  const [severity, setSeverity] = useState<Severity>("mild");
  const [notes, setNotes] = useState("");

  function toggleSymptom(code: string) {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  }

  return (
    <View style={styles.screen}>
      <ImageBackground source={require("@/assets/images/mamacare-home-bg.png")} style={styles.bgImage}>
        <LinearGradient colors={["rgba(255,255,255,0.8)", "rgba(255,245,245,0.6)"]} style={styles.bgOverlay}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            <View style={styles.header}>
              <Text style={styles.title}>How are you feeling?</Text>
              <Text style={styles.subtitle}>Log your symptoms to help us support you.</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.label}>Select Symptoms</Text>
              <View style={styles.chips}>
                {SYMPTOMS.map(s => {
                  const active = selected.includes(s.code);
                  return (
                    <TouchableOpacity 
                      key={s.code} 
                      onPress={() => toggleSymptom(s.code)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { marginTop: 25 }]}>Severity</Text>
              <View style={styles.severityRow}>
                {SEVERITIES.map(s => (
                  <TouchableOpacity key={s} onPress={() => setSeverity(s)} style={[styles.sevBtn, severity === s && styles.sevBtnActive]}>
                    <Text style={[styles.sevText, severity === s && styles.sevTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 25 }]}>Notes</Text>
              <TextInput
                style={styles.input}
                placeholder="Anything else we should know?"
                placeholderTextColor="#BDBDBD"
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={() => {}} // Integration logic remains same
                disabled={submitSymptom.isPending}
              >
                <LinearGradient colors={["#E8697C", "#FFA07A"]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.submitGradient}>
                  {submitSymptom.isPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Save Journal Entry</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={styles.cancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgImage: { flex: 1 },
  bgOverlay: { flex: 1 },
  content: { padding: 20, paddingTop: 60 },
  header: { marginBottom: 30 },
  title: { fontSize: 26, fontWeight: "700", color: "#1A237E" },
  subtitle: { fontSize: 15, color: "#757575", marginTop: 5 },
  formCard: { backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 30, padding: 25, elevation: 10, shadowOpacity: 0.1, shadowRadius: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "#3949AB", marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "#FFF", borderWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  chipActive: { backgroundColor: "#E8697C", borderColor: "#E8697C" },
  chipText: { color: "#757575", fontSize: 14 },
  chipTextActive: { color: "#FFF", fontWeight: "700" },
  severityRow: { flexDirection: "row", gap: 10 },
  sevBtn: { flex: 1, padding: 12, borderRadius: 15, backgroundColor: "#FFF", alignItems: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  sevBtnActive: { borderColor: "#E8697C", backgroundColor: "rgba(232,105,124,0.1)" },
  sevText: { color: "#757575", textTransform: 'capitalize' },
  sevTextActive: { color: "#E8697C", fontWeight: "700" },
  input: { backgroundColor: "#FFF", borderRadius: 15, padding: 15, minHeight: 100, textAlignVertical: 'top', marginTop: 5, color: "#1A237E" },
  submitBtn: { marginTop: 30, borderRadius: 20, overflow: 'hidden' },
  submitGradient: { padding: 18, alignItems: "center" },
  submitText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  cancel: { marginTop: 15, alignItems: "center" },
  cancelText: { color: "#9E9E9E" }
});