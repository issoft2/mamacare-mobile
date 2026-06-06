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
import { colors, shadows } from "@safeborn/ui";
import { ctaButtonStyles, ctaGradientColors } from "../../components/styles/ctaButton";
import { useMemo, useState } from "react";
import { usePwaInstallPrompt } from "../../lib/usePwaInstallPrompt";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

const WELCOME_BG = require("../../assets/welcome-bg.png");
const APP_LOGO = require("../../assets/safebornlogo.png");
const TEXT_BLACK = AUTH_UI.textBlack;
const TEXT_HEADING = AUTH_UI.textHeading;
const TEXT_WHITE = AUTH_UI.textWhite;
const LINK_BERRY = AUTH_UI.linkBerry;

export default function WelcomeScreen() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 900;
  const isCompact = width < 360;
  const isLargeText = fontScale >= 1.2;
  const install = usePwaInstallPrompt();
  const [installBannerDismissed, setInstallBannerDismissed] = useState(false);
  
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
            ? [AUTH_UI.overlayDark22, AUTH_UI.overlayEnd, AUTH_UI.warmBackground]
            : [AUTH_UI.overlayDark28, AUTH_UI.overlayStart, AUTH_UI.warmBackground]
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
              <Ionicons name="phone-portrait-outline" size={20} color={colors.rose[500]} />
            </View>
            <View style={styles.installCopy}>
              <Text style={styles.installTitle}>Install safeborn</Text>
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
                <Ionicons name="close" size={18} color={AUTH_UI.mutedText} />
              </TouchableOpacity>
            )}
          </Pressable>
        )}

        <View
          style={[
            styles.content,
            isWide && styles.contentWide,
            isCompact && styles.contentCompact,
          ]}
        >
            
          {/* Upper Hero Section */}
          <View style={[styles.hero, isWide && styles.heroWide]}>
            <View style={[styles.brandWrapper, isWide && styles.brandWrapperWide]}>
              <View style={styles.logoPlate}>
                <Image source={APP_LOGO} style={styles.logoMark} resizeMode="cover" />
              </View>
            </View>

            <View
              style={[
                styles.messageStack,
                isWide && styles.messageStackWide,
                isCompact && styles.messageStackCompact,
                isLargeText && styles.messageStackLarge,
              ]}
            >
              <Text style={styles.timeGreeting}>Welcome, mama</Text>
              <Text style={[styles.dailyQuote, isWide && styles.dailyQuoteWide, isCompact && styles.dailyQuoteCompact]}>
                "Your pregnancy journey starts here."
              </Text>
              <View style={styles.accentLine} />
            </View>
          </View>

          {/* Lower Action Section */}
          <View style={[styles.footer, isWide && styles.footerWide, isLargeText && styles.footerWrap]}>
            <Text style={[styles.tagline, isWide && styles.taglineWide, isCompact && styles.taglineCompact, isLargeText && styles.taglineLarge]}>
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
                <Ionicons name="arrow-forward" size={20} color={AUTH_UI.textWhite} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, isWide && styles.loginBtnWide, isLargeText && styles.loginBtnLarge]}
              onPress={() => router.push("/auth/login")}
            >
              <Text style={[styles.loginBtnText, isCompact && styles.loginBtnTextCompact]}>
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
    backgroundColor: AUTH_UI.warmBackground,
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
  contentCompact: {
    paddingHorizontal: 18,
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
  brandWrapperWide: { alignItems: "center" },
  logoPlate: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: AUTH_UI.textWhite,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
    marginBottom: 16,
  },
  logoMark: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT_HEADING,
  },
  
  messageStack: {
    alignItems: "center",
    gap: 12,
    backgroundColor: AUTH_UI.overlayGlass,
    borderWidth: 1,
    borderColor: AUTH_UI.overlayGlassBorder,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: AUTH_UI.shadowEspresso,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
      },
      android: { elevation: 4 },
    }),
  },
  messageStackWide: { alignItems: "flex-start" },
  messageStackLarge: {
    paddingVertical: 14,
  },
  messageStackCompact: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  timeGreeting: {
    fontSize: 15,
    color: TEXT_HEADING,
    letterSpacing: 0.6,
    fontWeight: '700',
    fontFamily: FONT_FRIENDLY_SANS,
  },
  dailyQuote: {
    fontSize: 22,
    color: TEXT_HEADING,
    textAlign: 'center',
    lineHeight: 33,
    fontWeight: "500",
    fontFamily: FONT_WARM_SERIF,
    textShadowColor: AUTH_UI.textShadowLight,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dailyQuoteWide: {
    textAlign: "left",
    maxWidth: 500,
  },
  dailyQuoteCompact: {
    fontSize: 20,
    lineHeight: 30,
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
  footerWrap: {
    rowGap: 8,
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
    backgroundColor: AUTH_UI.overlayCard96,
    borderWidth: 1,
    borderColor: AUTH_UI.semanticSevereBorder20,
    borderRadius: 16,
    padding: 12,
    ...shadows.md,
  },
  installIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: AUTH_UI.semanticSevereBg,
    alignItems: "center",
    justifyContent: "center",
  },
  installCopy: {
    flex: 1,
    minWidth: 0,
  },
  installTitle: {
    color: TEXT_BLACK,
    fontSize: 16,
    fontWeight: "800",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  installHint: {
    color: TEXT_BLACK,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 2,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  installAction: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.rose[500],
  },
  installActionText: {
    color: TEXT_WHITE,
    fontSize: 16,
    fontWeight: "800",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  installDismiss: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AUTH_UI.semanticPanel,
  },
  tagline: {
    fontSize: 16,
    color: TEXT_BLACK,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  taglineWide: {
    textAlign: "left",
  },
  taglineLarge: {
    lineHeight: 26,
  },
  taglineCompact: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  loginBtn: {
    marginTop: 20,
    minHeight: 44,
    paddingVertical: 12,
    alignItems: 'center',
  },
  loginBtnWide: {
    alignItems: "flex-start",
  },
  loginBtnText: {
    color: TEXT_BLACK,
    fontSize: 16,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  loginBtnTextCompact: {
    fontSize: 15,
  },
  loginBtnLarge: {
    minHeight: 48,
  },
   footerLink: {
    color: LINK_BERRY,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FONT_FRIENDLY_SANS,
  },
});
