/**
 * mobile/app/tracker/kick/[id].tsx
 * High-Contrast Immersive Kick Counter
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Vibration } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ctaButtonStyles, ctaGradientColors } from "../../../components/styles/ctaButton";
import { Ionicons } from '@expo/vector-icons';
import { useEndKickSession, useLogKick, useProfile } from "@mumcare/api";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";
import promptFinishOnboarding from "@/lib/onboardingPrompt";

export default function KickCounterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const logKick = useLogKick(id);
  const endSession = useEndKickSession(id);
  const { data: profile } = useProfile();
  const hasCompletedOnboarding = Boolean(profile);
  const onboardingRedirectPath = "/onboarding/profile-setup";
  const [count, setCount] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  async function handleKick() {
    if (!hasCompletedOnboarding) {
      promptFinishOnboarding(router);
      return;
    }
    Vibration.vibrate(50); // Haptic feedback for tactile feel
    setCount(c => c + 1);
    await logKick.mutateAsync(1);
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.container}>
        
        <View style={styles.topSection}>
          <Text style={styles.timerLabel}>Elapsed time</Text>
          <Text style={styles.timerValue}>{formatTime()}</Text>
        </View>

        <View style={styles.counterContainer}>
          <View style={styles.glowRing}>
             <LinearGradient 
              colors={count >= 10 ? [AUTH_UI.semanticMild, AUTH_UI.semanticBlue] : [AUTH_UI.semanticSevere, AUTH_UI.shadowRose]} 
              style={styles.countCircle}
            >
              <Text style={styles.countNumber}>{count}</Text>
              <Text style={styles.countLabel}>kicks</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.guidance}>
            {count < 10 
              ? `You need ${10 - count} more kicks to reach today's goal.` 
              : "Daily goal met! You can continue or end session."}
          </Text>
        </View>

        <TouchableOpacity style={[ctaButtonStyles.button, styles.kickBtn]} onPress={handleKick} activeOpacity={0.8}>
          <LinearGradient colors={ctaGradientColors} style={ctaButtonStyles.gradient}>
            <Text style={ctaButtonStyles.text}>Record a kick</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endBtn} onPress={() => endSession.mutateAsync().then(() => router.push("/tabs/tracker"))}>
          <Text style={styles.endBtnText}>Finish and save session</Text>
        </TouchableOpacity>

        {count < 10 && seconds > 7200 && (
          <View style={styles.alert}>
            <Ionicons name="warning" size={20} color={AUTH_UI.textWhite} />
            <Text style={styles.alertText}>Goal not met in 2 hours. Consult your care team.</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_UI.warmBackground },
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 80, paddingHorizontal: 30 },
  topSection: { alignItems: 'center' },
  timerLabel: { color: AUTH_UI.textBlack, fontSize: 13, fontWeight: '700', marginBottom: 8, fontFamily: FONT_FRIENDLY_SANS },
  timerValue: { color: AUTH_UI.textHeading, fontSize: 42, fontWeight: '300', letterSpacing: 4, fontFamily: FONT_WARM_SERIF },
  counterContainer: { alignItems: 'center', justifyContent: 'center' },
  glowRing: { padding: 15, borderRadius: 120, backgroundColor: AUTH_UI.overlayWhite05 },
  countCircle: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', elevation: 20, shadowColor: AUTH_UI.shadowRose, shadowOpacity: 0.5, shadowRadius: 20 },
  countNumber: { fontSize: 72, fontWeight: '900', color: AUTH_UI.textWhite },
  countLabel: { fontSize: 14, fontWeight: '700', color: AUTH_UI.overlayWhite88 },
  infoBox: { paddingHorizontal: 40 },
  guidance: { color: AUTH_UI.textBlack, textAlign: 'center', lineHeight: 22, fontSize: 15, fontFamily: FONT_FRIENDLY_SANS },
  kickBtn: { width: '100%', marginTop: 20 },
  endBtn: { padding: 10 },
  endBtnText: { color: AUTH_UI.linkBerry, fontWeight: '700', fontFamily: FONT_FRIENDLY_SANS },
  alert: { flexDirection: 'row', backgroundColor: AUTH_UI.redAlert, padding: 15, borderRadius: 15, alignItems: 'center', gap: 10, width: '100%' },
  alertText: { color: AUTH_UI.textWhite, fontSize: 13, fontWeight: '600', flex: 1, fontFamily: FONT_FRIENDLY_SANS }
});