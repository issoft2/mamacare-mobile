/**
 * mobile/app/auth/welcome.tsx
 * Welcome / onboarding entry screen.
 */

import { useRouter } from "expo-router";

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "@mamacare/ui";
import { PregnancyAsterix } from "../../components/PregnancyAsterix";

export default function WelcomeScreen() {
  const router = useRouter();

  // Placeholder: In a real app, fetch pregnancy stage from user profile/context
  const pregnancyStage = "Second Trimester";

  // Empathetic messages for different stages (example)
  const stageMessages = {
    "First Trimester": "Welcome! The journey begins. It's normal to feel a mix of excitement and uncertainty. We're here for you every step.",
    "Second Trimester": "You're blossoming beautifully. Emotional ups and downs are part of the process—remember, you're not alone!",
    "Third Trimester": "Almost there! Take time to rest and connect with your baby. We're here to support your changing needs.",
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <PregnancyAsterix size={96} style={styles.asterix} />
        <Text style={styles.logo}>MumCare Assistant</Text>
        <Text style={styles.tagline}>Your intelligent pregnancy companion</Text>
        <Text style={styles.stageLabel}>{pregnancyStage}</Text>
        <Text style={styles.stageMessage}>{stageMessages[pregnancyStage]}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/auth/register")}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.rose[50],
    justifyContent: "space-between",
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[6],
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[6],
  },
  asterix: {
    marginBottom: spacing[4],
  },
  logo: {
    fontSize: typography.fontSize["4xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.rose[500],
    marginBottom: spacing[2],
    textAlign: "center",
  },
  tagline: {
    fontSize: typography.fontSize.lg,
    color: colors.navy[700],
    textAlign: "center",
    marginBottom: spacing[4],
  },
  stageLabel: {
    fontSize: typography.fontSize.base,
    color: colors.rose[400],
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
    textAlign: "center",
  },
  stageMessage: {
    fontSize: typography.fontSize.base,
    color: colors.navy[600],
    textAlign: "center",
    marginBottom: spacing[2],
    paddingHorizontal: spacing[2],
  },
  actions: {
    gap: spacing[3],
  },
  primaryButton: {
    backgroundColor: colors.rose[500],
    borderRadius: 16,
    paddingVertical: spacing[4],
    alignItems: "center",
    shadowColor: colors.rose[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  secondaryButton: {
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.rose[400],
    fontSize: typography.fontSize.base,
  },
});
