/**
 * mobile/app/(tabs)/tracker.tsx
 * Refined High-Depth Tracker Dashboard
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import {
  useFolicAcidLogs,
  useHydrationLogs, useKickSessions,
  useLogFolicAcid,
  useLogHydration, useMoodLogs,
  useSleepLogs, useStartKickSession,
  useProfile
} from "@mumcare/api";

const KICK_COUNTER_MIN_WEEK = 16;

function getLocalDateKey(value: Date): string {
  const yyyy = value.getFullYear();
  const mm = `${value.getMonth() + 1}`.padStart(2, "0");
  const dd = `${value.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDateKeyFromRaw(value: string | undefined): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return getLocalDateKey(date);
}

export default function TrackerScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 980;
  const { data: profile } = useProfile();
  const { data: kicks } = useKickSessions();
  const { data: hydration } = useHydrationLogs();
  const { data: folicAcidLogs } = useFolicAcidLogs();
  const { data: sleep } = useSleepLogs();
  const { data: mood } = useMoodLogs();

  const startKick = useStartKickSession();
  const logWater = useLogHydration();
  const logFolicAcid = useLogFolicAcid();
  const [folicTakenLocal, setFolicTakenLocal] = useState(false);
  const todayDateKey = getLocalDateKey(new Date());
  const gestationalWeek = profile?.gestational_week ?? 0;
  const canUseKickCounter = gestationalWeek >= KICK_COUNTER_MIN_WEEK;

  const todayHydration = hydration?.find((entry) => {
    const dateKey = getDateKeyFromRaw(entry.log_date) ?? getDateKeyFromRaw(entry.created_at);
    return dateKey === todayDateKey;
  });
  const glassesCount = todayHydration?.glasses_count ?? 0;
  const targetGlasses = todayHydration?.target_glasses ?? 8;
  const activeKick = kicks?.find(k => !k.ended_at);

  const todayFolicAcidLog = folicAcidLogs?.find((entry) => {
    const dateKey = getDateKeyFromRaw(entry.log_date) ?? getDateKeyFromRaw(entry.created_at);
    return dateKey === todayDateKey;
  });
  const folicTakenToday = todayFolicAcidLog?.taken === true || folicTakenLocal;

  const hydrationProgress = Math.min(100, (glassesCount / targetGlasses) * 100);

  return (
    <View style={styles.screen}>
        <LinearGradient colors={["rgba(255,255,255,0.7)", "rgba(255,245,245,0.4)"]} style={styles.bgOverlay}>
          
          <ScrollView
            contentContainerStyle={[styles.content, isWide && styles.contentWide]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.screenTitle}>Daily Wellness</Text>

            <View style={[styles.dashboardGrid, isWide && styles.dashboardGridWide]}>
              {/* Hydration Widget */}
              <View style={[styles.glassCard, isWide && styles.glassCardWide]}>
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
                <TouchableOpacity 
                  style={[styles.widgetBtn, { backgroundColor: '#E8697C' }]}
                  onPress={() =>
                    logWater.mutateAsync({
                      glasses_count: glassesCount + 1,
                      target_glasses: targetGlasses,
                      log_date: todayDateKey,
                    })
                  }
                >
                  <Text style={[styles.widgetBtnText, { color: '#FFF' }]}>Add a Glass</Text>
                </TouchableOpacity>
              </View>

              {/* Folic Acid Widget */}
              <View style={[styles.glassCard, isWide && styles.glassCardWide]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(107, 123, 184, 0.12)' }]}>
                    <Ionicons name="medkit-outline" size={20} color="#6B7BB8" />
                  </View>
                  <Text style={styles.cardTitle}>Folic Acid</Text>
                </View>
                <Text style={styles.cardValue}>{folicTakenToday ? "1/1" : "0/1"} <Text style={styles.unit}>today</Text></Text>
                <TouchableOpacity
                  style={[
                    styles.widgetBtn,
                    { backgroundColor: '#E8697C' },
                    (folicTakenToday || logFolicAcid.isPending) && styles.widgetBtnDisabled,
                  ]}
                  disabled={folicTakenToday || logFolicAcid.isPending}
                  onPress={async () => {
                    if (folicTakenToday || logFolicAcid.isPending) return;
                    setFolicTakenLocal(true);
                    try {
                      await logFolicAcid.mutateAsync({ taken: true, log_date: todayDateKey });
                    } catch {
                      // Keep local optimistic state to avoid a broken-feeling tap flow.
                    }
                  }}
                >
                  <Text style={[styles.widgetBtnText, { color: '#FFF' }]}>
                    {folicTakenToday ? "Already logged" : "Log intake"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Kick Counter Widget */}
              <View style={[styles.glassCard, isWide && styles.glassCardWide]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(232, 105, 124, 0.1)' }]}>
                    <Ionicons name="heart" size={20} color="#E8697C" />
                  </View>
                  <Text style={styles.cardTitle}>Kick Counter</Text>
                </View>
                <Text style={styles.cardValue}>{activeKick ? activeKick.kick_count : "0"} <Text style={styles.unit}>kicks today</Text></Text>
                <TouchableOpacity 
                  style={[
                    styles.widgetBtn,
                    { backgroundColor: '#E8697C' },
                    !canUseKickCounter && styles.widgetBtnDisabled,
                  ]}
                  disabled={!canUseKickCounter}
                  onPress={async () => {
                     if (!canUseKickCounter) return;
                     if(activeKick) router.push(`/tracker/kick/${activeKick.id}` as any);
                     else {
                       const session = await startKick.mutateAsync(profile?.gestational_week ?? 12);
                       router.push(`/tracker/kick/${session.id}` as any);
                     }
                  }}
                >
                  <Text style={[styles.widgetBtnText, { color: '#FFF' }]}>
                    {canUseKickCounter
                      ? (activeKick ? "Continue Session" : "Start Counting")
                      : "Available from week 16"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sleep & Mood Row */}
              <View style={[styles.row, isWide && styles.rowWide]}>
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
            </View>

          </ScrollView>
        </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgImage: { flex: 1 },
  bgOverlay: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 32 },
  contentWide: { width: "100%", maxWidth: 1180, alignSelf: "center", padding: 32 },
  screenTitle: { fontSize: 28, fontWeight: "700", color: "#1A237E", marginBottom: 25 },
  dashboardGrid: { gap: 15 },
  dashboardGridWide: { flexDirection: "row", flexWrap: "wrap", alignItems: "stretch" },
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
  glassCardWide: { width: "48.5%", minWidth: 320 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#757575", textTransform: 'uppercase', letterSpacing: 1 },
  cardValue: { fontSize: 28, fontWeight: "800", color: "#1A237E", marginBottom: 15 },
  unit: { fontSize: 16, fontWeight: "400", color: "#9E9E9E" },
  progressTrack: { height: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 4, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  widgetBtn: { backgroundColor: 'rgba(255,255,255,0.8)', paddingVertical: 12, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  widgetBtnDisabled: { opacity: 0.6 },
  widgetBtnText: { fontWeight: "700", color: "#1A237E" },
  row: { flexDirection: 'row', gap: 15 },
  rowWide: { width: "48.5%", minWidth: 320 },
  halfCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 24, padding: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)" },
  halfTitle: { fontSize: 12, fontWeight: "700", color: "#9E9E9E", marginTop: 10 },
  halfValue: { fontSize: 16, fontWeight: "700", color: "#1A237E", marginTop: 2, textTransform: 'capitalize' }
});
