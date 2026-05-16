/**
 * mobile/app/profile/privacy.tsx
 *
 * Data and privacy — GDPR/NDPA consent management.
 *
 * Design philosophy:
 *  - Calm and respectful, NOT overly warm. Privacy decisions are serious;
 *    soothing them feels dishonest. We treat users as competent adults.
 *  - Soft cream-tinted background for visual continuity with the rest of
 *    the app, but more neutral than the care screens.
 *  - Clear, plain-language consent toggles (granular control as required
 *    by GDPR Article 7).
 *  - Native confirmation dialogs for destructive actions — they're
 *    familiar, hard to dismiss accidentally, and signal weight.
 *  - Encryption badge near the top to reassure users that the data they
 *    share is protected.
 */

import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { apiRequest } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";
import { getErrorMessage } from "@/lib/errors";

// ── Types ────────────────────────────────────────────────────────────────────

type ConsentTier =
  | "essential_health"
  | "ai_guidance"
  | "care_team_sharing"
  | "research";

interface ConsentItem {
  key: ConsentTier;
  title: string;
  description: string;
  required: boolean;
}

// ── Configuration ────────────────────────────────────────────────────────────

const CONSENT_TIERS: ConsentItem[] = [
  {
    key: "essential_health",
    title: "Essential health data",
    description:
      "Required for the app to work — your symptom logs, profile, and clinical records.",
    required: true,
  },
  {
    key: "ai_guidance",
    title: "AI health guidance",
    description:
      "Let MumCare analyze your symptoms and offer personalized guidance.",
    required: false,
  },
  {
    key: "care_team_sharing",
    title: "Care team sharing",
    description:
      "Share relevant information with your midwife, GP, or specialist.",
    required: false,
  },
  {
    key: "research",
    title: "Anonymous research",
    description:
      "Contribute fully anonymous data to pregnancy health research.",
    required: false,
  },
];

const SOFT_CREAM = "#FFFBF7";

// ── Component ────────────────────────────────────────────────────────────────

