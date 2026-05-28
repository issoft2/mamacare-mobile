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

import { colors, shadows } from "@mumcare/ui";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { getErrorMessage } from "@/lib/errors";
import { goHomeAfterClerkSetActive } from "@/lib/goHomeAfterClerkSetActive";
import { resetClerkForSignIn } from "@/lib/resetClerkForSignIn";
import { getTimeBasedGreeting, getDailyMessage } from "../../lib/greetings";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";



const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const WELCOME_BG = require("../../assets/welcome-bg.png");
const APP_LOGO = require("../../assets/mumlogo.png");
const CREAM = "#FFFBF7";
const CARD_RADIUS = 32;

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const clerk = useClerk();
  const router = useRouter();

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

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        goHomeAfterClerkSetActive(router);
      } else if (result.status === "needs_second_factor") {
        // TODO: navigate to dedicated MFA screen
        Alert.alert(
          "One more step",
          "Please check your authenticator app to complete sign in."
        );
      }
    } catch (err) {
      Alert.alert(
        "Couldn't sign you in",
        getErrorMessage(err, "Please check your details and try again.")
      );
    } finally {
      setLoading(false);
    }
  }

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
          {/* ── Hero zone — mirrors welcome screen atmosphere ─────── */}
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

            {/* Brand logo */}
            <View style={styles.brandRow}>
              <View style={styles.logoPlate}>
                <Image source={APP_LOGO} style={styles.logoMark} resizeMode="cover" />
              </View>
            </View>

            {/* Warm welcome-back message */}
            <View style={styles.heroText}>
             <Text style={styles.timeGreeting}>{greeting}, mama</Text>
            <Text style={styles.dailyQuote}>"{dailyMessage}"</Text>

            </View>
          </ImageBackground>

          {/* ── Form card — floats up from the hero ──────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardSubtitle}>
          
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
              <View style={styles.labelRow}>
                <Text style={styles.label}>PASSWORD</Text>
                <TouchableOpacity
                  // onPress={() => router.push("/auth/forgot-password")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Your password"
                  placeholderTextColor={colors.navy[300]}
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
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={ctaButtonStyles.text}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Social sign-in */}
            <SocialSignInButtons afterAuthHref="/tabs/home" />

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New here? </Text>
              <TouchableOpacity
                onPress={() => router.push("/auth/register")}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={styles.footerLink}>Create an account</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scroll: {
    flexGrow: 1,
  },

  // ── Hero ──────────────────────────────────────────────────────
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
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8E5A54",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 13,
    color: colors.rose[400],
    fontWeight: "600",
    fontStyle: "italic",
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
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── Footer ────────────────────────────────────────────────────
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
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

  timeGreeting: {
    fontSize: 13,
    color: "#7F4E47",
    textTransform: "uppercase",
    letterSpacing: 1.8,
    fontWeight: "800",
    marginBottom: 8,
  },
  dailyQuote: {
    fontSize: 21,
    color: "#4D3B39",
    textAlign: "center",
    lineHeight: 30,
    fontStyle: "italic",
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    textShadowColor: "rgba(255,255,255,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});