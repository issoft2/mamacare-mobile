/**
 * mobile/app/profile/care-team/new.tsx
 * Refined Care Team Wizard - Guided & Conversational
 */

import { useRouter } from "expo-router";
import { useState } from "react";
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
import { useAddCareTeamMember } from "@mumcare/api";
import type { CareTeamMember } from "@mumcare/types";

type RoleId = CareTeamMember["role"];
type PreferredContact = CareTeamMember["preferred_contact"];

export default function AddCareTeamMemberScreen() {
  const router = useRouter();
  const addMember = useAddCareTeamMember();

  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    role: "" as RoleId | "",
    workplace: "",
    email: "",
    phone: "",
    isPrimary: false,
  });

  const nextStep = () => step < 3 ? setStep(step + 1) : handleFinish();
  const prevStep = () => step > 1 ? setStep(step - 1) : router.back();

  const handleFinish = async () => {
    const preferredContact: PreferredContact = form.email ? "email" : "sms";

    try {
      await addMember.mutateAsync({
        full_name: form.fullName,
        role: form.role as RoleId,
        practice_name: form.workplace || null,
        email: form.email || null,
        phone: form.phone || null,
        preferred_contact: preferredContact,
        trust_or_hospital: form.workplace || null,
        is_primary: form.isPrimary,
      });
      setSuccess(true);
      setTimeout(() => router.replace("/profile/care-team"), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  if (success) return <SuccessState name={form.fullName} />;

  return (
    <KeyboardAvoidingView 
      style={styles.screen} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#6D4A45" />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          {[1, 2, 3].map((s) => (
            <View 
              key={s} 
              style={[styles.dot, step >= s && styles.dotActive]} 
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Who is joining your care circle? ✨</Text>
            <Text style={styles.stepSub}>We'll use this to help coordinate your appointments and health records.</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Dr. Sarah Chen" 
                value={form.fullName}
                onChangeText={(v) => setForm({...form, fullName: v})}
              />
            </View>

            <Text style={styles.label}>Their Role</Text>
            <View style={styles.roleGrid}>
              {["midwife", "obstetrician", "gp", "specialist"].map((r) => (
                <TouchableOpacity 
                  key={r} 
                  style={[styles.roleChip, form.role === r && styles.roleChipActive]}
                  onPress={() => setForm({...form, role: r as RoleId})}
                >
                  <Text style={[styles.roleText, form.role === r && styles.roleTextActive]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Where do they practice? 🏥</Text>
            <Text style={styles.stepSub}>This helps us identify the right clinic or hospital trust.</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Clinic or Hospital Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. St. Mary's Maternity" 
                value={form.workplace}
                onChangeText={(v) => setForm({...form, workplace: v})}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>How can we reach them? ✉️</Text>
            <Text style={styles.stepSub}>Optional, but helpful for direct communication.</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput style={styles.input} keyboardType="email-address" value={form.email} onChangeText={(v) => setForm({...form, email: v})} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput style={styles.input} keyboardType="phone-pad" value={form.phone} onChangeText={(v) => setForm({...form, phone: v})} />
            </View>

            <TouchableOpacity 
              style={styles.primaryToggle} 
              onPress={() => setForm({...form, isPrimary: !form.isPrimary})}
            >
              <View style={[styles.checkbox, form.isPrimary && styles.checkboxActive]}>
                {form.isPrimary && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
              <View>
                <Text style={styles.toggleTitle}>Mark as Primary Caregiver</Text>
                <Text style={styles.toggleSub}>This is my main point of contact</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[ctaButtonStyles.button, styles.mainBtn, (!form.fullName || !form.role) && step === 1 && styles.disabledBtn]} 
          onPress={nextStep}
          disabled={(!form.fullName || !form.role) && step === 1}
        >
          <LinearGradient colors={ctaGradientColors} style={ctaButtonStyles.gradient}>
            {addMember.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={ctaButtonStyles.text}>{step === 3 ? "Complete Setup" : "Continue"}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function SuccessState({ name }: { name: string }) {
  return (
    <View style={styles.successScreen}>
      <View style={styles.confettiContainer}>
        <Ionicons name="heart" size={80} color="#C97B6E" />
      </View>
      <Text style={styles.successTitle}>Care Circle Updated</Text>
      <Text style={styles.successSub}>{name} has been added to your team. We've got it from here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8F4' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, gap: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  progressTrack: { flex: 1, flexDirection: 'row', gap: 8 },
  dot: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#E0E0E0' },
  dotActive: { backgroundColor: '#C97B6E' },
  content: { padding: 25 },
  stepContainer: {},
  stepTitle: { fontSize: 26, fontWeight: '800', color: '#4D3B39', marginBottom: 10 },
  stepSub: { fontSize: 16, color: '#757575', lineHeight: 24, marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '800', color: '#6D4A45', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#FFF', borderRadius: 15, padding: 16, fontSize: 16, color: '#4D3B39', borderWidth: 1, borderColor: 'rgba(140,90,82,0.14)' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  roleChip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 25, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0' },
  roleChipActive: { backgroundColor: '#8E5A54', borderColor: '#8E5A54' },
  roleText: { fontWeight: '700', color: '#757575' },
  roleTextActive: { color: '#FFF' },
  primaryToggle: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 10, backgroundColor: '#FFF', padding: 20, borderRadius: 20 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#C97B6E', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#C97B6E' },
  toggleTitle: { fontWeight: '700', color: '#6D4A45' },
  toggleSub: { fontSize: 12, color: '#757575' },
  footer: { padding: 25, paddingBottom: 40 },
  mainBtn: { borderRadius: 20, overflow: 'hidden', elevation: 5 },
  disabledBtn: { opacity: 0.5 },
  successScreen: { flex: 1, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', padding: 40 },
  confettiContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#4D3B39', marginBottom: 10 },
  successSub: { textAlign: 'center', color: '#757575', lineHeight: 22 }
});
