/**
 * mobile/components/MedicalDetailsCard.tsx
 *
 * Gentle prompt shown on the home screen when the user's profile is missing
 * optional medical details. Dismissable. Doesn't nag.
 */

import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing } from "@mumcare/ui";
import { LinearGradient } from "expo-linear-gradient";
import { ctaButtonStyles, ctaGradientColors } from "@/components/styles/ctaButton";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";
import type { Profile } from "@mumcare/types";

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
    !profile.allergies?.length
  
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
          style={[ctaButtonStyles.button, styles.primaryButton]}
          onPress={() => router.push("/profile/medical")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Complete your medical profile"
        >
          <LinearGradient
            colors={ctaGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={ctaButtonStyles.gradient}
          >
            <Text style={ctaButtonStyles.text}>Complete profile</Text>
          </LinearGradient>
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
  return count;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: AUTH_UI.cardRadius,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
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
    fontSize: 24,
    fontWeight: "800",
    color: AUTH_UI.textHeading,
    fontFamily: FONT_WARM_SERIF,
  },
  progress: {
    fontSize: 13,
    color: AUTH_UI.linkBerry,
    fontWeight: "700",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  body: {
    fontSize: 15,
    color: AUTH_UI.textBlack,
    lineHeight: 22,
    marginBottom: spacing[4],
    fontFamily: FONT_FRIENDLY_SANS,
  },
  actions: {
    flexDirection: "row",
    gap: spacing[3],
    alignItems: "center",
  },
  primaryButton: {
    borderRadius: 20,
    flex: 1,
    overflow: "hidden",
    ...Platform.select({
      web: { /* @ts-ignore */ cursor: "pointer" },
    }),
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  secondaryButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    ...Platform.select({
      web: { /* @ts-ignore */ cursor: "pointer" },
    }),
  },
  secondaryButtonText: {
    color: AUTH_UI.linkBerry,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: FONT_FRIENDLY_SANS,
  },
});
