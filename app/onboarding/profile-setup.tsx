/**
 * mobile/app/onboarding/profile-setup.tsx
 * Refined Setup Screen - Emotive Onboarding
 */

import { useRouter } from "expo-router";
import { type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { ApiRequestError, useCreateProfile, useProfile, useUpdateProfile} from "@mumcare/api";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";
import { getActiveLegalRoute } from "@/lib/legal";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const { data: profile, isError, error, isPending } = useProfile();

  const isNotFound = isError && error instanceof ApiRequestError && error.isNotFound;
  const isSaving = createProfile.isPending || updateProfile.isPending;
  
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', edd: '', week: '' });
  const [formError, setFormError] = useState('');
  const [consents, setConsents] = useState({
    marketing: false,
    system_improvement: false,
    anon_commercial: false,
    model_training: false,
  });

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
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const dob = form.dob.trim();
    const edd = form.edd.trim();
    const gestational_week = parseInt(form.week, 10);

    if (!firstName || !lastName || !dob || !edd) {
      setFormError('Please complete all profile fields.');
      return;
    }
    
    if (isNaN(gestational_week) || gestational_week < 1 || gestational_week > 42) {
      setFormError('Gestational week must be between 1 and 42.');
      return;
    }

    try {
      if(isNotFound) {
        await createProfile.mutateAsync({
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dob,
          estimated_due_date: edd,
          gestational_week,
        });
      } else {
        await updateProfile.mutateAsync({
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dob,
          estimated_due_date: edd,
          gestational_week,
        });
      }
      router.replace("/tabs/home");
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
            {formError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#A32D2D" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sarah"
                  value={form.firstName}
                  onChangeText={(v) => setForm({ ...form, firstName: v })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Thompson"
                  value={form.lastName}
                  onChangeText={(v) => setForm({ ...form, lastName: v })}
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
                  onChangeText={(v) => setForm({ ...form, dob: v })}
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
                  onChangeText={(v) => setForm({ ...form, edd: v })}
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
                onChangeText={(v) => setForm({ ...form, week: v })}
              />
            </View>

            <View style={styles.consentGroup}>
              <ConsentCheckbox
                label="Marketing (optional)"
                value={consents.marketing}
                onValueChange={(v) => setConsents((c) => ({ ...c, marketing: v }))}
                learnMoreRoute={getActiveLegalRoute("privacy")}
              >
                Receive updates, offers, and health tips.
              </ConsentCheckbox>
              <ConsentCheckbox
                label="System Improvement (optional)"
                value={consents.system_improvement}
                onValueChange={(v) => setConsents((c) => ({ ...c, system_improvement: v }))}
                learnMoreRoute={getActiveLegalRoute("privacy")}
              >
                Help us improve features and experience of this app
              </ConsentCheckbox>
              <ConsentCheckbox
                label="Anonymous Commercialization (optional)"
                value={consents.anon_commercial}
                onValueChange={(v) => setConsents((c) => ({ ...c, anon_commercial: v }))}
                learnMoreRoute={getActiveLegalRoute("privacy")}
              >
                Allow use of anonymized data for research purposes.
              </ConsentCheckbox>
              <ConsentCheckbox
                label="Model Training (optional)"
                value={consents.model_training}
                onValueChange={(v) => setConsents((c) => ({ ...c, model_training: v }))}
                learnMoreRoute={getActiveLegalRoute("privacy")}
              >
                Allow your data to help train and improve our AI models.
              </ConsentCheckbox>
            </View>

            <TouchableOpacity
              style={[ctaButtonStyles.button, styles.submitBtn, isSaving && styles.submitBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <LinearGradient colors={ctaGradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ctaButtonStyles.gradient}>
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={ctaButtonStyles.text}>Continue to My Dashboard</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
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

function ConsentCheckbox({
  label,
  value,
  onValueChange,
  learnMoreRoute,
  children,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  learnMoreRoute: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.consentRow}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.8}
    >
      <View style={[styles.checkbox, value && styles.checkboxActive]}>
        {value ? <Ionicons name="checkmark" size={16} color="#FFF" /> : null}
      </View>
      <View style={styles.consentTextWrap}>
        <Text style={styles.consentTitle}>{label}</Text>
        <Text style={styles.consentDesc}>
          {children}{" "}
          <Text
            style={styles.learnMore}
            onPress={(e) => {
              e.stopPropagation?.();
              router.push(learnMoreRoute as any);
            }}
          >
            Learn more
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgOverlay: { flex: 1 },
  content: { padding: 25, paddingTop: 80 },
  header: { marginBottom: 30 },
  stepBadge: { backgroundColor: 'rgba(232, 105, 124, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 15 },
  stepText: { fontSize: 10, fontWeight: '800', color: '#E8697C', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: "800", color: "#1A237E" },
  subtitle: { fontSize: 15, color: "#757575", marginTop: 8, lineHeight: 22 },
  formContainer: { gap: 20 },
  errorBox: { flexDirection: 'row', backgroundColor: '#FCEBEB', padding: 15, borderRadius: 15, alignItems: 'center', gap: 10 },
  errorText: { flex: 1, color: '#A32D2D', fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 15 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#1A237E', marginLeft: 4 },
  input: { flex: 1, backgroundColor: '#FFF', borderRadius: 15, padding: 16, fontSize: 16, color: '#1A237E', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  inputIcon: { marginLeft: 15 },
  consentGroup: { gap: 14, marginTop: 10, marginBottom: 10 },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  checkboxActive: {
    borderColor: '#E8697C',
    backgroundColor: '#E8697C',
  },
  consentTextWrap: { flex: 1 },
  consentTitle: { fontWeight: '700', color: '#1A237E', fontSize: 13 },
  consentDesc: { fontSize: 12, color: '#757575' },
  learnMore: { color: '#E8697C', textDecorationLine: 'underline' },
  submitBtn: { marginTop: 20 },
  submitBtnDisabled: { opacity: 0.72 },
});
