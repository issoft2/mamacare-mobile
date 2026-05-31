/**
 * mobile/app/auth/login.tsx
 *
 * mumcare Login Screen — emotionally warm, brand-aligned.
 *
 * Design philosophy:
 *  - Top half mirrors the welcome screen atmosphere: soft photo overlay,
 *    heart badge, intimate greeting — so the user never feels they left
 *  - Form lives in a floating white card that rises from the bottom,
 *    giving the screen two distinct emotional zones: warmth → action
 *  - Every word speaks to the person, not the task
 *  - Input labels use rose small-caps (matches care team form language)
 *  - "Forgot password?" is inline with label — never a hunt
 */

import { useClerk, useSignIn } from "@clerk/clerk-expo";
import { useRouter, Stack } from "expo-router";
import { useState, useMemo } from "react";

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { colors, shadows } from "@mumcare/ui";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { getErrorMessage } from "@/lib/errors";
import { goHomeAfterClerkSetActive } from "@/lib/goHomeAfterClerkSetActive";
import { resetClerkForSignIn } from "@/lib/resetClerkForSignIn";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";
import { getTimeBasedGreeting, getDailyMessage } from "../../lib/greetings";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";



const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const WELCOME_BG = require("../../assets/welcome-bg.png");
const APP_LOGO = require("../../assets/mumlogo.png");
const CREAM = AUTH_UI.cream;
const CARD_RADIUS = 32;
const TEXT_BLACK = AUTH_UI.textBlack;
const TEXT_HEADING = AUTH_UI.textHeading;
const TEXT_WHITE = AUTH_UI.textWhite;
const LINK_BERRY = AUTH_UI.linkBerry;

