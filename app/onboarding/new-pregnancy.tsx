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

// ─── helpers ────────────────────────────────────────────────────────────────

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
  next.setDate(next.getDate() + days)
  return next;
}

function clampWeek(week: number): number {
  return Math.max(1, Math.min(42, week));
}

function deriveWeekFromLmp(lmp: Date): number {
  const now = new Date();
  const msPerDay = 86_400_000;
  const daysSinceLmp = Math.floor((now.getTime() - lmp.getTime()) / msPerDay);
  return clampWeek(Math.floor(daysSinceLmp / 7) + 1)
}

function deriveWeekFromEdd(edd: Date): number {
  const now = new Date();
  const msPerDay = 86_400_000;
  const daysUntilDue = Math.floor((edd.getTime() - now.getTime()) / msPerDay);
  return clampWeek(40 - Math.floor(daysUntilDue / 7));

}


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
})

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
}

// Helper functions
function handleEddChange(value: string) {
  const edd = parseIsoDate(value);
  if(!edd) {
    setForm((prev) => ({ ...prev, edd: value }));
    return;
  }

  if (isPastDate(edd)) {
    setForm((prev) => ({ ...prev, edd: value }));
    // setFormError("Estimated due date cannot be in the past.");
    return;
  }

  setFormError("");

  const autoWeek = deriveWeekFromEdd(edd);
  setForm((prev) => ({ ...prev, edd: value, week: String(autoWeek) }));
}


  async function handleSubmit() {

    if (!form.edd.trim()) {
      setFormError("Estimated due date is required.");
      return;
    }

    const week = Number(form.week);
    if (
      Number.isNaN(week) || 
      week < 1 ||
      week > 42
    ) {
      setFormError("Current week must be a number between 1 and 42.");
      return;
    }

    const lmpDate = parseIsoDate(form.lmp);
    const eddDate = parseIsoDate(form.edd);

    if (lmpDate && eddDate && 
        lmpDate > eddDate) {
      setFormError(
        "Last menstrual period must be before due date."
      );
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
  // activeDateField used below for inline validation hints
  
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
          <View style={styles.hero}>
            <View style={styles.iconShell}>
              <Ionicons name="calendar" size={32} color={AUTH_UI.textWhite} />
            </View>
            <Text style={styles.title}>New pregnancy journey</Text>
            <Text style={styles.subtitle}>
              Tell us a little about this pregnancy so we can personalise your experience from day one.
            </Text>
          </View>

          {/*  form error */}
           {formError ? (
            <view style={styles.warningBox}>
              <Text style={styles.warningText}>
                {formError}
                </Text>

            </view>
          ): null}
            

          {/* ── active pregnancy warning ── */}
          {activePregnancy && (
            <View style={styles.warningBox}>
              <Ionicons
                name="warning-outline"
                size={18}
                color={AUTH_UI.redAlertText}
                style={{ marginTop: 2 }}
              />
              <Text style={styles.warningText}>
                You already have an active pregnancy. Starting a new one will archive your current journey.
              </Text>
            </View>
          )}

          {/* ── form ── */}
          <View style={styles.form}>
            {/* nickname */}
            <View style={styles.field}>
              <Text style={styles.label}>Baby nickname (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Little Star"
                placeholderTextColor={AUTH_UI.textWarmMuted}
                value={form.baby_nickname}
                onChangeText={(v) => setForm({ ...form, baby_nickname: v })}
                maxLength={40}
                returnKeyType="next"
              />
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
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyText}>
                  {form.week ? `${form.week} weeks` : "—"}
                </Text>
              </View>
        
          </View>
           

            {/* multiple gestation */}
            <View style={styles.switchRow}>
              <View style={styles.switchLabelGroup}>
                <Text style={styles.label}>Multiple gestation</Text>
                <Text style={styles.switchSub}>Twins, triplets, or more</Text>
              </View>
              <Switch
                value={form.multiple_gestation}
                onValueChange={(v) => setForm({ ...form, multiple_gestation: v })}
                trackColor={{ false: AUTH_UI.lineSoftWarm, true: AUTH_UI.brandNavy }}
                thumbColor={AUTH_UI.textWhite}
              />
            </View>
          </View>

          {/* ── footer ── */}
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

const styles = StyleSheet.create({
  // ── layout ──────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingHorizontal: 24,
    backgroundColor: AUTH_UI.warmBackground,
  },
  content: {
    paddingBottom: 48,
    gap: 28,
  },

  hero: {
    gap: 16,
  },
  iconShell: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AUTH_UI.semanticBlue,
    shadowColor: AUTH_UI.shadowNavy,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 7,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
    color: AUTH_UI.textHeading,
    fontFamily: FONT_WARM_SERIF,
  },
  subtitle: {
    fontSize: 15,
    color: AUTH_UI.textBlack,
    lineHeight: 23,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: AUTH_UI.semanticSevereBgSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AUTH_UI.semanticSevereBorder20,
    padding: 14,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: AUTH_UI.redAlertText,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  inputGroup: { gap: 8 },
  inputWithIcon: { flexDirection: "row", alignItems: "center", backgroundColor: AUTH_UI.textWhite, borderRadius: AUTH_UI.inputRadius, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200] },
  inputHint: { fontSize: 13, color: AUTH_UI.textBlack, marginLeft: 2, lineHeight: 20, fontFamily: FONT_FRIENDLY_SANS },
  inputIcon: { marginLeft: 15 },
  
 readOnlyField: {
  backgroundColor: AUTH_UI.semanticNeutralLight,
  borderRadius: AUTH_UI.inputRadius,
  paddingHorizontal: AUTH_UI.fieldPaddingX,
  paddingVertical: AUTH_UI.fieldPaddingY,
  borderWidth: AUTH_UI.borderWidth,
  borderColor: AUTH_UI.lineSoftWarm,
  minHeight: 54,
  justifyContent: "center",
},

readOnlyText: {
  fontSize: 16,
  color: AUTH_UI.textWarmStrong,
  fontFamily: FONT_FRIENDLY_SANS,
  fontWeight: "600",
},
  form: {
    gap: 20,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: AUTH_UI.textWarmStrong,
    fontFamily: FONT_FRIENDLY_SANS,
    letterSpacing: 0.2,
  },
   input: { flex: 1, backgroundColor: AUTH_UI.textWhite, borderRadius: AUTH_UI.inputRadius, paddingHorizontal: AUTH_UI.fieldPaddingX, paddingVertical: AUTH_UI.fieldPaddingY, fontSize: 16, color: AUTH_UI.textBlack, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200], fontFamily: FONT_FRIENDLY_SANS },
 
  inputValid: {
    borderColor: AUTH_UI.semanticBlue,
  },
  hint: {
    fontSize: 12,
    color: AUTH_UI.semanticBlueMuted,
    fontFamily: FONT_FRIENDLY_SANS,
    marginTop: 2,
  },
  hintError: {
    fontSize: 12,
    color: AUTH_UI.redAlertText,
    fontFamily: FONT_FRIENDLY_SANS,
    marginTop: 2,
  },

  modeToggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: AUTH_UI.semanticNeutralLight,
    borderWidth: 1,
    borderColor: AUTH_UI.lineSoftWarm,
  },
  modeTabActive: {
    backgroundColor: AUTH_UI.semanticBluePale,
    borderColor: AUTH_UI.semanticBlue,
  },
  modeTabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: AUTH_UI.textWarmMuted,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  modeTabLabelActive: {
    color: AUTH_UI.semanticBlueMuted,
  },

  // ── switch row ────────────────────────────────────────────────────────────
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  switchLabelGroup: {
    gap: 2,
  },
  switchSub: {
    fontSize: 12,
    color: AUTH_UI.textWarmMuted,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  // ── footer ────────────────────────────────────────────────────────────────
  footer: {
    gap: 12,
    marginTop: 8,
  },
  ctaButton: {
    backgroundColor: AUTH_UI.brandNavy,
    borderRadius: AUTH_UI.inputRadius,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: AUTH_UI.shadowNavy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  ctaButtonDisabled: {
    opacity: 0.55,
  },
  ctaLabel: {
    color: AUTH_UI.textWhite,
    fontSize: 16,
    fontWeight: "800",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 14,
  },
  secondaryLabel: {
    color: AUTH_UI.textWarmStrong,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: FONT_FRIENDLY_SANS,
  },
});
