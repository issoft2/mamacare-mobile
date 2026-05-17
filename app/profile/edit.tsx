/**
 * mobile/app/profile/edit.tsx
 * Refined Edit Profile - High Depth UI
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
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { ApiRequestError, useCreateProfile, useProfile, useUpdateProfile } from "@mamacare/api";

export default function EditProfileScreen() {
  const router = useRouter();
  const { data: profile, isError, error, isPending } = useProfile();
  const updateProfile = useUpdateProfile();
  const createProfile = useCreateProfile();

  const isNotFound = isError && error instanceof ApiRequestError && error.isNotFound;

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
    const gestational_week = parseInt(form.week, 10);
    
    if (isNaN(gestational_week) || gestational_week < 4 || gestational_week > 42) {
      setFormError("Gestational week must be between 4 and 42.");
      return;
    }

    try {
      if (isNotFound) {
        await createProfile.mutateAsync({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          date_of_birth: form.dob.trim(),
          gestational_week,
          estimated_due_date: form.edd.trim(),
        });
      } else {
        await updateProfile.mutateAsync({
          first_name: form.firstName,
          last_name: form.lastName,
          gestational_week,
          estimated_due_date: form.edd,
        });
      }
      router.back();
    } catch (err: any) {
      setFormError("Failed to save profile changes.");
    }
  }

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E8697C" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ImageBackground source={require("@/assets/images/mamacare-home-bg.png")} style={styles.bgImage}>
        <LinearGradient colors={["rgba(255,255,255,0.8)", "rgba(255,245,245,0.6)"]} style={styles.bgOverlay}>
          <ScrollView contentContainerStyle={styles.content}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#1A237E" />
              </TouchableOpacity>
              <Text style={styles.title}>{isNotFound ? "Create Profile" : "Edit Profile"}</Text>
            </View>

            {formError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#A32D2D" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <View style={styles.glassCard}>
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput 
                    style={styles.input} 
                    value={form.firstName} 
                    onChangeText={(v) => setForm({...form, firstName: v})} 
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput 
                    style={styles.input} 
                    value={form.lastName} 
                    onChangeText={(v) => setForm({...form, lastName: v})} 
                  />
                </View>
              </View>

              <Text style={styles.label}>Gestational Week</Text>
              <TextInput
                style={styles.input}
                value={form.week}
                onChangeText={(v) => setForm({...form, week: v})}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Estimated Due Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={form.edd}
                onChangeText={(v) => setForm({...form, edd: v})}
                placeholder="2026-08-20"
              />

              {isNotFound && (
                <>
                  <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.dob}
                    onChangeText={(v) => setForm({...form, dob: v})}
                  />
                </>
              )}

              <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                <LinearGradient colors={["#E8697C", "#FFA07A"]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.submitGradient}>
                  {createProfile.isPending || updateProfile.isPending ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.submitText}>Save Changes</Text>
                  )}
                </LinearGradient>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 25, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginRight: 15, elevation: 3 },
  title: { fontSize: 24, fontWeight: "800", color: "#1A237E" },
  errorBox: { flexDirection: 'row', backgroundColor: '#FCEBEB', padding: 15, borderRadius: 15, marginBottom: 20, alignItems: 'center', gap: 10 },
  errorText: { color: '#A32D2D', fontSize: 13, fontWeight: '600' },
  glassCard: { backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 30, padding: 20, elevation: 5 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  label: { fontSize: 12, fontWeight: '800', color: '#1A237E', textTransform: 'uppercase', marginBottom: 8, marginTop: 15, marginLeft: 4 },
  input: { backgroundColor: '#FFF', borderRadius: 15, padding: 14, fontSize: 16, color: '#1A237E', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  submitBtn: { marginTop: 30, borderRadius: 20, overflow: 'hidden' },
  submitGradient: { padding: 18, alignItems: 'center' },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});