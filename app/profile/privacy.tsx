/**
 * mobile/app/profile/privacy.tsx
 * Data and privacy — GDPR/NDPA consent management.
 */

import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiRequest } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";

import { getErrorMessage } from "@/lib/errors";

const CONSENT_TIERS = [
  {
    key: "essential_health",
    title: "Essential Health Data",
    description: "Required to provide the service. Includes symptom logs, profile data, and clinical records.",
    required: true,
  },
  {
    key: "ai_guidance",
    title: "AI Health Guidance",
    description: "Allows MamaCare AI to analyse your symptoms and provide personalised guidance.",
    required: false,
  },
  {
    key: "care_team_sharing",
    title: "Care Team Sharing",
    description: "Allows MamaCare AI to share relevant information with your midwife or GP.",
    required: false,
  },
  {
    key: "research",
    title: "Anonymous Research",
    description: "Contributes anonymised data to pregnancy health research. Fully optional.",
    required: false,
  },
];

export default function PrivacyScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleExportData() {
    setLoading(true);
    try {
      await apiRequest("/data/export", {
        method: "POST",
        body: JSON.stringify({ export_type: "dsar" }),
      });
      Alert.alert(
        "Export Requested",
        "Your data export has been queued. You will receive a notification when it is ready to download.",
        [{ text: "OK" }]
      );
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        getErrorMessage(err, "Failed to request export.")
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? Your health records will be retained for 7 years as required by UK clinical guidelines. All other personal data will be deleted within 30 days.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest("/data/delete", { method: "POST" });
              await signOut();
            } catch (err: unknown) {
              Alert.alert(
                "Error",
                getErrorMessage(err, "Failed to delete account.")
              );
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Data & Privacy</Text>
      <Text style={styles.subtitle}>
        Your health data is encrypted and never sold. You are always in control.
      </Text>

      {/* Consent tiers */}
      <Text style={styles.sectionTitle}>Data Consent</Text>
      {CONSENT_TIERS.map((tier) => (
        <View key={tier.key} style={styles.consentCard}>
          <View style={styles.consentHeader}>
            <Text style={styles.consentTitle}>{tier.title}</Text>
            {tier.required && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>REQUIRED</Text>
              </View>
            )}
          </View>
          <Text style={styles.consentDescription}>{tier.description}</Text>
        </View>
      ))}

      {/* Your rights */}
      <Text style={styles.sectionTitle}>Your Rights</Text>
      <Text style={styles.rightsText}>
        Under UK GDPR and Nigeria NDPA, you have the right to access, correct, and delete your personal data.
      </Text>

      {/* Export data */}
      <TouchableOpacity
        style={styles.exportButton}
        onPress={handleExportData}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.navy[700]} />
          : <Text style={styles.exportButtonText}>📥  Request My Data Export</Text>
        }
      </TouchableOpacity>

      {/* Delete account */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteButtonText}>🗑️  Delete My Account</Text>
      </TouchableOpacity>

      <Text style={styles.retentionNote}>
        Health records are retained for 7 years after your due date as required by UK clinical guidelines (DCB0129).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.white },
  content:      { padding: spacing[6], maxWidth: 480, alignSelf: "center", width: "100%", paddingBottom: spacing[12] },
  title:        { fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.navy[700], marginBottom: spacing[2] },
  subtitle:     { fontSize: typography.fontSize.base, color: colors.gray[500], marginBottom: spacing[8], lineHeight: 24 },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.gray[800], marginBottom: spacing[3], marginTop: spacing[4] },
  consentCard:  { backgroundColor: colors.gray[50], borderRadius: 12, padding: spacing[4], marginBottom: spacing[3], gap: spacing[2] },
  consentHeader:{ flexDirection: "row", alignItems: "center", gap: spacing[2] },
  consentTitle: { flex: 1, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.gray[800] },
  requiredBadge:{ backgroundColor: colors.navy[100], borderRadius: 6, paddingHorizontal: spacing[2], paddingVertical: 2 },
  requiredText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.navy[700] },
  consentDescription: { fontSize: typography.fontSize.sm, color: colors.gray[500], lineHeight: 20 },
  rightsText:   { fontSize: typography.fontSize.sm, color: colors.gray[500], lineHeight: 22, marginBottom: spacing[6] },
  exportButton: { borderWidth: 1, borderColor: colors.navy[700], borderRadius: 12, paddingVertical: spacing[4], alignItems: "center", marginBottom: spacing[3] },
  exportButtonText: { color: colors.navy[700], fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium },
  deleteButton: { borderWidth: 1, borderColor: "#A32D2D", borderRadius: 12, paddingVertical: spacing[4], alignItems: "center", marginBottom: spacing[6] },
  deleteButtonText: { color: "#A32D2D", fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium },
  retentionNote:{ fontSize: typography.fontSize.xs, color: colors.gray[400], textAlign: "center", lineHeight: 18 },
});
