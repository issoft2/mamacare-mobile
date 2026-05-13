/**
 * mobile/app/auth/welcome.tsx
 * Welcome / onboarding entry screen.
 *
 * Designed to feel like a gentle, calming companion for expectant mothers.
 * Soft gradient background, warm typography, and emotionally grounded copy.
 */

import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "@mamacare/ui";
import { PregnancyAsterix } from "../../components/PregnancyAsterix";

export default function WelcomeScreen() {
  const router = useRouter();

  // Placeholder: In a real app, fetch pregnancy stage from user profile/context.
  // Until profile is loaded, consider hiding stage to avoid showing a wrong stage.
  const pregnancyStage = "Second Trimester";

  // Empathetic, brief messages — keep short for emotional impact
  const stageMessages = {
    "First Trimester":
      "Welcome, mama. Whatever you're feeling today, that's okay. We're here with you.",
    "Second Trimester":
      "You're doing beautifully. One moment at a time — we're here with you.",
    "Third Trimester":
      "Almost there, mama. Rest when you need to. We're here with you.",
  };

  // Soft, time-aware greeting
  const greeting = getTimeBasedGreeting();

  return (
    <LinearGradient
      colors={[colors.rose[50], "#FFF8F4", colors.rose[100]]}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.iconGlow}>
            <PregnancyAsterix size={96} style={styles.asterix} />
          </View>

          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.logo}>MumCare</Text>
          <Text style={styles.tagline}>
            A gentle space for your pregnancy journey
          </Text>

          <View style={styles.divider} />

          <Text style={styles.stageLabel}>{pregnancyStage}</Text>
          <Text style={styles.stageMessage}>
            {stageMessages[pregnancyStage]}
          </Text>
        </View>

        <View style={styles.actions}>
          <Text style={styles.actionsHint}>Whenever you're ready</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/auth/register")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Begin your journey</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/auth/login")}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>
              I already have an account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Hello";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
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
  iconGlow: {
    // Soft halo effect around the icon for warmth
    shadowColor: colors.rose[300],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: spacing[5],
  },
  asterix: {
    // Component handles its own sizing
  },
  greeting: {
    fontSize: typography.fontSize.base,
    color: colors.navy[500],
    fontWeight: typography.fontWeight.regular,
    marginBottom: spacing[1],
    textAlign: "center",
    letterSpacing: 0.3,
  },
  logo: {
    fontSize: typography.fontSize["4xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.rose[500],
    marginBottom: spacing[2],
    textAlign: "center",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.navy[600],
    textAlign: "center",
    marginBottom: spacing[6],
    paddingHorizontal: spacing[4],
    lineHeight: typography.fontSize.base * 1.5,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: colors.rose[200],
    borderRadius: 1,
    marginBottom: spacing[5],
  },
  stageLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.rose[400],
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[2],
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  stageMessage: {
    fontSize: typography.fontSize.lg,
    color: colors.navy[700],
    textAlign: "center",
    paddingHorizontal: spacing[2],
    lineHeight: typography.fontSize.lg * 1.5,
    fontWeight: typography.fontWeight.regular,
  },
  actions: {
    gap: spacing[3],
    alignItems: "center",
  },
  actionsHint: {
    fontSize: typography.fontSize.sm,
    color: colors.navy[400],
    textAlign: "center",
    marginBottom: spacing[2],
    fontStyle: "italic",
  },
  primaryButton: {
    backgroundColor: colors.rose[500],
    borderRadius: 20,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    alignItems: "center",
    width: "100%",
    shadowColor: colors.rose[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.rose[400],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
});