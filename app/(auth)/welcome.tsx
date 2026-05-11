/**
 * mobile/app/(auth)/welcome.tsx
 * Welcome / onboarding entry screen.
 */

import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "@mamacare/ui";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>MamaCare AI</Text>
        <Text style={styles.tagline}>Your intelligent pregnancy companion</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/(auth)/login")}
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
    backgroundColor: colors.navy[700],
    justifyContent: "space-between",
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[6],
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: typography.fontSize["4xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing[3],
  },
  tagline: {
    fontSize: typography.fontSize.lg,
    color: colors.rose[200],
    textAlign: "center",
  },
  actions: {
    gap: spacing[3],
  },
  primaryButton: {
    backgroundColor: colors.rose[500],
    borderRadius: 12,
    paddingVertical: spacing[4],
    alignItems: "center",
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
    color: colors.rose[200],
    fontSize: typography.fontSize.base,
  },
});
