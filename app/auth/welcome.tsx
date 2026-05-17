/**
 * mobile/app/auth/welcome.tsx
 * Refined Welcome Experience - A calm, supportive entry point.
 */

import { Stack, useRouter } from "expo-router";
import {
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, typography, shadows } from "@mamacare/ui";
import { HeartIcon } from "../../components/HeartIcon";
import { useMemo } from "react";

const { width } = Dimensions.get("window");
const WELCOME_BG = require("../../assets/welcome-bg.png");

export default function WelcomeScreen() {
  const router = useRouter();
  
  // Memoize greeting and message to prevent shift on re-renders
  const greeting = useMemo(() => getTimeBasedGreeting(), []);
  const dailyMessage = useMemo(() => getDailyMessage(), []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ImageBackground
        source={WELCOME_BG}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        {/* Multilayered Gradient for maximum text legibility without hiding the photo */}
        <LinearGradient
          colors={['rgba(255,248,244,0.1)', 'rgba(255,248,244,0.8)', '#FFF8F4']}
          locations={[0, 0.4, 0.8]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            
            {/* Upper Hero Section */}
            <View style={styles.hero}>
              <View style={styles.brandWrapper}>
                <View style={styles.iconCircle}>
                  <HeartIcon size={56} color={colors.rose[500]} />
                </View>
                <Text style={styles.logoText}>MamaCare</Text>
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
                  Already a member? <Text style={{ fontWeight: '700' }}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTimeBasedGreeting() {
  const hr = new Date().getHours();
  if (hr < 12) return "Good morning";
  if (hr < 17) return "Good afternoon";
  return "Good evening";
}

function getDailyMessage() {
  const messages = [
    "You are doing beautifully, even on the hard days.",
    "Your body is capable of extraordinary things.",
    "Breathe. You are exactly where you need to be.",
    "Small steps still move you forward.",
    "You are already a wonderful mother.",
  ];
  const day = new Date().getDate();
  return messages[day % messages.length];
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F4' },
  safeArea: { flex: 1 },
  content: { 
    flex: 1, 
    paddingHorizontal: 30, 
    justifyContent: 'space-between',
    paddingBottom: 20 
  },
  
  // Hero
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  brandWrapper: { alignItems: 'center', marginBottom: 40 },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.navy[700],
    letterSpacing: -1,
  },
  
  messageStack: { alignItems: 'center', gap: 12 },
  timeGreeting: {
    fontSize: 16,
    color: colors.navy[400],
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600'
  },
  dailyQuote: {
    fontSize: 22,
    color: colors.navy[700],
    textAlign: 'center',
    lineHeight: 32,
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
  footer: { paddingBottom: 40 },
  tagline: {
    fontSize: 15,
    color: colors.navy[500],
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  mainBtn: {
    backgroundColor: colors.rose[500],
    paddingVertical: 18,
    borderRadius: 20,
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
});