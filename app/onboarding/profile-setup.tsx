/**
 * mobile/app/onboarding/profile-setup.tsx
 * Refined Setup Screen - Emotive Onboarding
 */

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { ApiRequestError, useCreateProfile, useProfile, useUpdateProfile} from "@mumcare/api";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const createProfile = useCreateProfile();
  const { data: profile, isError, error, isPending } = useProfile();

  const isNotFound = isError && error instanceof ApiRequestError && error.isNotFound;
  
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', edd: '', week: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.first_name,
        lastName: profile.last_name,
        dob: profile.date_of_birth,
        edd: profile.estimated_due_date,
        week: String(profile.gestational_week),
      });
    }
  }, [profile]);

  // handle save
  async function handleSave() {
    setFormError('');
    const gestational_week = parseInt(form.week, 10);
    
    if (isNaN(gestational_week) || gestational_week < 1 || gestational_week > 42) {
      setFormError('Gestational week must be between 1 and 42.');
      return;
    }

    try {
      if(isNotFound) {
        await createProfile.mutateAsync({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          date_of_birth: form.dob.trim(),
          estimated_due_date: form.edd.trim(),
          gestational_week,
        });
      } 
      router.back();
    }catch (err: any) {
      console.error("Failed to save profile:", err);
      setFormError("An error occurred while saving. Please try again.");
    }
  }
  
  if (isPending) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E8697C" />
      </View>
    );
  }
 


  return (
    <View style={styles.screen}>
      {/* <ImageBackground source={require("@/assets/welcome-bg.png")} style={styles.bgImage}> */}
        <LinearGradient colors={["rgba(255,255,255,0.8)", "rgba(255,245,245,0.5)"]} style={styles.bgOverlay}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            
            <View style={styles.header}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepText}>STEP 1 OF 2</Text>
              </View>
              <Text style={styles.title}>Welcome, Mama ✨</Text>
              <Text style={styles.subtitle}>Let’s personalize your journey. This info helps our AI provide the most accurate support.</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Sarah" 
                    value={form.firstName}
                    onChangeText={(v) => setForm({...form, firstName: v})}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Thompson" 
                    value={form.lastName}
                    onChangeText={(v) => setForm({...form, lastName: v})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="calendar-outline" size={18} color="#BDBDBD" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="YYYY-MM-DD" 
                    value={form.dob}
                    onChangeText={(v) => setForm({...form, dob: v})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Estimated Due Date</Text>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="heart-outline" size={18} color="#E8697C" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="YYYY-MM-DD" 
                    value={form.edd}
                    onChangeText={(v) => setForm({...form, edd: v})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Week</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. 24" 
                  keyboardType="number-pad"
                  value={form.week}
                  onChangeText={(v) => setForm({...form, week: v})}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                <LinearGradient colors={["#E8697C", "#FFA07A"]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.submitGradient}>
                  <Text style={styles.submitText}>Continue to My Dashboard</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </LinearGradient>
      {/* </ImageBackground> */}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgImage: { flex: 1 },
  bgOverlay: { flex: 1 },
  content: { padding: 25, paddingTop: 80 },
  header: { marginBottom: 30 },
  stepBadge: { backgroundColor: 'rgba(232, 105, 124, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 15 },
  stepText: { fontSize: 10, fontWeight: '800', color: '#E8697C', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: "800", color: "#1A237E" },
  subtitle: { fontSize: 15, color: "#757575", marginTop: 8, lineHeight: 22 },
  formContainer: { gap: 20 },
  row: { flexDirection: 'row', gap: 15 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#1A237E', marginLeft: 4 },
  input: { flex: 1, backgroundColor: '#FFF', borderRadius: 15, padding: 16, fontSize: 16, color: '#1A237E', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  inputIcon: { marginLeft: 15 },
  submitBtn: { marginTop: 20, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#E8697C', shadowOpacity: 0.3 },
  submitGradient: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText: { color: '#FFF', fontWeight: '800', fontSize: 16 }
});