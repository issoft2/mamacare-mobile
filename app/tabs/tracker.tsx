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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import {
  useTodayFolicAcidLog,
  useHydrationLogs, useKickSessions,
  useLogFolicAcid,
  useLogHydration, useMoodLogs,
  useSleepLogs, useStartKickSession,
  useProfile
} from "@mumcare/api";
import { colors } from "@mumcare/ui";
import { ctaGradientColors } from "../../components/styles/ctaButton";
import { resolveCurrentGestationalWeek } from "@/lib/gestationalWeek";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

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
  const { data: todayFolicAcidLog } = useTodayFolicAcidLog();
  const { data: sleep } = useSleepLogs();
  const { data: mood } = useMoodLogs();

  const startKick = useStartKickSession();
  const logWater = useLogHydration();
  const logFolicAcid = useLogFolicAcid();
  const [folicTakenLocal, setFolicTakenLocal] = useState(false);
  const todayDateKey = getLocalDateKey(new Date());
  const gestationalWeek = resolveCurrentGestationalWeek(profile) ?? 0;
  const canUseKickCounter = gestationalWeek >= KICK_COUNTER_MIN_WEEK;

  const todayHydration = hydration?.find((entry) => {
    const dateKey = getDateKeyFromRaw(entry.log_date) ?? getDateKeyFromRaw(entry.created_at);
    return dateKey === todayDateKey;
  });
  const glassesCount = todayHydration?.glasses_count ?? 0;
  const targetGlasses = todayHydration?.target_glasses ?? 8;
  const activeKick = kicks?.find(k => !k.ended_at);

  const folicTakenToday =
    todayFolicAcidLog?.is_logged_today === true ||
    todayFolicAcidLog?.taken === true ||
    folicTakenLocal;

  const hydrationProgress = Math.min(100, (glassesCount / targetGlasses) * 100);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.bgOverlay}>
          
          <ScrollView
            contentContainerStyle={[styles.content, isWide && styles.contentWide]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.screenTitle}>Daily wellness</Text>

            <View style={[styles.dashboardGrid, isWide && styles.dashboardGridWide]}>
              {/* Hydration Widget */}
              <View style={[styles.glassCard, isWide && styles.glassCardWide]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: AUTH_UI.semanticBlueSoft }]}>
                    <Ionicons name="water" size={20} color={AUTH_UI.semanticBlue} />
                  </View>
                  <Text style={styles.cardTitle}>Hydration</Text>
                </View>
                <Text style={styles.cardValue}>{glassesCount} <Text style={styles.unit}>/ {targetGlasses} glasses</Text></Text>
                <View style={styles.progressTrack}>
                  <LinearGradient 
                    colors={ctaGradientColors} 
                    start={{x:0, y:0}} end={{x:1, y:0}} 
                    style={[styles.progressFill, { width: `${hydrationProgress}%` }]} 
                  />
                </View>
                <TouchableOpacity 
                  style={[styles.widgetBtn, { backgroundColor: AUTH_UI.shadowRose }]}
                  onPress={() =>
                    logWater.mutateAsync({
                      glasses_count: glassesCount + 1,
                      target_glasses: targetGlasses,
                      log_date: todayDateKey,
                    })
                  }
                >
                    <Text style={[styles.widgetBtnText, { color: AUTH_UI.textWhite }]}>Add a glass</Text>
                </TouchableOpacity>
              </View>

              {/* Folic Acid Widget */}
              <View style={[styles.glassCard, isWide && styles.glassCardWide]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: AUTH_UI.semanticBlueSoft }]}>
                    <Ionicons name="medkit-outline" size={20} color={AUTH_UI.semanticBlue} />
                  </View>
                  <Text style={styles.cardTitle}>Folic Acid</Text>
                </View>
                <Text style={styles.cardValue}>{folicTakenToday ? "1/1" : "0/1"} <Text style={styles.unit}>today</Text></Text>
                <TouchableOpacity
                  style={[
                    styles.widgetBtn,
                    { backgroundColor: AUTH_UI.shadowRose },
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
                  <Text style={[styles.widgetBtnText, { color: AUTH_UI.textWhite }]}>
                    {folicTakenToday ? "Already logged" : "Log intake"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Kick Counter Widget */}
              <View style={[styles.glassCard, isWide && styles.glassCardWide]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: AUTH_UI.semanticSevereBgSoft }]}>
                    <Ionicons name="heart" size={20} color={colors.rose[500]} />
                  </View>
                  <Text style={styles.cardTitle}>Kick Counter</Text>
                </View>
                <Text style={styles.cardValue}>{activeKick ? activeKick.kick_count : "0"} <Text style={styles.unit}>kicks today</Text></Text>
                <TouchableOpacity 
                  style={[
                    styles.widgetBtn,
                    { backgroundColor: AUTH_UI.shadowRose },
                    !canUseKickCounter && styles.widgetBtnDisabled,
                  ]}
                  disabled={!canUseKickCounter}
                  onPress={async () => {
                     if (!canUseKickCounter) return;
                     if(activeKick) router.push(`/tracker/kick/${activeKick.id}` as any);
                     else {
                       const session = await startKick.mutateAsync(gestationalWeek || 12);
                       router.push(`/tracker/kick/${session.id}` as any);
                     }
                  }}
                >
                  <Text style={[styles.widgetBtnText, { color: AUTH_UI.textWhite }]}>
                    {canUseKickCounter
                      ? (activeKick ? "Continue session" : "Start counting")
                      : "Available from week 16"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sleep & Mood Row */}
              <View style={[styles.row, isWide && styles.rowWide]}>
                <TouchableOpacity style={[styles.halfCard]} onPress={() => router.push("/tracker/sleep" as any)}>
                  <View style={[styles.iconCircle, { backgroundColor: AUTH_UI.semanticBlueSoft10 }]}>
                     <Ionicons name="moon" size={18} color={AUTH_UI.semanticBlue} />
                  </View>
                  <Text style={styles.halfTitle}>Sleep</Text>
                  <Text style={styles.halfValue}>{sleep?.[0] ? sleep[0].quality : "Log rest"}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.halfCard]} onPress={() => router.push("/tracker/mood" as any)}>
                  <View style={[styles.iconCircle, { backgroundColor: AUTH_UI.semanticSevereBgSoft }]}>
                     <Ionicons name="happy" size={18} color={colors.rose[500]} />
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
  screen: { flex: 1, backgroundColor: AUTH_UI.cream },
  bgOverlay: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  contentWide: { width: "100%", maxWidth: 1180, alignSelf: "center", padding: 32 },
  screenTitle: { fontSize: 30, fontWeight: "800", color: AUTH_UI.textHeading, marginBottom: 25, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.6 },
  dashboardGrid: { gap: 15 },
  dashboardGridWide: { flexDirection: "row", flexWrap: "wrap", alignItems: "stretch" },
  glassCard: {
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: AUTH_UI.inputRadius,
    paddingHorizontal: AUTH_UI.fieldPaddingX,
    paddingVertical: AUTH_UI.fieldPaddingY,
    marginBottom: 15,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: AUTH_UI.legalBorderSoft,
    elevation: 3,
    shadowColor: colors.rose[500],
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
  },
  glassCardWide: { width: "48.5%", minWidth: 320 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginRight: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  cardValue: { fontSize: 30, fontWeight: "800", color: AUTH_UI.textHeading, marginBottom: 15, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.4 },
  unit: { fontSize: 16, fontWeight: "400", color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  progressTrack: { height: 8, backgroundColor: AUTH_UI.borderTrackSoft, borderRadius: 4, marginBottom: 20, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  widgetBtn: { backgroundColor: AUTH_UI.overlayCard80, paddingVertical: 12, borderRadius: AUTH_UI.inputRadius, alignItems: "center", borderWidth: AUTH_UI.borderWidth, borderColor: AUTH_UI.legalBorderSoft },
  widgetBtnDisabled: { opacity: 0.6 },
  widgetBtnText: { fontWeight: "800", color: AUTH_UI.textHeading, fontSize: 16, fontFamily: FONT_FRIENDLY_SANS },
  row: { flexDirection: "row", gap: 15 },
  rowWide: { width: "48.5%", minWidth: 320 },
  halfCard: { flex: 1, backgroundColor: AUTH_UI.textWhite, borderRadius: AUTH_UI.inputRadius, padding: 15, borderWidth: AUTH_UI.borderWidth, borderColor: AUTH_UI.legalBorderSoft },
  halfTitle: { fontSize: 13, fontWeight: "700", color: AUTH_UI.textBlack, marginTop: 10, fontFamily: FONT_FRIENDLY_SANS },
  halfValue: { fontSize: 16, fontWeight: "700", color: AUTH_UI.textHeading, marginTop: 2, textTransform: "capitalize", fontFamily: FONT_FRIENDLY_SANS },
});
