/**
 * mobile/app/(tabs)/tracker.tsx
 * Refined High-Depth Tracker Dashboard
 */

import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import {
  useHydrationLogs, useKickSessions,
  useLogHydration, useMoodLogs,
  useSleepLogs, useStartKickSession,
  useProfile
} from "@mamacare/api";

export default function TrackerScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: kicks } = useKickSessions();
  const { data: hydration } = useHydrationLogs();
  const { data: sleep } = useSleepLogs();
  const { data: mood } = useMoodLogs();

  const startKick = useStartKickSession();
  const logWater = useLogHydration();

  const todayHydration = hydration?.[0];
  const glassesCount = todayHydration?.glasses_count ?? 0;
  const targetGlasses = todayHydration?.target_glasses ?? 8;
  const activeKick = kicks?.find(k => !k.ended_at);

  const hydrationProgress = Math.min(100, (glassesCount / targetGlasses) * 100);

  return (
    <View style={styles.screen}>
      <ImageBackground source={require("@/assets/images/mamacare-home-bg.png")} style={styles.bgImage}>
        <LinearGradient colors={["rgba(255,255,255,0.7)", "rgba(255,245,245,0.4)"]} style={styles.bgOverlay}>
          
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.screenTitle}>Daily Wellness</Text>

            {/* Hydration Widget */}
            <View style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(74, 144, 226, 0.1)' }]}>
                  <Ionicons name="water" size={20} color="#4A90E2" />
                </View>
                <Text style={styles.cardTitle}>Hydration</Text>
              </View>
              <Text style={styles.cardValue}>{glassesCount} <Text style={styles.unit}>/ {targetGlasses} glasses</Text></Text>
              <View style={styles.progressTrack}>
                <LinearGradient 
                  colors={["#4facfe", "#00f2fe"]} 
                  start={{x:0, y:0}} end={{x:1, y:0}} 
                  style={[styles.progressFill, { width: `${hydrationProgress}%` }]} 
                />
              </View>
              <TouchableOpacity style={styles.widgetBtn} onPress={() => logWater.mutateAsync({ glasses_count: glassesCount + 1 })}>
                <Text style={styles.widgetBtnText}>+ Add a Glass</Text>
              </TouchableOpacity>
            </View>

            {/* Kick Counter Widget */}
            <View style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(232, 105, 124, 0.1)' }]}>
                  <Ionicons name="heart" size={20} color="#E8697C" />
                </View>
                <Text style={styles.cardTitle}>Kick Counter</Text>
              </View>
              <Text style={styles.cardValue}>{activeKick ? activeKick.kick_count : "0"} <Text style={styles.unit}>kicks today</Text></Text>
              <TouchableOpacity 
                style={[styles.widgetBtn, { backgroundColor: '#E8697C' }]} 
                onPress={async () => {
                   if(activeKick) router.push(`/tracker/kick/${activeKick.id}` as any);
                   else {
                     const session = await startKick.mutateAsync(profile?.gestational_week ?? 12);
                     router.push(`/tracker/kick/${session.id}` as any);
                   }
                }}
              >
                <Text style={[styles.widgetBtnText, { color: '#FFF' }]}>
                  {activeKick ? "Continue Session" : "Start Counting"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sleep & Mood Row */}
            <View style={styles.row}>
              <TouchableOpacity style={[styles.halfCard]} onPress={() => router.push("/tracker/sleep" as any)}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(107, 123, 184, 0.1)' }]}>
                   <Ionicons name="moon" size={18} color="#6B7BB8" />
                </View>
                <Text style={styles.halfTitle}>Sleep</Text>
                <Text style={styles.halfValue}>{sleep?.[0] ? sleep[0].quality : "Log rest"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.halfCard]} onPress={() => router.push("/tracker/mood" as any)}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(232, 105, 124, 0.1)' }]}>
                   <Ionicons name="happy" size={18} color="#E8697C" />
                </View>
                <Text style={styles.halfTitle}>Mood</Text>
                <Text style={styles.halfValue}>{mood?.[0] ? mood[0].mood : "Set mood"}</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgImage: { flex: 1 },
  bgOverlay: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  screenTitle: { fontSize: 28, fontWeight: "700", color: "#1A237E", marginBottom: 25 },
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    elevation: 4,
    shadowOpacity: 0.05
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#757575", textTransform: 'uppercase', letterSpacing: 1 },
  cardValue: { fontSize: 28, fontWeight: "800", color: "#1A237E", marginBottom: 15 },
  unit: { fontSize: 16, fontWeight: "400", color: "#9E9E9E" },
  progressTrack: { height: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 4, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  widgetBtn: { backgroundColor: 'rgba(255,255,255,0.8)', paddingVertical: 12, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  widgetBtnText: { fontWeight: "700", color: "#1A237E" },
  row: { flexDirection: 'row', gap: 15 },
  halfCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 24, padding: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)" },
  halfTitle: { fontSize: 12, fontWeight: "700", color: "#9E9E9E", marginTop: 10 },
  halfValue: { fontSize: 16, fontWeight: "700", color: "#1A237E", marginTop: 2, textTransform: 'capitalize' }
});