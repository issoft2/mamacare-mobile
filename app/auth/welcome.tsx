/**
 * mobile/app/auth/welcome.tsx
 * Refined Welcome Experience - A calm, supportive entry point.
 */

import { Stack, useRouter } from "expo-router";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, typography, shadows } from "@mumcare/ui";
import { HeartIcon } from "../../components/HeartIcon";
import { useMemo } from "react";
import { getTimeBasedGreeting, getDailyMessage } from "../../lib/greetings";

const WELCOME_BG = require("../../assets/welcome-bg.png");

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 900;
  
  // Memoize greeting and message to prevent shift on re-renders
  const greeting = useMemo(() => getTimeBasedGreeting(), []);
  const dailyMessage = useMemo(() => getDailyMessage(), []);

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
