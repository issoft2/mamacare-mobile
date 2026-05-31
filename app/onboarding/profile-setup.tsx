/**
 * mobile/app/onboarding/profile-setup.tsx
 * Refined Setup Screen - Emotive Onboarding
 */

import { Stack, useRouter } from "expo-router";
import { type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from "@clerk/clerk-expo";
import {
  ApiRequestError,
  colors,
  postConsentEvents,
  type ConsentEventPayload,
  type ConsentTier,
  useCreateProfile,
  useProfile,
  useUpdateProfile,
} from "@mumcare/api";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";
import { getActiveLegalDocument, getActiveLegalRoute } from "@/lib/legal";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const { userId: clerkUserId } = useAuth();
  const { user } = useUser();
  const effectiveClerkUserId = (clerkUserId ?? user?.id ?? null)?.trim() || null;
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const { data: profile, isPending } = useProfile();
  const activePrivacyDoc = getActiveLegalDocument("privacy");
  const accountFirstName = (user?.firstName ?? "").trim();
  const accountLastName = (user?.lastName ?? "").trim();

  const [consentSubmitting, setConsentSubmitting] = useState(false);
  const isSaving = createProfile.isPending || updateProfile.isPending;
  
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', edd: '', lmp: '', week: '' });
  const [formError, setFormError] = useState('');
  const [consents, setConsents] = useState({
    marketing: false,
    system_improvement: false,
    anon_commercial: false,
    model_training: false,
  });

  const recommendedConsents = {
    marketing: true,
    system_improvement: true,
    anon_commercial: true,
    model_training: true,
  } as const;

  const isBusy = isSaving || consentSubmitting;
  const isAuthReady = !!effectiveClerkUserId;

  function getJurisdictionFromRegion(region: "ng" | "uk"): "NG" | "GB" {
    return region === "uk" ? "GB" : "NG";
  }

  function parseIsoDate(value: string): Date | null {
    const trimmed = value.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);

    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return null;
    }

    return parsed;
  }

  function formatIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function isPastDate(date: Date): boolean {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const inputStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return inputStart < todayStart;
  }

  function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function clampWeek(week: number): number {
    return Math.max(1, Math.min(42, week));
  }

  function deriveWeekFromLmp(lmp: Date): number {
    const now = new Date();
    const msPerDay = 86_400_000;
    const daysSinceLmp = Math.floor((now.getTime() - lmp.getTime()) / msPerDay);
    return clampWeek(Math.floor(daysSinceLmp / 7) + 1);
  }

  function deriveWeekFromEdd(edd: Date): number {
    const now = new Date();
    const msPerDay = 86_400_000;
    const daysUntilDue = Math.floor((edd.getTime() - now.getTime()) / msPerDay);
    return clampWeek(40 - Math.floor(daysUntilDue / 7));
  }

  function handleLmpChange(value: string) {
    const lmp = parseIsoDate(value);

    if (!lmp) {
      setForm((prev) => ({ ...prev, lmp: value }));
      return;
    }

    const autoEdd = addDays(lmp, 280);
    const autoWeek = deriveWeekFromLmp(lmp);
    setForm((prev) => ({
      ...prev,
      lmp: value,
      edd: formatIsoDate(autoEdd),
      week: String(autoWeek),
    }));
  }

  function handleEddChange(value: string) {
    const edd = parseIsoDate(value);
    if (!edd) {
      setForm((prev) => ({ ...prev, edd: value }));
      return;
    }

    if (isPastDate(edd)) {
      setForm((prev) => ({ ...prev, edd: value }));
      setFormError("Estimated due date cannot be in the past.");
      return;
    }

    setFormError("");

    const autoWeek = deriveWeekFromEdd(edd);
    setForm((prev) => ({ ...prev, edd: value, week: String(autoWeek) }));
  }

  async function submitConsentEvents(
    userId: string,
    clerkId: string,
    selectedConsents: Record<ConsentTier, boolean>
  ): Promise<void> {
    const capturedAt = new Date().toISOString();
    const appVersion = Constants.expoConfig?.version ?? "unknown";
    const jurisdiction = getJurisdictionFromRegion(activePrivacyDoc.region);
    const consentTiers = Object.entries(selectedConsents) as Array<[ConsentTier, boolean]>;

    const events: ConsentEventPayload[] = consentTiers.map(([tier, enabled]) => ({
      user_id: userId,
      clerk_user_id: clerkId,
      consent_tier: tier,
      action: enabled ? "granted" : "withdrawn",
      consent_text_version: activePrivacyDoc.version,
      jurisdiction,
      // Default to a valid placeholder and let backend overwrite from request metadata.
      ip_address: "0.0.0.0",
      captured_at: capturedAt,
      documentType: "privacy",
      language: activePrivacyDoc.language,
      appVersion,
      source: "onboarding",
    }));

    const results = await Promise.allSettled(
      events.map((payload) => postConsentEvents([payload]))
    );

    const failedTiers = results
      .map((result, index) => ({ result, tier: events[index].consent_tier }))
      .filter((entry): entry is { result: PromiseRejectedResult; tier: ConsentTier } => entry.result.status === "rejected")
      .map((entry) => ({
        consent_tier: entry.tier,
        reason: entry.result.reason,
      }));

    if (failedTiers.length > 0) {
      console.error("Consent event post failed for some tiers:", failedTiers);

      if (failedTiers.length === events.length) {
        throw new Error("Failed to sync consent preferences.");
      }
    }
  }

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.first_name,
        lastName: profile.last_name,
        dob: profile.date_of_birth,
        edd: profile.estimated_due_date,
        lmp: profile.lmp_date ?? '',
        week: String(profile.gestational_week),
      });
      return;
    }

    if (accountFirstName || accountLastName) {
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || accountFirstName,
        lastName: prev.lastName || accountLastName,
      }));
    }
  }, [accountFirstName, accountLastName, profile]);

  // handle save
  async function persistProfileAndConsents(selectedConsents: Record<ConsentTier, boolean>) {
    setFormError('');
    const firstName = (form.firstName.trim() || accountFirstName).trim();
    const lastName = (form.lastName.trim() || accountLastName).trim();
    const dob = form.dob.trim();
    const edd = form.edd.trim();
    const lmp = form.lmp.trim();
    const gestational_week = parseInt(form.week, 10);

    if (!firstName || !lastName || !dob || !edd) {
      setFormError('Please complete all profile fields.');
      return;
    }

    const parsedEdd = parseIsoDate(edd);
    if (!parsedEdd) {
      setFormError('Estimated due date must be in YYYY-MM-DD format.');
      return;
    }

    if (isPastDate(parsedEdd)) {
      setFormError('Estimated due date cannot be in the past.');
      return;
    }
    
    if (isNaN(gestational_week) || gestational_week < 1 || gestational_week > 42) {
      setFormError('Gestational week must be between 1 and 42.');
      return;
    }

    if (!isAuthReady || !effectiveClerkUserId) {
      setFormError('Your account is still loading. Please wait a moment and try again.');
      return;
    }

    try {
      setConsentSubmitting(true);
      const payload = {
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob,
        estimated_due_date: edd,
        lmp_date: lmp || null,
        gestational_week,
      };

      let savedProfile;

      if (profile?.id) {
        try {
          savedProfile = await updateProfile.mutateAsync(payload);
        } catch (err) {
          // Profile may have been deleted or not yet created on backend.
          if (err instanceof ApiRequestError && err.isNotFound) {
            savedProfile = await createProfile.mutateAsync({
              ...payload,
              lmp_date: payload.lmp_date ?? undefined,
            });
          } else {
            throw err;
          }
        }
      } else {
        try {
          savedProfile = await createProfile.mutateAsync({
            ...payload,
            lmp_date: payload.lmp_date ?? undefined,
          });
        } catch (err) {
          // If profile already exists, backend may return conflict/validation.
          if (err instanceof ApiRequestError && (err.status === 409 || err.status === 422)) {
            savedProfile = await updateProfile.mutateAsync(payload);
          } else {
            throw err;
          }
        }
      }

      try {
        await submitConsentEvents(savedProfile.user_id, effectiveClerkUserId, selectedConsents);
      } catch (consentErr) {
        // Profile save should not be blocked if consent sync endpoint is temporarily unavailable.
        console.error("Profile saved but consent sync failed:", consentErr);
      }
      router.replace("/tabs/home");
    }catch (err: any) {
      console.error("Failed to save profile:", err);
      setFormError("An error occurred while saving. Please try again.");
    } finally {
      setConsentSubmitting(false);
    }
  }

  async function handleSaveChoices() {
    await persistProfileAndConsents(consents as Record<ConsentTier, boolean>);
  }

  async function handleAcceptRecommendedSettings() {
    const allOn = { ...recommendedConsents };
    setConsents(allOn);
    await persistProfileAndConsents(allOn as Record<ConsentTier, boolean>);
  }
  
  if (isPending) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.rose[500]} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.bgOverlay}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>Step 1 of 2</Text>
            </View>
            <Text style={styles.title}>Welcome, mama</Text>
            <Text style={styles.subtitle}>Let's personalize your journey. This info helps our AI provide the most accurate support.</Text>
          </View>

          <View style={styles.formContainer}>
            {formError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={AUTH_UI.redAlertText} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <View style={[styles.row, isCompact && styles.rowStack]}>
              <View style={[styles.inputGroup, { flex: 1 }]}> 
                <Text style={styles.label}>First name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sarah"
                  placeholderTextColor={AUTH_UI.textBlack}
                  value={form.firstName}
                  onChangeText={(v) => setForm({ ...form, firstName: v })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}> 
                <Text style={styles.label}>Last name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Thompson"
                  placeholderTextColor={AUTH_UI.textBlack}
                  value={form.lastName}
                  onChangeText={(v) => setForm({ ...form, lastName: v })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of birth</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="calendar-outline" size={18} color={AUTH_UI.textBlack} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={AUTH_UI.textBlack}
                  value={form.dob}
                  onChangeText={(v) => setForm({ ...form, dob: v })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estimated due date</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="heart-outline" size={18} color={AUTH_UI.linkBerry} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={AUTH_UI.textBlack}
                  value={form.edd}
                  onChangeText={handleEddChange}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last menstrual period (optional)</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="calendar-outline" size={18} color={AUTH_UI.linkBerry} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={AUTH_UI.textBlack}
                  value={form.lmp}
                  onChangeText={handleLmpChange}
                />
              </View>
              <Text style={styles.inputHint}>Adding LMP auto-fills your due date and current week.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current week</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 24"
                placeholderTextColor={AUTH_UI.textBlack}
                keyboardType="number-pad"
                value={form.week}
                onChangeText={(v) => setForm({ ...form, week: v })}
              />
            </View>

            <View style={styles.consentGroup}>
              <Text style={styles.consentHeading}>Customize your experience</Text>
              <Text style={styles.consentSubheading}>
                We value your privacy. Choose how we can use your data to power and improve our features. You can change these anytime in your settings.
              </Text>

              <ConsentCheckbox
                label="Personalized updates and offers (marketing)"
                value={consents.marketing}
                onValueChange={(v) => setConsents((c) => ({ ...c, marketing: v }))}
                learnMoreRoute={getActiveLegalRoute("privacy")}
              >
                Receive tailored updates, feature highlights, and occasional special offers via email.
              </ConsentCheckbox>
              <ConsentCheckbox
                label="App research and analytics (research)"
                value={consents.system_improvement}
                onValueChange={(v) => setConsents((c) => ({ ...c, system_improvement: v }))}
                learnMoreRoute={getActiveLegalRoute("privacy")}
              >
                Help us study usage trends to fix bugs faster and improve overall app speed.
              </ConsentCheckbox>
              <ConsentCheckbox
                label="Insights sharing (anonymous data)"
                value={consents.anon_commercial}
                onValueChange={(v) => setConsents((c) => ({ ...c, anon_commercial: v }))}
                learnMoreRoute={getActiveLegalRoute("privacy")}
              >
                Allow us to share fully aggregated, de-identified market trends with trusted partners. Your personal identity is strictly protected.
              </ConsentCheckbox>
              <ConsentCheckbox
                label="AI model training"
                value={consents.model_training}
                onValueChange={(v) => setConsents((c) => ({ ...c, model_training: v }))}
                learnMoreRoute={getActiveLegalRoute("privacy")}
              >
                Allow our secure systems to use anonymized application data to train and improve our smart algorithms.
              </ConsentCheckbox>

              <TouchableOpacity
                style={[ctaButtonStyles.button, styles.primaryConsentAction, (isBusy || !isAuthReady) && styles.submitBtnDisabled]}
                onPress={handleAcceptRecommendedSettings}
                disabled={isBusy || !isAuthReady}
              >
                <LinearGradient colors={ctaGradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ctaButtonStyles.gradient}>
                  {isBusy ? (
                    <ActivityIndicator color={AUTH_UI.textWhite} />
                  ) : (
                    <Text style={ctaButtonStyles.text}>Accept recommended settings</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryConsentAction, (isBusy || !isAuthReady) && styles.submitBtnDisabled]}
                onPress={handleSaveChoices}
                disabled={isBusy || !isAuthReady}
                activeOpacity={0.88}
              >
                <Text style={styles.secondaryConsentActionText}>Save choices</Text>
              </TouchableOpacity>

              {!isAuthReady ? (
                <View style={styles.authHintRow}>
                  <ActivityIndicator size="small" color={AUTH_UI.linkBerry} />
                  <Text style={styles.authHintText}>Securing your account...</Text>
                </View>
              ) : null}
            </View>
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
    <View style={styles.consentRow}>
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
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: AUTH_UI.semanticNeutralSoft, true: AUTH_UI.semanticSevereBgSoft }}
        thumbColor={value ? colors.rose[500] : AUTH_UI.textWhite}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_UI.cream },
  bgOverlay: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 52, paddingBottom: 32 },
  header: { marginBottom: 22 },
  stepBadge: { backgroundColor: AUTH_UI.shadowRoseSoft, borderWidth: 1, borderColor: colors.rose[200], paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start", marginBottom: 14 },
  stepText: { fontSize: 12, fontWeight: "700", color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  title: { fontSize: 30, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: AUTH_UI.textBlack, marginTop: 8, lineHeight: 24, fontFamily: FONT_FRIENDLY_SANS },
  formContainer: { gap: 20, backgroundColor: AUTH_UI.textWhite, borderRadius: AUTH_UI.cardRadius, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200], paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 },
  errorBox: { flexDirection: "row", backgroundColor: AUTH_UI.redAlertBg, padding: 15, borderRadius: AUTH_UI.inputRadius, borderWidth: 1, borderColor: AUTH_UI.redAlertBorder, alignItems: "center", gap: 10 },
  errorText: { flex: 1, color: AUTH_UI.redAlertText, fontSize: 14, fontWeight: "600", lineHeight: 20, fontFamily: FONT_FRIENDLY_SANS },
  row: { flexDirection: "row", gap: 15 },
  rowStack: { flexDirection: "column", gap: 10 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: AUTH_UI.textBlack, marginLeft: 2, fontFamily: FONT_FRIENDLY_SANS },
  inputHint: { fontSize: 13, color: AUTH_UI.textBlack, marginLeft: 2, lineHeight: 20, fontFamily: FONT_FRIENDLY_SANS },
  input: { flex: 1, backgroundColor: AUTH_UI.textWhite, borderRadius: AUTH_UI.inputRadius, paddingHorizontal: AUTH_UI.fieldPaddingX, paddingVertical: AUTH_UI.fieldPaddingY, fontSize: 16, color: AUTH_UI.textBlack, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200], fontFamily: FONT_FRIENDLY_SANS },
  inputWithIcon: { flexDirection: "row", alignItems: "center", backgroundColor: AUTH_UI.textWhite, borderRadius: AUTH_UI.inputRadius, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200] },
  inputIcon: { marginLeft: 15 },
  consentGroup: { gap: 14, marginTop: 10, marginBottom: 8 },
  consentHeading: { fontSize: 24, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF },
  consentSubheading: { fontSize: 15, color: AUTH_UI.textBlack, lineHeight: 24, fontFamily: FONT_FRIENDLY_SANS },
  consentRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "space-between", backgroundColor: AUTH_UI.textWhite, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200], borderRadius: AUTH_UI.inputRadius, paddingHorizontal: 14, paddingVertical: 12 },
  consentTextWrap: { flex: 1 },
  consentTitle: { fontWeight: "700", color: AUTH_UI.textHeading, fontSize: 14, marginBottom: 2, fontFamily: FONT_FRIENDLY_SANS },
  consentDesc: { fontSize: 13, color: AUTH_UI.textBlack, lineHeight: 20, fontFamily: FONT_FRIENDLY_SANS },
  learnMore: { color: AUTH_UI.linkBerry, textDecorationLine: "underline", fontWeight: "700", fontFamily: FONT_FRIENDLY_SANS },
  primaryConsentAction: { marginTop: 10 },
  secondaryConsentAction: {
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[500],
    borderRadius: AUTH_UI.inputRadius,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AUTH_UI.textWhite,
  },
  secondaryConsentActionText: { color: AUTH_UI.linkBerry, fontSize: 16, fontWeight: "800", fontFamily: FONT_FRIENDLY_SANS },
  authHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  authHintText: {
    color: AUTH_UI.textBlack,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  submitBtnDisabled: { opacity: 0.72 },
});
