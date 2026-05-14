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

import { Stack, useRouter } from "expo-router";
import {
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { colors, spacing, typography } from "@mamacare/ui";
import { HeartIcon } from "../../components/HeartIcon";

/**
 * TO SWAP THE BACKGROUND IMAGE:
 * Replace assets/welcome-bg.png with your mother-and-baby image.
 * Keep it soft/dreamy — the overlay will keep text readable.
 */
const WELCOME_BG = require("../../assets/welcome-bg.png");

type GradientBackgroundProps = {
  children: React.ReactNode;
};

function GradientBackground({ children }: GradientBackgroundProps) {
  const inner = (
    // Soft translucent overlay so the background image doesn't overpower text
    <SafeAreaView edges={["top", "bottom"]} style={styles.overlay}>
      {children}
    </SafeAreaView>
  );

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.container,
          {
            // @ts-ignore — web-only CSS prop, passed through by react-native-web
            backgroundImage: `url(${WELCOME_BG}), linear-gradient(180deg, ${colors.rose[50]} 0%, #FFF8F4 50%, ${colors.rose[100]} 100%)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "soft-light",
          },
        ]}
      >
        {inner}
      </View>
    );
  }

  return (
    <ImageBackground
      source={WELCOME_BG}
      style={styles.container}
      resizeMode="cover"
      imageStyle={styles.bgImage}
    >
      {/* Soft gradient overlay — keeps text readable over the background image */}
      <ExpoLinearGradient
        colors={[`${colors.rose[50]}99`, "#FFF8F466", `${colors.rose[100]}99`]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {inner}
    </ImageBackground>
  );
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Hello";
}

// Rotating daily affirmations — cycle by day of year, no login needed.
// Written to resonate at any pregnancy stage: early days, first, second, or third trimester.
const DAILY_MESSAGES = [
  "Every mama's journey is different. Yours matters. We're here for every part of it.",
  "You are already doing something extraordinary — growing a life takes courage and love.",
  "Rest is not giving up. Rest is how you carry on. Be gentle with yourself today.",
  "Your feelings are valid — the joy, the fear, the uncertainty. All of it belongs here.",
  "Whatever today brings, you don't have to face it alone. We're with you.",
  "Small steps still move you forward. You are doing beautifully, even on the hard days.",
  "Your body knows what it's doing. Trust it, nourish it, and honour it today.",
  "It's okay not to have all the answers. One day at a time is enough.",
  "You are stronger than you know. And on the days you forget, we'll remember for you.",
  "The love you already have for your baby is something remarkable. Hold on to that.",
  "Breathe. You are enough, exactly as you are, right now.",
  "Pregnancy is a journey — joyful, exhausting, uncertain, and beautiful, often all at once.",
  "You belong here. Your story, your journey, your pace — all welcome.",
  "Today, give yourself permission to simply be. That is more than enough.",
  "You are not alone. Thousands of mamas are walking this same road with you.",
  "Your instincts as a mother are already forming. Trust yourself.",
  "It is okay to ask for help. Strength is knowing when to lean on others.",
  "Every heartbeat you feel is a reminder of the incredible thing you are doing.",
  "On the days that feel heavy, remember — you've made it through every hard day so far.",
  "You are seen, supported, and never alone on this journey.",
  "Nourish your body, quiet your mind, and know that you are doing your very best.",
  "The uncertainty you feel is part of every mama's story. You are in good company.",
  "Your baby is lucky to have someone who cares this deeply already.",
  "Take a moment for yourself today. You deserve care too, not just those you love.",
  "There is no perfect way to be pregnant. Your way is the right way.",
  "Even when it's hard to see it — you are growing, changing, and becoming.",
  "Lean into the gentle moments. They are more plentiful than they seem.",
  "You are at the beginning of a love story that will last a lifetime.",
  "However you're feeling right now — you belong here.",
  "Every mama worries. It means you already love deeply. That is a beautiful thing.",
];

function getDailyMessage(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return DAILY_MESSAGES[dayOfYear % DAILY_MESSAGES.length];
}

export default function WelcomeScreen() {
  const router = useRouter();
  const greeting = getTimeBasedGreeting();
  const dailyMessage = getDailyMessage();

  return (
    <GradientBackground>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <View style={styles.hero}>
          {/* Brand unit: heart icon + logo, centered and aligned */}
          <View style={styles.brandUnit}>
            <View style={styles.iconGlow}>
              <HeartIcon size={72} />
            </View>
            <Text style={styles.logo}>MamaCare</Text>
          </View>

          <Text style={styles.greeting}>{greeting}, mama</Text>

          <Text style={styles.tagline}>
            A gentle space for your pregnancy journey
          </Text>

          <Text style={styles.ornament}>· ♡ ·</Text>

          <Text style={styles.welcomeMessage}>{dailyMessage}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/auth/register")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Begin your journey with MamaCare"
          >
            <Text style={styles.primaryButtonText}>Begin your journey</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/auth/login")}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign in to your MamaCare account"
          >
            <Text style={styles.secondaryButtonText}>Welcome back</Text>
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
  bgImage: {
    // Raise this value (0–1) to make the background image more visible.
    // Lower it if it overpowers the text. 0.35 is a good starting point.
    opacity: 0.7,
  },
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
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
    paddingTop: spacing[4],
  },
  brandUnit: {
    alignItems: "center",
    marginBottom: spacing[5],
  },
  iconGlow: {
    marginBottom: spacing[1],
    ...softGlow(colors.rose[300], 20, 0.4),
  },
  greeting: {
    fontSize: typography.fontSize.base,
    color: colors.navy[500],
    fontWeight: typography.fontWeight.normal,
    marginBottom: spacing[3],
    textAlign: "center",
    letterSpacing: 0.3,
  },
  logo: {
    fontSize: typography.fontSize["4xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.rose[500],
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
  ornament: {
    fontSize: typography.fontSize.xl,
    color: colors.rose[400],
    textAlign: "center",
    marginBottom: spacing[5],
    letterSpacing: 6,
  },
  welcomeMessage: {
    fontSize: typography.fontSize.lg,
    color: colors.rose[700],
    textAlign: "center",
    paddingHorizontal: spacing[4],
    lineHeight: typography.fontSize.lg * 1.8,
    fontWeight: typography.fontWeight.normal,
    fontStyle: "italic",
  },
  actions: {
    gap: spacing[3],
    alignItems: "center",
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
