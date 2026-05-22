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
  ImageBackground,
  KeyboardAvoidingView,
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
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { getErrorMessage, isClerkSessionExistsError } from "@/lib/errors";
import { resetClerkForSignIn } from "@/lib/resetClerkForSignIn";

// ── Module-level constants ────────────────────────────────────────────────────

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const WELCOME_BG = require("../../assets/welcome-bg.png");
const CREAM = "#FFFBF7";
const CARD_RADIUS = 32;

// ── Main component ────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const clerk = useClerk();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!isLoaded) return;
    setLoading(true);
    try {
      await resetClerkForSignIn(clerk);
      try {
        await signUp.create({ emailAddress: email, password });
      } catch (err) {
        if (isClerkSessionExistsError(err)) {
          await resetClerkForSignIn(clerk);
          await signUp.create({ emailAddress: email, password });
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
                <View style={styles.heartBadge}>
                  <Ionicons name="heart" size={18} color={colors.rose[400]} />
                </View>
                <Text style={styles.brandName}>mumcare</Text>
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
                style={[styles.mainBtn, loading && { opacity: 0.75 }]}
                onPress={handleVerify}
                disabled={loading}
                activeOpacity={0.87}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.mainBtnText}>Confirm my email</Text>
                )}
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
              <View style={styles.heartBadge}>
                <Ionicons name="heart" size={18} color={colors.rose[400]} />
              </View>
              <Text style={styles.brandName}></Text>
            </View>

            {/* Warm opening message */}
            <View style={styles.heroText}>
              <Text style={styles.heroGreeting}>YOUR JOURNEY BEGINS HERE</Text>
              <Text style={styles.heroQuote}>
                "You don't have to navigate{"\n"}this alone."
              </Text>
            </View>
          </ImageBackground>

          {/* ── Form card ──────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHandle} />

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

            {/* CTA */}
            <TouchableOpacity
              style={[styles.mainBtn, loading && { opacity: 0.75 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.87}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.mainBtnText}>Begin my journey</Text>
              )}
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
    backgroundColor: "rgba(255,255,255,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
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
    fontWeight: "700",
    color: colors.rose[400],
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  heroQuote: {
    fontSize: 20,
    fontStyle: "italic",
    color: colors.navy[700],
    textAlign: "center",
    lineHeight: 30,
    fontWeight: "500",
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
    fontWeight: "700",
    color: colors.rose[400],
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

  // ── CTA ─────────────────────────────────────────────────────
  mainBtn: {
    backgroundColor: colors.rose[500],
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 8,
    ...shadows.md,
  },
  mainBtnText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
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