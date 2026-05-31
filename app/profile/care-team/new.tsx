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
import { ctaButtonStyles, ctaGradientColors } from "@/components/styles/ctaButton";
import { useAddCareTeamMember } from "@mumcare/api";
import { colors } from "@mumcare/ui";
import type { CareTeamMember } from "@mumcare/types";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

type RoleId = CareTeamMember["role"];
type PreferredContact = CareTeamMember["preferred_contact"];

const ROLE_OPTIONS: Array<{ id: RoleId; label: string }> = [
  { id: "midwife", label: "Midwife" },
  { id: "obstetrician", label: "Obstetrician" },
  { id: "gp", label: "GP" },
  { id: "specialist", label: "Specialist" },
];

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
      <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.bgOverlay}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={AUTH_UI.linkBerry} />
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
            <Text style={styles.stepTitle}>Who is joining your care circle?</Text>
            <Text style={styles.stepSub}>We'll use this to help coordinate your appointments and health records.</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Dr. Sarah Chen" 
                placeholderTextColor={AUTH_UI.textBlack}
                value={form.fullName}
                onChangeText={(v) => setForm({...form, fullName: v})}
              />
            </View>

            <Text style={styles.label}>Their role</Text>
            <View style={styles.roleGrid}>
              {ROLE_OPTIONS.map((option) => (
                <TouchableOpacity 
                  key={option.id} 
                  style={[styles.roleChip, form.role === option.id && styles.roleChipActive]}
                  onPress={() => setForm({...form, role: option.id})}
                >
                  <Text style={[styles.roleText, form.role === option.id && styles.roleTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Where do they practice?</Text>
            <Text style={styles.stepSub}>This helps us identify the right clinic or hospital trust.</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Clinic or hospital name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. St. Mary's Maternity" 
                placeholderTextColor={AUTH_UI.textBlack}
                value={form.workplace}
                onChangeText={(v) => setForm({...form, workplace: v})}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>How can we reach them?</Text>
            <Text style={styles.stepSub}>Optional, but helpful for direct communication.</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email address</Text>
              <TextInput style={styles.input} keyboardType="email-address" placeholderTextColor={AUTH_UI.textBlack} value={form.email} onChangeText={(v) => setForm({...form, email: v})} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone number</Text>
              <TextInput style={styles.input} keyboardType="phone-pad" placeholderTextColor={AUTH_UI.textBlack} value={form.phone} onChangeText={(v) => setForm({...form, phone: v})} />
            </View>

            <TouchableOpacity 
              style={styles.primaryToggle} 
              onPress={() => setForm({...form, isPrimary: !form.isPrimary})}
            >
              <View style={[styles.checkbox, form.isPrimary && styles.checkboxActive]}>
                {form.isPrimary && <Ionicons name="checkmark" size={16} color={AUTH_UI.textWhite} />}
              </View>
              <View>
                <Text style={styles.toggleTitle}>Mark as primary caregiver</Text>
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
              <ActivityIndicator color={AUTH_UI.textWhite} />
            ) : (
              <Text style={ctaButtonStyles.text}>{step === 3 ? "Complete setup" : "Continue"}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function SuccessState({ name }: { name: string }) {
  return (
    <View style={styles.successScreen}>
      <View style={styles.confettiContainer}>
        <Ionicons name="heart" size={80} color={colors.rose[500]} />
      </View>
      <Text style={styles.successTitle}>Care Circle Updated</Text>
      <Text style={styles.successSub}>{name} has been added to your team. We've got it from here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_UI.warmBackground },
  bgOverlay: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, gap: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: AUTH_UI.textWhite, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200], alignItems: 'center', justifyContent: 'center', elevation: 2 },
  progressTrack: { flex: 1, flexDirection: 'row', gap: 8 },
  dot: { flex: 1, height: 6, borderRadius: 3, backgroundColor: AUTH_UI.semanticNeutralSoft },
  dotActive: { backgroundColor: AUTH_UI.shadowRose },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 30 },
  stepContainer: {},
  stepTitle: { fontSize: 30, fontWeight: '800', color: AUTH_UI.textHeading, marginBottom: 10, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.5 },
  stepSub: { fontSize: 16, color: AUTH_UI.textBlack, lineHeight: 24, marginBottom: 30, fontFamily: FONT_FRIENDLY_SANS },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: AUTH_UI.textBlack, marginBottom: 8, marginLeft: 2, fontFamily: FONT_FRIENDLY_SANS },
  input: { backgroundColor: AUTH_UI.textWhite, borderRadius: AUTH_UI.inputRadius, paddingHorizontal: AUTH_UI.fieldPaddingX, paddingVertical: AUTH_UI.fieldPaddingY, fontSize: 16, color: AUTH_UI.textBlack, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200], fontFamily: FONT_FRIENDLY_SANS },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  roleChip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: AUTH_UI.inputRadius, backgroundColor: AUTH_UI.textWhite, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200] },
  roleChipActive: { backgroundColor: AUTH_UI.shadowRose, borderColor: AUTH_UI.shadowRose },
  roleText: { fontWeight: '700', color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  roleTextActive: { color: AUTH_UI.textWhite, fontFamily: FONT_FRIENDLY_SANS },
  primaryToggle: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 10, backgroundColor: AUTH_UI.textWhite, padding: 20, borderRadius: AUTH_UI.cardRadius, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200] },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: AUTH_UI.shadowRose, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: AUTH_UI.shadowRose },
  toggleTitle: { fontWeight: '700', color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  toggleSub: { fontSize: 12, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  footer: { padding: 25, paddingBottom: 40 },
  mainBtn: { borderRadius: 20, overflow: 'hidden', elevation: 5 },
  disabledBtn: { opacity: 0.5 },
  successScreen: { flex: 1, backgroundColor: AUTH_UI.warmBackground, alignItems: 'center', justifyContent: 'center', padding: 40 },
  confettiContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: AUTH_UI.surfaceTint3, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  successTitle: { fontSize: 30, fontWeight: '800', color: AUTH_UI.textHeading, marginBottom: 10, fontFamily: FONT_WARM_SERIF },
  successSub: { textAlign: 'center', color: AUTH_UI.textBlack, lineHeight: 22, fontFamily: FONT_FRIENDLY_SANS }
});
