/**
 * mobile/app/auth/welcome.tsx
 * Welcome / onboarding entry screen.
 *
 * Designed to feel like a gentle, calming companion for expectant mothers.
 * Soft gradient background, warm typography, and emotionally grounded copy.
 *
 * Note: This screen is shown BEFORE authentication, so we don't fetch
 * any user data here. Personalization happens after login.
 *
 * Cross-platform: web + iOS + Android all render the same visual result.
 */

import { useRouter } from "expo-router";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, spacing, typography } from "@mamacare/ui";
import { HeartIcon } from "../../components/HeartIcon";

import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";

type GradientBackgroundProps = {
  children: React.ReactNode;
};

function GradientBackground({ children }: GradientBackgroundProps) {
  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.container,
          {
            // @ts-ignore — web-only CSS prop, passed through by react-native-web
            background: `linear-gradient(180deg, ${colors.rose[50]} 0%, #FFF8F4 50%, ${colors.rose[100]} 100%)`,
          },
        ]}
      >
        {children}
      </View>
    );
  }
  return (
    <ExpoLinearGradient
      colors={[colors.rose[50], "#FFF8F4", colors.rose[100]]}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {children}
    </ExpoLinearGradient>
  );
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Hello";
}

export default function WelcomeScreen() {
  const router = useRouter();
  const greeting = getTimeBasedGreeting();

  return (
    <GradientBackground>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.iconGlow}>
            <HeartIcon size={96} />
          </View>

          <Text style={styles.greeting}>{greeting}, mama</Text>
          <Text style={styles.logo}>MumCare</Text>
          <Text style={styles.tagline}>
            A gentle space for your pregnancy journey
          </Text>

          <View style={styles.divider} />

          <Text style={styles.welcomeMessage}>
            Whatever you're feeling today, that's okay.{"\n"}
            We're here with you.
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
    </GradientBackground>
  );
}

function hexToRgba(hex: string, opacity: number): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Cross-platform drop shadow helper.
 * - iOS: shadowColor / shadowOffset / shadowOpacity / shadowRadius
 * - Android: elevation
 * - Web: boxShadow (passed through by react-native-web)
 */
const softShadow = (
  color: string,
  offsetY: number,
  blurRadius: number,
  opacity: number
) =>
  Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: blurRadius,
    },
    android: {
      elevation: Math.round(blurRadius / 2),
    },
    web: {
      // @ts-ignore — web-only CSS prop
      boxShadow: `0px ${offsetY}px ${blurRadius}px ${hexToRgba(color, opacity)}`,
    },
  });

/**
 * Cross-platform soft glow / halo helper.
 */
const softGlow = (color: string, blurRadius: number, opacity: number) =>
  Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: opacity,
      shadowRadius: blurRadius,
    },
    android: {
      elevation: 8,
    },
    web: {
      // @ts-ignore — web-only CSS prop
      boxShadow: `0px 0px ${blurRadius}px ${hexToRgba(color, opacity)}`,
    },
  });

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[6],
    // On web, cap max width so tablet/desktop view doesn't stretch awkwardly
    ...Platform.select({
      web: {
        maxWidth: 480,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[6],
    paddingTop: spacing[12],
  },
  iconGlow: {
    marginBottom: spacing[5],
    ...softGlow(colors.rose[300], 20, 0.4),
  },
  greeting: {
    fontSize: typography.fontSize.base,
    color: colors.navy[500],
    fontWeight: typography.fontWeight.regular,
    marginBottom: spacing[3],
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
    fontStyle: "italic",
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: colors.rose[200],
    borderRadius: 1,
    marginBottom: spacing[7],
  },
  welcomeMessage: {
    fontSize: typography.fontSize.lg,
    color: colors.navy[700],
    textAlign: "center",
    paddingHorizontal: spacing[2],
    lineHeight: typography.fontSize.lg * 1.6,
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
    ...Platform.select({
      web: {
        // @ts-ignore — web-only CSS prop
        cursor: "pointer",
        // @ts-ignore
        transition: "transform 150ms ease, box-shadow 150ms ease",
      },
    }),
    ...softShadow(colors.rose[400], 4, 12, 0.25),
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
    ...Platform.select({
      web: {
        // @ts-ignore — web-only CSS prop
        cursor: "pointer",
      },
    }),
  },
  secondaryButtonText: {
    color: colors.rose[400],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
});