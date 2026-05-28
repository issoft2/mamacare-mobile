/**
 * mobile/app/auth/register.tsx
 *
 * mumcare Registration Screen — brand-aligned, emotionally warm.
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
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { colors, spacing, shadows } from "@mumcare/ui";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { getErrorMessage, isClerkSessionExistsError } from "@/lib/errors";
import { getActiveLegalContent, getActiveLegalDocument } from "@/lib/legal";
import { resetClerkForSignIn } from "@/lib/resetClerkForSignIn";

// ── Module-level constants ────────────────────────────────────────────────────

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const WELCOME_BG = require("../../assets/welcome-bg.png");
const APP_LOGO = require("../../assets/mumlogo.png");
const CREAM = "#FFFBF7";
const CARD_RADIUS = 32;

// ── Main component ────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const clerk = useClerk();
  const router = useRouter();

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
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/onboarding/profile-setup");
      }
    } catch (err: unknown) {
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
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />

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
            <ImageBackground
              source={WELCOME_BG}
              style={styles.hero}
              resizeMode="cover"
            >
              <LinearGradient
                colors={[
                  "rgba(255,245,240,0.15)",
                  "rgba(180,80,100,0.25)",
                  "rgba(255,251,247,0.97)",
                ]}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />

              {/* Brand */}
              <View style={styles.brandRow}>
                <View style={styles.logoPlate}>
                  <Image source={APP_LOGO} style={styles.logoMark} resizeMode="cover" />
                </View>
              </View>

              {/* Envelope icon + warm message */}
              <View style={styles.heroText}>
                <View style={styles.verifyIconWrap}>
                  <Ionicons name="mail" size={32} color={colors.rose[400]} />
                </View>
                <Text style={styles.heroGreeting}>CHECK YOUR INBOX</Text>
                <Text style={styles.heroQuote}>
                  "We sent a little code{"\n"}to {email}"
                </Text>
              </View>
            </ImageBackground>

            {/* Card */}
            <View style={styles.card}>
              <View style={styles.cardHandle} />

              <Text style={styles.cardTitle}>Almost there</Text>
              <Text style={styles.cardSubtitle}>
                Enter the 6-digit code from your email to confirm it's really you.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>VERIFICATION CODE</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="• • • • • •"
                  placeholderTextColor={colors.rose[200]}
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
                    <ActivityIndicator color="#FFF" />
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
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text style={styles.footerLink}>Resend code</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Registration screen ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

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
          <ImageBackground
            source={WELCOME_BG}
            style={styles.hero}
            resizeMode="cover"
          >
            <LinearGradient
              colors={[
                "rgba(255,245,240,0.15)",
                "rgba(180,80,100,0.25)",
                "rgba(255,251,247,0.97)",
              ]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />

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
            <View style={styles.heroText}>
              <Text style={styles.heroGreetingLight}>YOUR JOURNEY BEGINS HERE</Text>
              <Text style={styles.heroQuoteLight}>
                "You don't have to navigate{"\n"}this alone."
              </Text>
            </View>
          </ImageBackground>

          {/* ── Form card ──────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create your account</Text>
            <Text style={styles.cardSubtitle}>
              A safe space for every step of your pregnancy.
            </Text>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="mama@example.com"
                placeholderTextColor={colors.navy[300]}
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
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create a password"
                  placeholderTextColor={colors.navy[300]}
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
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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

            <Text style={styles.legalText}>
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
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={ctaButtonStyles.text}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Social sign-in */}
            <SocialSignInButtons afterAuthHref="/onboarding/profile-setup" />

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already a member? </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/login")}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
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
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scroll: {
    flexGrow: 1,
  },

  // ── Hero ────────────────────────────────────────────────────
  hero: {
    height: SCREEN_HEIGHT * 0.38,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
    justifyContent: "space-between",
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,251,247,0.92)",
    borderWidth: 1,
    borderColor: "rgba(140, 90, 82, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#6A4039",
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "rgba(255,255,255,0.9)",
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
    backgroundColor: "rgba(255,255,255,0.52)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#875851",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  verifyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.85)",
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
    fontSize: 11,
    fontWeight: "800",
    color: "#FDE7EC",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroQuote: {
    fontSize: 20,
    fontStyle: "italic",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 30,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroGreetingLight: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7F4E47",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  heroQuoteLight: {
    fontSize: 20,
    fontStyle: "italic",
    color: "#4D3B39",
    textAlign: "center",
    lineHeight: 30,
    fontWeight: "600",
    textShadowColor: "rgba(255,255,255,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
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
    color: colors.navy[700],
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    color: colors.navy[400],
    marginBottom: 28,
    lineHeight: 22,
  },

  // ── Inputs ──────────────────────────────────────────────────
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8E5A54",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.navy[700],
    borderWidth: 1.5,
    borderColor: colors.rose[100],
  },
  codeInput: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 8,
    color: colors.rose[500],
    textAlign: "center",
    paddingVertical: 18,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.rose[100],
    paddingRight: 4,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.navy[700],
  },
  eyeBtn: {
    padding: 10,
  },
  passwordHint: {
    fontSize: 12,
    color: colors.navy[300],
    fontStyle: "italic",
    marginTop: 6,
    marginLeft: 4,
  },
  legalText: {
    color: colors.navy[400],
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
    marginTop: -4,
  },
  legalLink: {
    color: colors.rose[500],
    textDecorationLine: "underline",
    fontWeight: "700",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(20,24,35,0.45)",
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
    color: colors.navy[700],
  },
  modalMeta: {
    fontSize: 12,
    color: colors.navy[300],
    marginBottom: 10,
    fontWeight: "700",
  },
  modalBody: {
    maxHeight: "100%",
  },
  modalContent: {
    color: colors.navy[600],
    fontSize: 13,
    lineHeight: 20,
    paddingBottom: 16,
  },

  // ── Footer ──────────────────────────────────────────────────
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: colors.navy[400],
    fontSize: 15,
  },
  footerLink: {
    color: colors.rose[500],
    fontSize: 15,
    fontWeight: "700",
  },
});