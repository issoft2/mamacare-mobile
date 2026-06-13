/**
 * mobile/app/tabs/new-pregnancy.tsx
 * Redesigned for High-Tier Maternal Warmth, Cohesive Input Rows, and Absolute Structural Consistency
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@safeborn/ui";
import { useCreatePregnancy } from "@safeborn/api";
import { usePregnancyState } from "@/lib/pregnancyState";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseIsoDate(value: string): Date | null {
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;

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

// ─── Main Screen Component ──────────────────────────────────────────────────

export default function NewPregnancyScreen() {
  const router = useRouter();
  const createPregnancy = useCreatePregnancy();
  const { activePregnancy } = usePregnancyState();

  const [form, setForm] = useState({
    baby_nickname: "",
    edd: "",
    lmp: "",
    week: "",
    multiple_gestation: false,
  });

  const [formError, setFormError] = useState("");

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
    setFormError("");
  }

  function handleEddChange(value: string) {
    const edd = parseIsoDate(value);
    if (!edd) {
      setForm((prev) => ({ ...prev, edd: value }));
      return;
    }

    if (isPastDate(edd)) {
      setForm((prev) => ({ ...prev, edd: value }));
      return;
    }

    setFormError("");
    const autoWeek = deriveWeekFromEdd(edd);
    const autoLmp = addDays(edd, -280);

    setForm((prev) => ({ 
      ...prev, 
      edd: value,     
      week: String(autoWeek),
      lmp: formatIsoDate(autoLmp),
    }));
  }

  async function handleSubmit() {
    if (!form.edd.trim()) {
      setFormError("Estimated due date is required.");
      return;
    }

    const week = Number(form.week);
    if (Number.isNaN(week) || week < 1 || week > 42) {
      setFormError("Current week must be a calculated number between 1 and 42.");
      return;
    }

    const lmpDate = parseIsoDate(form.lmp);
    const eddDate = parseIsoDate(form.edd);

    if (lmpDate && eddDate && lmpDate > eddDate) {
      setFormError("Last menstrual period date must occur before your due date.");
      return;
    }

    try {
      await createPregnancy.mutateAsync({
        baby_nickname: form.baby_nickname.trim() || undefined,
        estimated_due_date: form.edd ?? undefined,
        lmp_date: form.lmp ?? undefined,
        gestational_week: Number(form.week),
        is_multiple_gestation: form.multiple_gestation || false,
      });
      router.replace("/tabs/home");
    } catch (error) {
      Alert.alert(
        "Could not start pregnancy",
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    }
  }

  const isSubmitting = createPregnancy.isPending;
  
  return ( 
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero Branding Header ─────────────────────────── */}
          <View style={styles.hero}>
            <View style={styles.iconShell}>
              <Ionicons name="sparkles" size={30} color={colors.rose[500]} />
            </View>
            <Text style={styles.title}>New pregnancy journey</Text>
            <Text style={styles.subtitle}>
              Tell us a little about this beautiful path so we can personalise your insights, tracking cards, and care tips from day one.
            </Text>
          </View>

          {/* ── Form Error Window (Fixed Crash) ──────────────── */}
          {formError ? (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle-outline" size={18} color={AUTH_UI.redAlertText} style={{ marginTop: 1 }} />
              <Text style={styles.warningText}>{formError}</Text>
            </View>
          ) : null}
            
          {/* ── Active Journey Verification Notice ─────────────── */}
          {activePregnancy && (
            <View style={[styles.warningBox, styles.archiveWarningBox]}>
              <Ionicons
                name="warning-outline"
                size={18}
                color={colors.rose[600]}
                style={{ marginTop: 2 }}
              />
              <Text style={[styles.warningText, { color: colors.rose[900] }]}>
                You already have an active pregnancy sequence. Creating a new record will safely archive your current metrics.
              </Text>
            </View>
          )}

          {/* ── Pure Architectural Input Shell ────────────────── */}
          <View style={styles.form}>
            
            {/* Nickname Row */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Baby nickname (optional)</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="ribbon-outline" size={18} color="#C4B4A7" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputStyleOverride}
                  placeholder="e.g. Little Star"
                  placeholderTextColor={AUTH_UI.textWarmMuted}
                  value={form.baby_nickname}
                  onChangeText={(v) => setForm({ ...form, baby_nickname: v })}
                  maxLength={40}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* EDD Field Row */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estimated due date (required)</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="heart-outline" size={18} color={colors.rose[400]} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputStyleOverride}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={AUTH_UI.textWarmMuted}
                  value={form.edd}
                  onChangeText={handleEddChange}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* LMP Field Row */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last menstrual period (required)</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="calendar-outline" size={18} color={colors.rose[400]} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputStyleOverride}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={AUTH_UI.textWarmMuted}
                  value={form.lmp}
                  onChangeText={handleLmpChange}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.inputHint}>✨ Adding your LMP auto-calculates your current week and due date.</Text>
            </View>

            {/* Computed Functional Progress Capsule */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Calculated Gestational State</Text>
              <View style={styles.readOnlyField}>
                <Ionicons name="time-outline" size={18} color="#A39284" style={{ marginRight: 10 }} />
                <Text style={styles.readOnlyText}>
                  {form.week ? `${form.week} Weeks Pregnant` : "Awaiting input date..."}
                </Text>
              </View>
            </View>
           
            {/* Multiple Gestation Toggle Feature Block */}
            <View style={styles.switchCardContainer}>
              <View style={styles.switchLabelGroup}>
                <Text style={styles.switchCardTitleLabel}>Multiple gestation</Text>
                <Text style={styles.switchSub}>Expecting twins, triplets, or more</Text>
              </View>
              <Switch
                value={form.multiple_gestation}
                onValueChange={(v) => setForm({ ...form, multiple_gestation: v })}
                trackColor={{ false: "#EFE6DD", true: colors.rose[400] }}
                thumbColor={AUTH_UI.textWhite}
                ios_backgroundColor="#EFE6DD"
              />
            </View>
          </View>

          {/* ── Premium Control Action Footers ─────────────────── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.ctaButton, isSubmitting && styles.ctaButtonDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.84}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={AUTH_UI.textWhite} />
              ) : (
                <Text style={styles.ctaLabel}>Begin this journey</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace("/tabs/home")}
              activeOpacity={0.84}
              disabled={isSubmitting}
            >
              <Text style={styles.secondaryLabel}>Not ready yet</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

// ─── Style Dictionary Constants ─────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AUTH_UI.warmBackground,
  },
  content: {
    paddingTop: Platform.OS === "ios" ? 50 : 32,
    paddingHorizontal: 20,
    paddingBottom: 60,
    gap: 26,
  },

  hero: {
    gap: 12,
    alignItems: "flex-start",
    marginTop: 10,
  },
  iconShell: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDF0F5",
    borderWidth: 1,
    borderColor: "#FCE2EC",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: AUTH_UI.textHeading,
    fontFamily: FONT_WARM_SERIF || FONT_WARM_SERIF,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    color: AUTH_UI.textWarmStrong,
    lineHeight: 22,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: AUTH_UI.semanticSevereBgSubtle,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AUTH_UI.semanticSevereBorder20,
    padding: 14,
  },
  archiveWarningBox: {
    backgroundColor: "#FFF5F6",
    borderColor: "#FADCE0",
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: AUTH_UI.redAlertText,
    fontFamily: FONT_FRIENDLY_SANS,
    fontWeight: "500",
  },

  form: {
    gap: 18,
  },
  inputGroup: { 
    gap: 8 
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: AUTH_UI.textHeading,
    fontFamily: FONT_FRIENDLY_SANS,
    letterSpacing: 0.1,
    marginLeft: 2,
  },
  inputWithIcon: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: "#F0E6DD",
    minHeight: 54,
    overflow: "hidden"
  },
  inputIcon: { 
    marginLeft: 16,
    marginRight: 4
  },
  inputStyleOverride: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    fontSize: 15,
    color: AUTH_UI.textHeading,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  inputHint: { 
    fontSize: 12, 
    color: "#A39284", 
    marginLeft: 4, 
    lineHeight: 18, 
    fontFamily: FONT_FRIENDLY_SANS,
    fontStyle: "italic"
  },
  
  readOnlyField: {
    flexDirection: "row",
    backgroundColor: "#FAF6F2",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#EFE6DD",
    minHeight: 54,
    alignItems: "center",
  },
  readOnlyText: {
    fontSize: 15,
    color: AUTH_UI.textWarmStrong,
    fontFamily: FONT_FRIENDLY_SANS,
    fontWeight: "700",
  },

  switchCardContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0E6DD",
    marginTop: 4,
  },
  switchLabelGroup: {
    gap: 3,
    flex: 1,
    marginRight: 12,
  },
  switchCardTitleLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: AUTH_UI.textHeading,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  switchSub: {
    fontSize: 12,
    color: AUTH_UI.textWarm,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  footer: {
    gap: 10,
    marginTop: 14,
  },
  ctaButton: {
    backgroundColor: AUTH_UI.brandNavy,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: AUTH_UI.shadowNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    minHeight: 54,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaLabel: {
    color: AUTH_UI.textWhite,
    fontSize: 16,
    fontWeight: "800",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryLabel: {
    color: AUTH_UI.textWarmStrong,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: FONT_FRIENDLY_SANS,
  },
});