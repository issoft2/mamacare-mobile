/**
 * mobile/app/tabs/home.tsx
 * Refined for High Depth & Emotional Presence
 */

import { useUser } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from "react-native-svg";
import {
  useAppointments,
  useHydrationLogs,
  useMoodLogs,
  useProfile,
  useSleepLogs,
  useSymptomPatterns,
} from "@mamacare/api";
import {
  MedicalDetailsCard,
  shouldShowMedicalDetailsPrompt,
} from "@/components/MedicalDetailsCard";
import { colors, spacing, typography, shadows } from "@mamacare/ui";

type CareIconName = "chat" | "symptoms" | "kicks" | "water" | "mood" | "sleep";
type Feeling = "steady" | "tired" | "anxious" | "hopeful";

const FEELINGS: { key: Feeling; label: string; emoji: string }[] = [
  { key: "steady", label: "Steady", emoji: "😐" },
  { key: "tired", label: "Tired", emoji: "😔" },
  { key: "anxious", label: "Anxious", emoji: "😨" },
  { key: "hopeful", label: "Hopeful", emoji: "😊" },
];

function CareIcon({
  name,
  color = colors.rose[500],
  size = 24,
}: {
  name: CareIconName;
  color?: string;
  size?: number;
}) {
  const common = {
    stroke: color,
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === "chat" && <Path d="M5 7.5c0-1.7 1.4-3 3.1-3h7.8c1.7 0 3.1 1.4 3.1 3v4.2c0 1.7-1.4 3-3.1 3h-2.9L8 18.5V14.7c-1.7-.2-3-1.6-3-3.2V7.5z" {...common} />}
      {name === "symptoms" && <Path d="M12 18.5s-5-3.5-5-7.2c0-2.2 2-3.7 5-.9 3-2.8 5-1.3 5 .9 0 3.7-5 7.2-5 7.2z" {...common} />}
      {name === "water" && <Path d="M12 3.8s4.6 5.2 4.6 9c0 2.5-2.1 4.6-4.6 4.6S7.4 15.3 7.4 12.8c0-3.8 4.6-9 4.6-9z" {...common} />}
      {name === "mood" && <><Circle cx="12" cy="12" r="7" {...common} /><Path d="M9.2 10.5h.1M14.8 10.5h.1M9.5 13.5c1.5 1.2 3.5 1.2 5 0" {...common} /></>}
      {name === "sleep" && <Path d="M16.5 15A6 6 0 0 1 9.3 7.8 6.5 6.5 0 1 0 16.5 15z" {...common} />}
    </Svg>
  );
}

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [medicalPromptDismissed, setMedicalPromptDismissed] = useState(false);
  const { data: profile } = useProfile();
  const { data: patterns } = useSymptomPatterns();
  const { data: hydration } = useHydrationLogs();
  const { data: mood } = useMoodLogs();
  const { data: sleep } = useSleepLogs();
  const { data: appointments } = useAppointments();

  const firstName = profile?.first_name ?? user?.firstName ?? "Sarah";
  const week = profile?.gestational_week;
  const hasAlerts = patterns?.has_alerts ?? false;
  const showMedicalPrompt = !medicalPromptDismissed && shouldShowMedicalDetailsPrompt(profile);
  
  const todayHydration = hydration?.[0];
  const glassesCount = todayHydration?.glasses_count ?? 0;
  const targetGlasses = todayHydration?.target_glasses ?? 8;
  const hydrationProgress = Math.min(100, (glassesCount / targetGlasses) * 100);

  const nextAppointment = useMemo(() => 
    appointments?.filter(i => i.status === "scheduled").sort((a,b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0], 
  [appointments]);

  return (
    <View style={styles.screen}>
      <ImageBackground source={require("@/assets/images/mamacare-home-bg.png")} style={styles.bgImage}>
        <LinearGradient colors={["rgba(255,255,255,0.7)", "rgba(255,245,245,0.4)"]} style={styles.bgOverlay}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            <View style={styles.heroHeader}>
              <Text style={styles.greetingText}>Good evening, {firstName} <Text style={styles.sparkle}>✨</Text></Text>
              <View style={styles.weekRow}>
                <Text style={styles.weekText}>{week ? `You and baby are in week ${week}` : "Your journey starts here"}</Text>
                <View style={styles.eggContainer}><Text style={styles.eggIcon}>🥚</Text></View>
              </View>
              <Text style={styles.heroSubText}>One gentle step at a time today.</Text>
            </View>

            <TouchableOpacity style={styles.askCard} onPress={() => router.push("/tabs/chat")}>
              <LinearGradient colors={["#E8697C", "#FFA07A"]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.askGradient}>
                <View style={styles.askRow}>
                  <CareIcon name="chat" color="#FFF" size={20} />
                  <Text style={styles.askTitle}>Ask MamaCare</Text>
                </View>
                <View style={styles.fakeInput}>
                  <Text style={styles.fakeInputText}>Sarah, tell me what's on your mind...</Text>
                  <Text style={styles.keyboardIcon}>⌨️</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How are you feeling?</Text>
              <View style={styles.feelingRow}>
                {FEELINGS.map((f) => (
                  <TouchableOpacity key={f.key} onPress={() => setFeeling(f.key)} style={styles.feelingCol}>
                    <View style={[styles.moodCircle, feeling === f.key && styles.moodCircleActive]}>
                      <Text style={styles.moodEmoji}>{f.emoji}</Text>
                    </View>
                    <Text style={[styles.moodLabel, feeling === f.key && styles.moodLabelActive]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's care</Text>
              <View style={styles.careGrid}>
                {[ 
                  { label: "Hydration", val: `${glassesCount}/${targetGlasses} Glasses`, icon: "water", color: "#88B0A8", progress: hydrationProgress },
                  { label: "Mood", val: mood?.[0]?.mood ?? "Not set", icon: "mood", color: "#E8697C" },
                  { label: "Rest", val: sleep?.[0]?.duration_band ?? "Log rest", icon: "sleep", color: "#6B7BB8", progress: 50 },
                  { label: "Next Visit", val: nextAppointment ? "Scheduled" : "None", icon: "symptoms", color: "#E8697C" }
                ].map((item, idx) => (
                  <View key={idx} style={styles.careCard}>
                    <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                      <CareIcon name={item.icon as any} color={item.color} size={20} />
                    </View>
                    <Text style={styles.careCardLabel}>{item.label}</Text>
                    <Text style={styles.careCardVal}>{item.val}</Text>
                    {item.progress !== undefined && (
                      <View style={styles.miniTrack}><View style={[styles.miniFill, { width: `${item.progress}%`, backgroundColor: item.color }]} /></View>
                    )}
                  </View>
                ))}
              </View>
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
  content: { padding: 20, paddingTop: 60, paddingBottom: 120 },
  heroHeader: { marginBottom: 25 },
  greetingText: { fontSize: 28, fontWeight: "700", color: "#1A237E" },
  sparkle: { fontSize: 20 },
  weekRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 5 },
  weekText: { fontSize: 18, fontWeight: "600", color: "#3949AB", flex: 1 },
  eggContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", elevation: 4, shadowOpacity: 0.1 },
  eggIcon: { fontSize: 24 },
  heroSubText: { fontSize: 14, color: "#757575", marginTop: 8 },
  askCard: { borderRadius: 24, overflow: "hidden", elevation: 8, shadowColor: "#E8697C", shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 10 } },
  askGradient: { padding: 20 },
  askRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 15 },
  askTitle: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  fakeInput: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 15, padding: 12, flexDirection: "row", justifyContent: "space-between" },
  fakeInputText: { color: "#FFF", opacity: 0.8, fontSize: 13 },
  keyboardIcon: { fontSize: 14 },
  section: { marginTop: 30 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#1A237E", marginBottom: 15 },
  feelingRow: { flexDirection: "row", justifyContent: "space-between" },
  feelingCol: { alignItems: "center", width: "22%" },
  moodCircle: { width: 55, height: 55, borderRadius: 28, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", elevation: 2, shadowOpacity: 0.05 },
  moodCircleActive: { borderWidth: 2, borderColor: "#E8697C", transform: [{ scale: 1.1 }] },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontSize: 12, marginTop: 8, color: "#757575" },
  moodLabelActive: { color: "#E8697C", fontWeight: "700" },
  careGrid: { flexDirection: "row", flexWrap: "wrap", gap: 15 },
  careCard: { width: "47.5%", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 20, padding: 15, elevation: 3, shadowOpacity: 0.05 },
  iconBox: { width: 35, height: 35, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  careCardLabel: { fontSize: 12, color: "#9E9E9E", marginBottom: 4 },
  careCardVal: { fontSize: 15, fontWeight: "700", color: "#1A237E" },
  miniTrack: { height: 5, backgroundColor: "#E0E0E0", borderRadius: 3, marginTop: 10, overflow: "hidden" },
  miniFill: { height: "100%", borderRadius: 3 }
});