export default function PrivacyScreen() {
  const { signOut } = useAuth();
  const router = useRouter();

  // Assume optional tiers granted at signup. Required is always true.
  const [consents, setConsents] = useState<Record<ConsentTier, boolean>>({
    essential_health: true,
    ai_guidance: true,
    care_team_sharing: true,
    research: true,
  });

  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingTier, setSavingTier] = useState<ConsentTier | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function recordConsentEvent(
    tier: ConsentTier,
    nextValue: boolean
  ): Promise<boolean> {
    setError("");
    try {
      await apiRequest("/data/consent", {
        method: "POST",
        body: JSON.stringify({
          consent_tier: tier,
          action: nextValue ? "granted" : "withdrawn",
          consent_text_version: "v1.0",
        }),
      });
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Couldn't save your choice right now."));
      return false;
    }
  }

  async function handleConsentToggle(tier: ConsentTier, next: boolean) {
    setSuccessMessage("");
    const prev = consents[tier];

    // Withdrawing an optional consent should ask first — these decisions
    // have downstream effects (no AI guidance, no care-team auto-share, etc.)
    if (!next && prev) {
      Alert.alert(
        "Turn this off?",
        getWithdrawalCopy(tier),
        [
          { text: "Keep it on", style: "cancel" },
          {
            text: "Turn off",
            style: "destructive",
            onPress: () => commitToggle(tier, next),
          },
        ]
      );
      return;
    }

    await commitToggle(tier, next);
  }

  async function commitToggle(tier: ConsentTier, next: boolean) {
    const prev = consents[tier];
    setConsents((c) => ({ ...c, [tier]: next }));
    setSavingTier(tier);

    const ok = await recordConsentEvent(tier, next);

    setSavingTier(null);

    if (ok) {
      setSuccessMessage("Preference saved");
      setTimeout(() => setSuccessMessage(""), 1800);
    } else {
      // Revert on error
      setConsents((c) => ({ ...c, [tier]: prev }));
    }
  }

  async function handleExportData() {
    setError("");
    setSuccessMessage("");
    setExporting(true);
    try {
      await apiRequest("/data/export", {
        method: "POST",
        body: JSON.stringify({ export_type: "dsar" }),
      });
      Alert.alert(
        "Export requested",
        "We'll email you a copy of your data within 30 days, as required by law.",
        [{ text: "OK" }]
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Couldn't request your export right now."));
    } finally {
      setExporting(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Delete your account?",
      "Your personal data will be deleted within 30 days.\n\n" +
        "Your clinical health records will be kept for 7 years after your " +
        "due date, as required by UK clinical guidelines (DCB0129).\n\n" +
        "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete my account",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await apiRequest("/data/delete", { method: "POST" });
              await signOut();
            } catch (err: unknown) {
              setError(
                getErrorMessage(err, "Couldn't delete your account right now.")
              );
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/tabs/home");
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.navy[700]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Data & privacy</Text>
        <Text style={styles.subtitle}>
          You control what's shared, when, and with whom.
        </Text>

        {/* Encryption reassurance */}
        <View style={styles.assuranceCard}>
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={colors.rose[500]}
            style={{ marginRight: spacing[3] }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.assuranceTitle}>End-to-end encrypted</Text>
            <Text style={styles.assuranceBody}>
              Your health data is encrypted and never sold to anyone.
            </Text>
          </View>
        </View>

        {/* Status banners */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle"
              size={18}
              color="#A32D2D"
              style={{ marginRight: spacing[2] }}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {successMessage && !error ? (
          <View style={styles.successBanner}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#1E7E34"
              style={{ marginRight: spacing[2] }}
            />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* ── Your consent ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your consent</Text>
          <Text style={styles.sectionHint}>
            You can change these any time. Turning something off may limit
            related features.
          </Text>

          <View style={styles.groupCard}>
            {CONSENT_TIERS.map((tier, idx) => (
              <View
                key={tier.key}
                style={[
                  styles.consentRow,
                  idx < CONSENT_TIERS.length - 1 && styles.rowDivider,
                ]}
              >
                <View style={styles.consentText}>
                  <View style={styles.consentTitleRow}>
                    <Text style={styles.consentTitle}>{tier.title}</Text>
                    {tier.required ? (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredBadgeText}>Required</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.consentDescription}>
                    {tier.description}
                  </Text>
                </View>
                <Switch
                  value={consents[tier.key]}
                  onValueChange={(v) =>
                    !tier.required && handleConsentToggle(tier.key, v)
                  }
                  disabled={tier.required || savingTier === tier.key}
                  trackColor={{
                    false: colors.rose[100],
                    true: colors.rose[400],
                  }}
                  thumbColor={
                    consents[tier.key] ? colors.rose[500] : colors.white
                  }
                  ios_backgroundColor={colors.rose[100]}
                />
              </View>
            ))}
          </View>
        </View>

        {/* ── Your rights ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your rights</Text>
          <Text style={styles.sectionHint}>
            Under UK GDPR and Nigeria NDPA, you have the right to access,
            correct, and delete your personal data.
          </Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleExportData}
            disabled={exporting}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons
                name="download-outline"
                size={20}
                color={colors.navy[700]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Download my data</Text>
              <Text style={styles.actionHint}>
                We'll email you a copy within 30 days.
              </Text>
            </View>
            {exporting ? (
              <ActivityIndicator size="small" color={colors.navy[600]} />
            ) : (
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.navy[400]}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* ── Delete account ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, styles.dangerLabel]}>
            Delete account
          </Text>

          <TouchableOpacity
            style={[styles.actionRow, styles.dangerRow]}
            onPress={handleDeleteAccount}
            disabled={deleting}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, styles.dangerIconCircle]}>
              <Ionicons name="trash-outline" size={20} color="#A32D2D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, styles.dangerActionTitle]}>
                Delete my account
              </Text>
              <Text style={styles.actionHint}>
                This cannot be undone.
              </Text>
            </View>
            {deleting ? (
              <ActivityIndicator size="small" color="#A32D2D" />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#A32D2D" />
            )}
          </TouchableOpacity>
        </View>

        {/* Footer note */}
        <Text style={styles.retentionNote}>
          Health records are retained for 7 years after your due date as
          required by UK clinical guidelines (DCB0129).
        </Text>
      </ScrollView>
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWithdrawalCopy(tier: ConsentTier): string {
  switch (tier) {
    case "ai_guidance":
      return "MumCare will no longer analyze your symptoms or offer personalized guidance.";
    case "care_team_sharing":
      return "We won't share any information with your care team. You'll need to contact them directly.";
    case "research":
      return "Your data will no longer be included in anonymous research.";
    default:
      return "This will limit related features.";
  }
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SOFT_CREAM,
  },

  // Header
  header: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[2],
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
  },

  // Content
  content: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },

  // Titles
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[700],
    marginBottom: spacing[2],
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.navy[500],
    marginBottom: spacing[5],
    lineHeight: typography.fontSize.base * 1.5,
  },

  // Encryption assurance card
  assuranceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing[4],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.rose[100],
  },
  assuranceTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy[700],
    marginBottom: 2,
  },
  assuranceBody: {
    fontSize: typography.fontSize.xs,
    color: colors.navy[500],
    lineHeight: typography.fontSize.xs * 1.5,
  },

  // Banners
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCEBEB",
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  errorText: {
    flex: 1,
    color: "#A32D2D",
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F4EA",
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  successText: {
    color: "#1E7E34",
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },

  // Sections
  section: {
    marginBottom: spacing[7],
  },
  sectionLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy[700],
    marginBottom: spacing[1],
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: typography.fontSize.sm,
    color: colors.navy[400],
    marginBottom: spacing[3],
    fontStyle: "italic",
    lineHeight: typography.fontSize.sm * 1.5,
  },
  dangerLabel: {
    color: "#A32D2D",
  },

  // Group card
  groupCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rose[100],
    borderRadius: 16,
    overflow: "hidden",
  },

  // Consent rows
  consentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.rose[50],
  },
  consentText: {
    flex: 1,
    paddingRight: spacing[3],
  },
  consentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[1],
    gap: spacing[2],
  },
  consentTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.navy[700],
  },
  requiredBadge: {
    backgroundColor: colors.navy[50],
    borderRadius: 6,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  requiredBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy[600],
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  consentDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.navy[400],
    lineHeight: typography.fontSize.xs * 1.5,
  },

  // Action row (export / delete)
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rose[100],
    borderRadius: 16,
    padding: spacing[4],
    ...Platform.select({
      web: { /* @ts-ignore */ cursor: "pointer" },
    }),
  },
  dangerRow: {
    borderColor: "#FCD2D2",
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.rose[50],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[3],
  },
  dangerIconCircle: {
    backgroundColor: "#FCEBEB",
  },
  actionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.navy[700],
    marginBottom: 2,
  },
  dangerActionTitle: {
    color: "#A32D2D",
  },
  actionHint: {
    fontSize: typography.fontSize.xs,
    color: colors.navy[400],
    lineHeight: typography.fontSize.xs * 1.5,
  },

  // Footer
  retentionNote: {
    fontSize: typography.fontSize.xs,
    color: colors.navy[400],
    textAlign: "center",
    lineHeight: typography.fontSize.xs * 1.6,
    marginTop: spacing[2],
    paddingHorizontal: spacing[4],
  },
});