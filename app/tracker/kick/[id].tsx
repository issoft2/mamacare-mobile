/**
 * mobile/app/tracker/kick/[id].tsx
 * High-Contrast Immersive Kick Counter
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Vibration } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { useEndKickSession, useLogKick } from "@mamacare/api";

export default function KickCounterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const logKick = useLogKick(id);
  const endSession = useEndKickSession(id);
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
    Vibration.vibrate(50); // Haptic feedback for tactile feel
    setCount(c => c + 1);
    await logKick.mutateAsync(1);
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={["#1A237E", "#0D1137"]} style={styles.container}>
        
        <View style={styles.topSection}>
          <Text style={styles.timerLabel}>ELAPSED TIME</Text>
          <Text style={styles.timerValue}>{formatTime()}</Text>
        </View>

        <View style={styles.counterContainer}>
          <View style={styles.glowRing}>
             <LinearGradient 
              colors={count >= 10 ? ["#88B0A8", "#4facfe"] : ["#E8697C", "#FFA07A"]} 
              style={styles.countCircle}
            >
              <Text style={styles.countNumber}>{count}</Text>
              <Text style={styles.countLabel}>KICKS</Text>
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

        <TouchableOpacity style={styles.kickBtn} onPress={handleKick} activeOpacity={0.8}>
          <LinearGradient colors={["#E8697C", "#FFA07A"]} style={styles.kickGradient}>
            <Text style={styles.kickBtnText}>Record a Kick</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endBtn} onPress={() => endSession.mutateAsync().then(() => router.back())}>
          <Text style={styles.endBtnText}>Finish & Save Session</Text>
        </TouchableOpacity>

        {count < 10 && seconds > 7200 && (
          <View style={styles.alert}>
            <Ionicons name="warning" size={20} color="#FFF" />
            <Text style={styles.alertText}>Goal not met in 2 hours. Consult your care team.</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 80, paddingHorizontal: 30 },
  topSection: { alignItems: 'center' },
  timerLabel: { color: '#6B7BB8', fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  timerValue: { color: '#FFF', fontSize: 42, fontWeight: '300', letterSpacing: 5 },
  counterContainer: { alignItems: 'center', justifyContent: 'center' },
  glowRing: { padding: 15, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.05)' },
  countCircle: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', elevation: 20, shadowColor: '#E8697C', shadowOpacity: 0.5, shadowRadius: 20 },
  countNumber: { fontSize: 72, fontWeight: '900', color: '#FFF' },
  countLabel: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
  infoBox: { paddingHorizontal: 40 },
  guidance: { color: '#BDBDBD', textAlign: 'center', lineHeight: 22, fontSize: 15 },
  kickBtn: { width: '100%', borderRadius: 25, overflow: 'hidden', elevation: 10 },
  kickGradient: { paddingVertical: 20, alignItems: 'center' },
  kickBtnText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  endBtn: { padding: 10 },
  endBtnText: { color: '#6B7BB8', fontWeight: '600' },
  alert: { flexDirection: 'row', backgroundColor: '#D32F2F', padding: 15, borderRadius: 15, alignItems: 'center', gap: 10, width: '100%' },
  alertText: { color: '#FFF', fontSize: 13, fontWeight: '600', flex: 1 }
});