/**
 * mobile/app/auth/welcome.tsx
 * Refined Welcome Experience - A calm, supportive entry point.
 */

import { Stack, useRouter } from "expo-router";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadows } from "@mumcare/ui";
import { HeartIcon } from "../../components/HeartIcon";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";
import { useMemo, useState } from "react";
import { getTimeBasedGreeting, getDailyMessage } from "../../lib/greetings";
import { usePwaInstallPrompt } from "../../lib/usePwaInstallPrompt";

const WELCOME_BG = require("../../assets/welcome-bg.png");

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 900;
  const install = usePwaInstallPrompt();
  const [installBannerDismissed, setInstallBannerDismissed] = useState(false);
  
  // Memoize greeting and message to prevent shift on re-renders
  const greeting = useMemo(() => getTimeBasedGreeting(), []);
  const dailyMessage = useMemo(() => getDailyMessage(), []);
  const isMobileWeb = Platform.OS === "web" && width < 760;
  const isAppleMobileBrowser = useMemo(() => {
    if (typeof navigator === "undefined") {
      return false;
    }

    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }, []);
  const showInstallBanner =
    isMobileWeb && !install.isInstalled && !installBannerDismissed;
  const handleInstallBannerPress = () => {
    if (install.canPrompt) {
      void install.promptInstall();
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Image
        source={WELCOME_BG}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <LinearGradient
        colors={
          isWide
            ? ["rgba(255,248,244,0.12)", "rgba(255,248,244,0.72)", "#FFF8F4"]
            : ["rgba(255,248,244,0.18)", "rgba(255,248,244,0.82)", "#FFF8F4"]
        }
        locations={isWide ? [0, 0.54, 0.9] : [0, 0.46, 0.78]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {showInstallBanner && (
          <Pressable
            style={styles.installBannerFloating}
            onPress={handleInstallBannerPress}
          >
            <View style={styles.installIcon}>
              <Ionicons name="phone-portrait-outline" size={20} color="#E8697C" />
            </View>
            <View style={styles.installCopy}>
              <Text style={styles.installTitle}>Install MumCare</Text>
              <Text style={styles.installHint}>
                {install.canPrompt
                  ? "Add it to your home screen for quick access."
                  : isAppleMobileBrowser
                    ? "Open in normal Safari, then Add to Home Screen."
                    : "Add it from your browser menu when available."}
              </Text>
            </View>
            {install.canPrompt ? (
              <View
                style={styles.installAction}
              >
                <Text style={styles.installActionText}>Install</Text>
              </View>
            ) : isAppleMobileBrowser ? (
              <View
                style={styles.installAction}
              >
                <Text style={styles.installActionText}>How</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.installDismiss}
                onPress={() => setInstallBannerDismissed(true)}
                activeOpacity={0.86}
              >
                <Ionicons name="close" size={18} color="#7B8498" />
              </TouchableOpacity>
            )}
          </Pressable>
        )}

        <View style={[styles.content, isWide && styles.contentWide]}>
            
          {/* Upper Hero Section */}
          <View style={[styles.hero, isWide && styles.heroWide]}>
            <View style={[styles.brandWrapper, isWide && styles.brandWrapperWide]}>
              <View style={styles.iconCircle}>
                <HeartIcon size={48} color={colors.rose[500]} />
              </View>
              <Text style={styles.logoText}>mumcare</Text>
            </View>

            <View style={[styles.messageStack, isWide && styles.messageStackWide]}>
              <Text style={styles.timeGreeting}>{greeting}, mama</Text>
              <Text style={[styles.dailyQuote, isWide && styles.dailyQuoteWide]}>
                "{dailyMessage}"
              </Text>
              <View style={styles.accentLine} />
            </View>
          </View>

          {/* Lower Action Section */}
          <View style={[styles.footer, isWide && styles.footerWide]}>
            <Text style={[styles.tagline, isWide && styles.taglineWide]}>
              Your personalized companion for a healthy, supported pregnancy.
            </Text>
              
            <TouchableOpacity
              style={ctaButtonStyles.button}
              onPress={() => router.push("/auth/register")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={ctaGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={ctaButtonStyles.gradient}
              >
                <Text style={ctaButtonStyles.text}>Begin your journey</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, isWide && styles.loginBtnWide]}
              onPress={() => router.push("/auth/login")}
            >
              <Text style={styles.loginBtnText}>
                Already a member? <Text style={styles.footerLink}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: "100%",
    backgroundColor: '#FFF8F4',
    overflow: "hidden",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  safeArea: { flex: 1 },
  content: { 
    flex: 1, 
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 24, 
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 24,
  },
  contentWide: {
    maxWidth: 520,
    marginLeft: 76,
    marginRight: "auto",
    paddingTop: 36,
    paddingBottom: 40,
  },
  
  // Hero
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    minHeight: 360,
  },
  heroWide: {
    minHeight: 390,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  brandWrapper: { alignItems: 'center', marginBottom: 28 },
  brandWrapperWide: { alignItems: "flex-start" },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.navy[700],
  },
  
  messageStack: { alignItems: 'center', gap: 12 },
  messageStackWide: { alignItems: "flex-start" },
  timeGreeting: {
    fontSize: 13,
    color: colors.navy[400],
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontWeight: '600'
  },
  dailyQuote: {
    fontSize: 21,
    color: colors.navy[700],
    textAlign: 'center',
    lineHeight: 30,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  dailyQuoteWide: {
    textAlign: "left",
    maxWidth: 500,
  },
  accentLine: {
    width: 40,
    height: 3,
    backgroundColor: colors.rose[200],
    borderRadius: 2,
    marginTop: 10
  },

  // Footer
  footer: {
    paddingBottom: 18,
  },
  footerWide: {
    maxWidth: 500,
  },
  installBannerFloating: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(232,105,124,0.2)",
    borderRadius: 16,
    padding: 12,
    ...shadows.md,
  },
  installIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(232,105,124,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  installCopy: {
    flex: 1,
    minWidth: 0,
  },
  installTitle: {
    color: colors.navy[700],
    fontSize: 14,
    fontWeight: "800",
  },
  installHint: {
    color: colors.navy[500],
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  installAction: {
    minHeight: 36,
    borderRadius: 12,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.rose[500],
  },
  installActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  installDismiss: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F7FB",
  },
  tagline: {
    fontSize: 15,
    color: colors.navy[500],
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  taglineWide: {
    textAlign: "left",
  },
  loginBtn: {
    marginTop: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  loginBtnWide: {
    alignItems: "flex-start",
  },
  loginBtnText: {
    color: colors.navy[600],
    fontSize: 15,
  },
   footerLink: {
    color: colors.rose[500],
    fontSize: 15,
    fontWeight: "700",
  },
});
