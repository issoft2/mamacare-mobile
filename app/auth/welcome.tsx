/**
 * mobile/app/auth/welcome.tsx
 * Refined Welcome Experience - A calm, supportive entry point.
 */

import { Stack, useRouter } from "expo-router";
import {
  Image,
  Modal,
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
import { colors, spacing, typography, shadows } from "@mumcare/ui";
import { HeartIcon } from "../../components/HeartIcon";
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
  const [installGuideOpen, setInstallGuideOpen] = useState(false);
  
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
      return;
    }

    if (isAppleMobileBrowser) {
      setInstallGuideOpen(true);
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
                    ? "Tap here for iPhone install steps."
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
            <View style={styles.brandWrapper}>
              <View style={styles.iconCircle}>
                <HeartIcon size={48} color={colors.rose[500]} />
              </View>
              <Text style={styles.logoText}>mumcare</Text>
            </View>

            <View style={styles.messageStack}>
              <Text style={styles.timeGreeting}>{greeting}, mama</Text>
              <Text style={styles.dailyQuote}>"{dailyMessage}"</Text>
              <View style={styles.accentLine} />
            </View>
          </View>

          {/* Lower Action Section */}
          <View style={styles.footer}>
            <Text style={styles.tagline}>
              Your personalized companion for a healthy, supported pregnancy.
            </Text>
              
            <TouchableOpacity
              style={styles.mainBtn}
              onPress={() => router.push("/auth/register")}
              activeOpacity={0.9}
            >
              <Text style={styles.mainBtnText}>Begin your journey</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push("/auth/login")}
            >
              <Text style={styles.loginBtnText}>
                Already a member? <Text style={styles.footerLink}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>

      <Modal
        visible={installGuideOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setInstallGuideOpen(false)}
      >
        <View style={styles.guideOverlay}>
          <View style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <View style={styles.guideBrowserHint}>
                <Ionicons name="share-outline" size={22} color="#E8697C" />
                <Text style={styles.guideBrowserHintText}>
                  Safari toolbar
                </Text>
              </View>
              <TouchableOpacity
                style={styles.guideClose}
                onPress={() => setInstallGuideOpen(false)}
                activeOpacity={0.86}
              >
                <Ionicons name="close" size={20} color="#7B8498" />
              </TouchableOpacity>
            </View>

            <Text style={styles.guideTitle}>Install MumCare on iPhone</Text>
            <Text style={styles.guideText}>
              iPhone does not let websites open the install menu directly.
              Close this guide, then use Safari&apos;s real Share button in the
              browser toolbar.
            </Text>

            <View style={styles.guideSteps}>
              <View style={styles.guideStep}>
                <Text style={styles.guideStepNumber}>1</Text>
                <Text style={styles.guideStepText}>
                  If Safari says Private, switch to normal browsing.
                </Text>
              </View>
              <View style={styles.guideStep}>
                <Text style={styles.guideStepNumber}>2</Text>
                <Text style={styles.guideStepText}>
                  Tap Safari&apos;s Share button in the browser toolbar.
                </Text>
              </View>
              <View style={styles.guideStep}>
                <Text style={styles.guideStepNumber}>3</Text>
                <Text style={styles.guideStepText}>
                  Choose Add to Home Screen from the menu.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.guideButton}
              onPress={() => setInstallGuideOpen(false)}
              activeOpacity={0.9}
            >
              <Text style={styles.guideButtonText}>Close guide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    maxWidth: 560,
    marginLeft: 48,
    marginRight: "auto",
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
    minHeight: 420,
  },
  brandWrapper: { alignItems: 'center', marginBottom: 28 },
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
  installBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(232,105,124,0.18)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
    ...shadows.sm,
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
  guideOverlay: {
    flex: 1,
    backgroundColor: "rgba(13,22,42,0.36)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  guideCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    ...shadows.lg,
  },
  guideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  guideIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(232,105,124,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  guideBrowserHint: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "rgba(232,105,124,0.12)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  guideBrowserHintText: {
    color: colors.rose[500],
    fontSize: 13,
    fontWeight: "800",
  },
  guideClose: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F7FB",
  },
  guideTitle: {
    color: colors.navy[700],
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  guideText: {
    color: colors.navy[500],
    fontSize: 14,
    lineHeight: 20,
  },
  guideSteps: {
    gap: 10,
    marginTop: 18,
    marginBottom: 22,
  },
  guideStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  guideStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(232,105,124,0.12)",
    color: colors.rose[500],
    textAlign: "center",
    lineHeight: 28,
    fontSize: 13,
    fontWeight: "800",
  },
  guideStepText: {
    flex: 1,
    color: colors.navy[600],
    fontSize: 14,
    fontWeight: "600",
  },
  guideButton: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.rose[500],
  },
  guideButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  tagline: {
    fontSize: 15,
    color: colors.navy[500],
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  mainBtn: {
    backgroundColor: colors.rose[500],
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...shadows.md,
  },
  mainBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  loginBtn: {
    marginTop: 20,
    paddingVertical: 10,
    alignItems: 'center',
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