function normalizeClerkTarget(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      const path = `${url.pathname}${url.search}${url.hash}`;
      return path || null;
    } catch {
      return null;
    }
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const clerk = useClerk();
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const isCompact = width < 360;
  const isLargeText = fontScale >= 1.2;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const greeting = useMemo(() => getTimeBasedGreeting(), []);
  const dailyMessage = useMemo(() => getDailyMessage(), []);

  async function handleLogin() {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    try {
      await resetClerkForSignIn(clerk);
      const result = await signIn.create({ identifier: email, password });

      if (typeof __DEV__ !== "undefined" && __DEV__) {
        // eslint-disable-next-line no-console
        console.log("Login signIn.create result:", {
          status: result.status,
          createdSessionId: result.createdSessionId ?? null,
        });
      }

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({
          session: result.createdSessionId,
          navigate: async (params) => {
            const session = params.session;
            const sessionTaskUrl = (params as { sessionTaskUrl?: string }).sessionTaskUrl;
            const redirectUrl = (params as { redirectUrl?: string }).redirectUrl;
            const target =
              normalizeClerkTarget(sessionTaskUrl) ??
              normalizeClerkTarget(redirectUrl) ??
              (session ? "/tabs/home" : "/auth/welcome");
            router.replace(target as any);
          },
        });

        if (typeof __DEV__ !== "undefined" && __DEV__) {
          // eslint-disable-next-line no-console
          console.log("Login setActive completed for session:", result.createdSessionId);
        }
      } else if (result.status === "needs_second_factor") {
        // TODO: navigate to dedicated MFA screen
        Alert.alert(
          "One more step",
          "Please check your authenticator app to complete sign in."
        );
      }
    } catch (err) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        // eslint-disable-next-line no-console
        console.warn("Login failed with raw error:", err);
      }
      Alert.alert(
        "Couldn't sign you in",
        getErrorMessage(err, "Please check your details and try again.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Image
        source={WELCOME_BG}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <LinearGradient
        colors={[
          AUTH_UI.overlayStart,
          AUTH_UI.overlayEnd,
          AUTH_UI.warmBackground,
        ]}
        locations={[0, 0.46, 0.78]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Hero zone — mirrors welcome screen atmosphere ─────── */}
            <View style={[styles.hero, isCompact && styles.heroCompact]}>

            {/* Back button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.navy[700]} />
            </TouchableOpacity>

            {/* Brand logo */}
            <View style={styles.brandRow}>
              <View style={styles.logoPlate}>
                <Image source={APP_LOGO} style={styles.logoMark} resizeMode="cover" />
              </View>
            </View>

            {/* Warm welcome-back message */}
            <View style={[styles.heroText, isCompact && styles.heroTextCompact]}>
             <Text style={[styles.timeGreeting, isCompact && styles.timeGreetingCompact]}>{greeting}, mama</Text>
            <Text style={[styles.dailyQuote, isCompact && styles.dailyQuoteCompact]}>"{dailyMessage}"</Text>

            </View>
            </View>

          {/* ── Form card — floats up from the hero ──────────────── */}
          <View style={[styles.card, isCompact && styles.cardCompact, isLargeText && styles.cardLargeText]}>
            <Text style={[styles.cardTitle, isCompact && styles.cardTitleCompact]}>Sign in</Text>
            <Text style={styles.cardSubtitle}>
          
            </Text>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                placeholder="mama@example.com"
                placeholderTextColor={TEXT_BLACK}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={[styles.labelRow, isLargeText && styles.labelRowStack]}>
                <Text style={[styles.label, styles.labelInline]}>Password</Text>
                <TouchableOpacity
                  // onPress={() => router.push("/auth/forgot-password")}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Your password"
                  placeholderTextColor={TEXT_BLACK}
                  value={password}
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.rose[300]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In CTA */}
            <TouchableOpacity
              style={ctaButtonStyles.button}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.87}
            >
              <LinearGradient
                colors={ctaGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={ctaButtonStyles.gradient}
              >
                {loading ? (
                  <ActivityIndicator color={AUTH_UI.textWhite} />
                ) : (
                  <Text style={ctaButtonStyles.text}>Sign in</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Social sign-in */}
            <SocialSignInButtons afterAuthHref="/tabs/home" />

            {/* Footer */}
            <View style={[styles.footer, isLargeText && styles.footerWrap]}>
              <Text style={styles.footerText}>New here? </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/register")}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              >
                <Text style={styles.footerLink}>Create an account</Text>
              </TouchableOpacity>
            </View>

          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: "100%",
    backgroundColor: CREAM,
    overflow: "hidden",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },

  // ── Hero ──────────────────────────────────────────────────────
  hero: {
    height: SCREEN_HEIGHT * 0.5,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  heroCompact: {
    paddingHorizontal: 20,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AUTH_UI.overlayStart,
    borderWidth: 1,
    borderColor: AUTH_UI.mutedBorder18,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: AUTH_UI.shadowBrown,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.16,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },

  brandRow: {
    alignItems: "center",
    alignSelf: "center",
  },
  logoPlate: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: "hidden",
    backgroundColor: AUTH_UI.textWhite,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.rose[300],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  logoMark: {
    width: "100%",
    height: "100%",
  },

  heroText: {
    alignItems: "center",
    backgroundColor: AUTH_UI.overlayGlass,
    borderWidth: 1,
    borderColor: AUTH_UI.overlayGlassBorder,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: AUTH_UI.shadowCoffee,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  heroTextCompact: {
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  heroGreeting: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT_HEADING,
    letterSpacing: 0.4,
    marginBottom: 10,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  heroQuote: {
    fontSize: 22,
    color: TEXT_HEADING,
    textAlign: "center",
    lineHeight: 33,
    fontWeight: "500",
    fontFamily: FONT_WARM_SERIF,
  },

  // ── Card ──────────────────────────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: CREAM,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    marginTop: -CARD_RADIUS,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 48,
    ...Platform.select({
      ios: {
        shadowColor: colors.rose[300],
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  cardCompact: {
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  cardLargeText: {
    paddingBottom: 64,
  },
  cardHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.rose[200],
    alignSelf: "center",
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: TEXT_HEADING,
    letterSpacing: -0.8,
    marginBottom: 4,
    fontFamily: FONT_WARM_SERIF,
  },
  cardTitleCompact: {
    fontSize: 25,
  },
  cardSubtitle: {
    fontSize: 16,
    color: TEXT_BLACK,
    marginBottom: 28,
    lineHeight: 24,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  // ── Inputs ────────────────────────────────────────────────────
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  labelRowStack: {
    alignItems: "flex-start",
    rowGap: 8,
    flexWrap: "wrap",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_BLACK,
    letterSpacing: 0.2,
    marginBottom: 8,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  labelInline: {
    marginBottom: 0,
  },
  forgotText: {
    fontSize: 15,
    color: LINK_BERRY,
    fontWeight: "600",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  input: {
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    color: TEXT_BLACK,
    borderWidth: 1.5,
    borderColor: colors.rose[200],
    fontFamily: FONT_FRIENDLY_SANS,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.rose[200],
    paddingRight: 4,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    color: TEXT_BLACK,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  eyeBtn: {
    padding: 10,
  },

  // ── CTA ───────────────────────────────────────────────────────
  mainBtn: {
    backgroundColor: colors.rose[500],
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 8,
    ...shadows.md,
  },
  mainBtnText: {
    color: TEXT_WHITE,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  // ── Footer ────────────────────────────────────────────────────
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  footerWrap: {
    flexWrap: "wrap",
    rowGap: 8,
  },
  footerText: {
    color: TEXT_BLACK,
    fontSize: 16,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  footerLink: {
    color: LINK_BERRY,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FONT_FRIENDLY_SANS,
  },

  timeGreeting: {
    fontSize: 14,
    color: TEXT_HEADING,
    letterSpacing: 0.6,
    fontWeight: "700",
    marginBottom: 8,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  timeGreetingCompact: {
    fontSize: 13,
    marginBottom: 6,
  },
  dailyQuote: {
    fontSize: 22,
    color: TEXT_HEADING,
    textAlign: "center",
    lineHeight: 33,
    fontWeight: "500",
    fontFamily: FONT_WARM_SERIF,
    textShadowColor: AUTH_UI.textShadowLight,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dailyQuoteCompact: {
    fontSize: 20,
    lineHeight: 30,
  },
});