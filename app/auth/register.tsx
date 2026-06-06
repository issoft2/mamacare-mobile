/**
 * mobile/app/auth/register.tsx
 *
 * safeborn Registration Screen — brand-aligned, emotionally warm.
 *
 * Design philosophy:
 *  - Same two-zone layout as login.tsx: hero photo top → floating
 *    cream card bottom. User never feels they've left the app.
 *  - Registration is a significant emotional moment — a pregnant
 *    woman is choosing a companion for her journey. The copy and
 *    design should honour that, not rush her through a form.
 *  - Verification screen is warm and reassuring, not clinical.
 *    "We sent you a little envelope" > "Enter verification code".
 *  - All colours, borders, and typography match login.tsx exactly.
 */

import { useClerk, useSignUp } from "@clerk/clerk-expo";
import { useRouter, Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
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

import { colors, spacing, shadows } from "@safeborn/ui";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { getErrorMessage, isClerkSessionExistsError } from "@/lib/errors";
import { getActiveLegalContent, getActiveLegalDocument } from "@/lib/legal";
import { resetClerkForSignIn } from "@/lib/resetClerkForSignIn";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

// ── Module-level constants ────────────────────────────────────────────────────

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const WELCOME_BG = require("../../assets/welcome-bg.png");
const APP_LOGO = require("../../assets/safebornlogo.png");
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

// ── Main component ────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const clerk = useClerk();
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const isCompact = width < 360;
  const isLargeText = fontScale >= 1.2;

  const activePrivacy = getActiveLegalDocument("privacy");
  const activeTerms = getActiveLegalDocument("terms");
  const privacyContent = getActiveLegalContent("privacy");
  const termsContent = getActiveLegalContent("terms");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [legalPreview, setLegalPreview] = useState<null | "privacy" | "terms">(null);

  async function handleRegister() {
    if (!isLoaded) return;

    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing details",
        "Please enter your email address and password to continue."
      );
      return;
    }

    setLoading(true);
    try {
      await resetClerkForSignIn(clerk);
      try {
        await signUp.create({
          emailAddress: email.trim(),
          password,
        });
      } catch (err) {
        if (isClerkSessionExistsError(err)) {
          await resetClerkForSignIn(clerk);
          await signUp.create({
            emailAddress: email.trim(),
            password,
          });
        } else {
          throw err;
        }
      }
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: unknown) {
      Alert.alert(
        "Couldn't create your account",
        getErrorMessage(err, "Please try again.")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (typeof __DEV__ !== "undefined" && __DEV__) {
        // eslint-disable-next-line no-console
        console.log("Register verify result:", {
          status: result.status,
          createdSessionId: result.createdSessionId ?? null,
        });
      }

      if (result.status === "complete") {
        await setActive({
          session: result.createdSessionId,
          navigate: async (params) => {
            const session = params.session;
            const sessionTaskUrl = (params as { sessionTaskUrl?: string }).sessionTaskUrl;
            const redirectUrl = (params as { redirectUrl?: string }).redirectUrl;
            const target =
              normalizeClerkTarget(sessionTaskUrl) ??
              normalizeClerkTarget(redirectUrl) ??
              (session ? "/onboarding/profile-setup" : "/auth/welcome");
            router.replace(target as any);
          },
        });

        if (typeof __DEV__ !== "undefined" && __DEV__) {
          // eslint-disable-next-line no-console
          console.log("Register setActive completed for session:", result.createdSessionId ?? null);
        }

        router.replace("/onboarding/profile-setup");
      }
    } catch (err: unknown) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        // eslint-disable-next-line no-console
        console.warn("Register verify failed with raw error:", err);
      }
      Alert.alert(
        "That code didn't work",
        getErrorMessage(err, "Please check the code and try again.")
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Verification screen ─────────────────────────────────────────────────────
  if (pendingVerification) {
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
              {/* Hero — warm envelope moment */}
              <View style={[styles.hero, isCompact && styles.heroCompact]}>

              {/* Brand */}
              <View style={styles.brandRow}>
                <View style={styles.logoPlate}>
                  <Image source={APP_LOGO} style={styles.logoMark} resizeMode="cover" />
                </View>
              </View>

              {/* Envelope icon + warm message */}
              <View style={[styles.heroText, isCompact && styles.heroTextCompact]}>
                <View style={styles.verifyIconWrap}>
                  <Ionicons name="mail" size={32} color={colors.rose[400]} />
                </View>
                <Text style={styles.heroGreeting}>CHECK YOUR INBOX</Text>
                <Text style={[styles.heroQuote, isCompact && styles.heroQuoteCompact]}>
                  "We sent a little code{"\n"}to {email}"
                </Text>
              </View>
              </View>

            {/* Card */}
            <View style={[styles.card, isCompact && styles.cardCompact, isLargeText && styles.cardLargeText]}>
              <View style={styles.cardHandle} />

              <Text style={styles.cardTitle}>Almost there</Text>
              <Text style={styles.cardSubtitle}>
                Enter the 6-digit code from your email to confirm it's really you.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification code</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="• • • • • •"
                  placeholderTextColor={TEXT_BLACK}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  maxLength={6}
                  textAlign="center"
                />
              </View>

              <TouchableOpacity
                style={[ctaButtonStyles.button, loading && { opacity: 0.75 }]}
                onPress={handleVerify}
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
                    <Text style={ctaButtonStyles.text}>Confirm my email</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Resend hint */}
              <View style={styles.resendRow}>
                <Text style={styles.footerText}>Didn't receive it? </Text>
                <TouchableOpacity
                  onPress={handleRegister}
                  hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                >
                  <Text style={styles.footerLink}>Resend code</Text>
                </TouchableOpacity>
              </View>
            </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Registration screen ─────────────────────────────────────────────────────
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
            {/* ── Hero zone ──────────────────────────────────────────── */}
            <View style={[styles.hero, isCompact && styles.heroCompact]}>

            {/* Back button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.navy[700]} />
            </TouchableOpacity>

            {/* Brand */}
            <View style={styles.brandRow}>
              <View style={styles.logoPlate}>
                <Image source={APP_LOGO} style={styles.logoMark} resizeMode="cover" />
              </View>
            </View>

            {/* Warm opening message */}
            <View style={[styles.heroText, isCompact && styles.heroTextCompact]}>
              <Text style={[styles.heroGreetingLight, isCompact && styles.heroGreetingLightCompact]}>Your journey begins here</Text>
              <Text style={[styles.heroQuoteLight, isCompact && styles.heroQuoteLightCompact]}>
                "You don't have to navigate{"\n"}this alone."
              </Text>
            </View>
            </View>

          {/* ── Form card ──────────────────────────────────────────── */}
          <View style={[styles.card, isCompact && styles.cardCompact, isLargeText && styles.cardLargeText]}>
            <Text style={[styles.cardTitle, isCompact && styles.cardTitleCompact]}>Create your account</Text>
            <Text style={styles.cardSubtitle}>
              A safe space for every step of your pregnancy.
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
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create a password"
                  placeholderTextColor={TEXT_BLACK}
                  value={password}
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.rose[300]}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>
                Use at least 8 characters — you've got this.
              </Text>
            </View>

            <Text style={[styles.legalText, isCompact && styles.legalTextCompact]}>
              By creating an account or continuing with social sign-in, you agree to our{" "}
              <Text style={styles.legalLink} onPress={() => setLegalPreview("terms")}>Terms of Use</Text>
              {" "}and acknowledge that your data will be handled in accordance with our{" "}
              <Text style={styles.legalLink} onPress={() => setLegalPreview("privacy")}>Privacy Policy</Text>.
            </Text>

            {/* CTA */}
            <TouchableOpacity
              style={[ctaButtonStyles.button, loading && { opacity: 0.75 }]}
              onPress={handleRegister}
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
                  <Text style={ctaButtonStyles.text}>Create account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Social sign-in */}
            <SocialSignInButtons afterAuthHref="/onboarding/profile-setup" />

            {/* Footer */}
            <View style={[styles.footer, isLargeText && styles.footerWrap]}>
              <Text style={styles.footerText}>Already a member? </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/login")}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              >
                <Text style={styles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal
          visible={legalPreview !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setLegalPreview(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {legalPreview === "terms" ? "Terms of Use" : "Privacy Policy"}
                </Text>
                <TouchableOpacity onPress={() => setLegalPreview(null)}>
                  <Ionicons name="close" size={22} color={colors.navy[700]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalMeta}>
                {(legalPreview === "terms" ? activeTerms : activePrivacy).region.toUpperCase()} ·
                {(legalPreview === "terms" ? activeTerms : activePrivacy).version}
              </Text>
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalContent}>
                  {legalPreview === "terms" ? termsContent : privacyContent}
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

  // ── Hero ────────────────────────────────────────────────────
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
    ...shadows.md,
  },
  logoMark: {
    width: "100%",
    height: "100%",
  },
  heartBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AUTH_UI.overlayCard90,
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
  brandName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.rose[600],
    letterSpacing: -0.3,
  },

  heroText: {
    alignItems: "center",
    backgroundColor: AUTH_UI.overlayGlass,
    borderWidth: 1,
    borderColor: AUTH_UI.overlayGlassBorder,
    paddingHorizontal: 16,
    paddingVertical: 11,
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
    paddingVertical: 10,
  },
  verifyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AUTH_UI.overlayCard85,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.rose[300],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  heroGreeting: {
    fontSize: 14,
    fontWeight: "800",
    color: TEXT_BLACK,
    letterSpacing: 2,
    marginBottom: 10,
    textShadowColor: AUTH_UI.textShadowDark35,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  heroQuote: {
    fontSize: 21,
    color: TEXT_HEADING,
    textAlign: "center",
    lineHeight: 33,
    fontWeight: "600",
    textShadowColor: AUTH_UI.textShadowDark40,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: FONT_WARM_SERIF,
  },
  heroQuoteCompact: {
    fontSize: 19,
    lineHeight: 30,
  },
  heroGreetingLight: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT_HEADING,
    letterSpacing: 0.6,
    marginBottom: 10,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  heroGreetingLightCompact: {
    fontSize: 13,
    marginBottom: 8,
  },
  heroQuoteLight: {
    fontSize: 21,
    color: TEXT_HEADING,
    textAlign: "center",
    lineHeight: 33,
    fontWeight: "500",
    textShadowColor: AUTH_UI.textShadowLight,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: FONT_WARM_SERIF,
  },
  heroQuoteLightCompact: {
    fontSize: 19,
    lineHeight: 30,
  },

  // ── Card ────────────────────────────────────────────────────
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

  // ── Inputs ──────────────────────────────────────────────────
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_BLACK,
    letterSpacing: 0.2,
    marginBottom: 8,
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
  codeInput: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 8,
    color: TEXT_BLACK,
    textAlign: "center",
    paddingVertical: 18,
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
  passwordHint: {
    fontSize: 14,
    color: TEXT_BLACK,
    marginTop: 12,
    marginLeft: 4,
    lineHeight: 20,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  legalText: {
    color: TEXT_BLACK,
    fontSize: 16,
    lineHeight: 26,
    fontFamily: FONT_FRIENDLY_SANS,
    marginBottom: 14,
    marginTop: -4,
  },
  legalTextCompact: {
    fontSize: 15,
    lineHeight: 24,
  },
  legalLink: {
    color: LINK_BERRY,
    textDecorationLine: "underline",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: AUTH_UI.overlayScrimDark,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: CREAM,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: TEXT_HEADING,
    fontFamily: FONT_WARM_SERIF,
  },
  modalMeta: {
    fontSize: 14,
    color: TEXT_BLACK,
    marginBottom: 10,
    fontWeight: "700",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  modalBody: {
    maxHeight: "100%",
  },
  modalContent: {
    color: TEXT_BLACK,
    fontSize: 16,
    lineHeight: 24,
    paddingBottom: 16,
    fontFamily: FONT_FRIENDLY_SANS,
  },

  // ── Footer ──────────────────────────────────────────────────
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
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
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
});