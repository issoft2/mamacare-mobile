/**
 * mobile/components/MedicalDetailsCard.tsx
 *
 * Gentle prompt shown on the home screen when the user's profile is missing
 * optional medical details. Dismissable. Doesn't nag.
 */

import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, typography } from "@mamacare/ui";
import type { Profile } from "@mamacare/types";

type Props = {
  profile: Profile;
  onDismiss: () => void;
};

/**
 * Returns true if the profile is missing optional medical fields.
 * Call this before rendering the card.
 */
export function shouldShowMedicalDetailsPrompt(profile: Profile | null | undefined): boolean {
  if (!profile) return false;

  // Show the prompt if ANY of the optional fields are missing.
  return (
    !profile.blood_type ||
    !profile.lmp_date ||
    profile.gravida == null ||
    profile.parity == null ||
    !profile.known_conditions?.length ||
    !profile.allergies?.length ||
    // !profile.nhs_number ||
    // !profile.nhia_number
  );
}

export function MedicalDetailsCard({ profile, onDismiss }: Props) {
  const router = useRouter();

  const completedCount = countCompletedOptionalFields(profile);
  const totalCount = 6;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Help us know you better</Text>
        <Text style={styles.progress}>
          {completedCount} of {totalCount} completed
        </Text>
      </View>

      <Text style={styles.body}>
        Sharing a few more details lets us personalize your experience. Skip
        anything you'd rather not share right now.
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/profile/medical")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Complete your medical profile"
        >
          <Text style={styles.primaryButtonText}>Complete profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onDismiss}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Dismiss medical profile reminder"
        >
          <Text style={styles.secondaryButtonText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function countCompletedOptionalFields(profile: Profile): number {
  let count = 0;
  if (profile.blood_type) count++;
  if (profile.lmp_date) count++;
  if (profile.gravida != null) count++;
  if (profile.parity != null) count++;
  if (profile.known_conditions?.length) count++;
  if (profile.allergies?.length) count++;
  // if (profile.nhs_number) count++;
  // if (profile.nhia_number) count++;
  return count;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.rose[100],
    ...Platform.select({
      ios: {
        shadowColor: colors.rose[200],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        // @ts-ignore
        boxShadow: `0px 2px 8px rgba(251, 207, 232, 0.3)`,
      },
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy[700],
  },
  progress: {
    fontSize: typography.fontSize.xs,
    color: colors.rose[400],
    fontWeight: typography.fontWeight.medium,
  },
  body: {
    fontSize: typography.fontSize.sm,
    color: colors.navy[600],
    lineHeight: typography.fontSize.sm * 1.5,
    marginBottom: spacing[4],
  },
  actions: {
    flexDirection: "row",
    gap: spacing[3],
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: colors.rose[500],
    borderRadius: 12,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    flex: 1,
    alignItems: "center",
    ...Platform.select({
      web: { /* @ts-ignore */ cursor: "pointer" },
    }),
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  secondaryButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    ...Platform.select({
      web: { /* @ts-ignore */ cursor: "pointer" },
    }),
  },
  secondaryButtonText: {
    color: colors.navy[400],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
