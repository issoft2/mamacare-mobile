/**
 * mobile/app/(tabs)/tracker.tsx
 * Daily tracker — kicks, hydration, sleep, mood.
 */

import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  useHydrationLogs, useKickSessions,
  useLogHydration, useMoodLogs,
  useSleepLogs, useStartKickSession,
} from "@mamacare/api";
import { useProfile } from "@mamacare/api";
import { colors, shadows, spacing, typography } from "@mamacare/ui";

export default function TrackerScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: kicks }     = useKickSessions();
  const { data: hydration } = useHydrationLogs();
  const { data: sleep }     = useSleepLogs();
  const { data: mood }      = useMoodLogs();

  const startKick  = useStartKickSession();
  const logWater   = useLogHydration();

  const todayHydration = hydration?.[0];
  const glassesCount   = todayHydration?.glasses_count ?? 0;
  const targetGlasses  = todayHydration?.target_glasses ?? 8;
  const activeKick     = kicks?.find(k => !k.ended_at);

  async function handleAddGlass() {
    await logWater.mutateAsync({ glasses_count: glassesCount + 1 });
  }

  async function handleStartKick() {
    const week = profile?.gestational_week ?? 12;
    const session = await startKick.mutateAsync(week);
    router.push(`/tracker/kick/${session.id}` as any);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Hydration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💧 Hydration Today</Text>
        <Text style={styles.cardValue}>{glassesCount} / {targetGlasses} glasses</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(100, (glassesCount / targetGlasses) * 100)}%` as any }]} />
        </View>
        <TouchableOpacity style={styles.actionButton} onPress={handleAddGlass}>
          <Text style={styles.actionButtonText}>+ Add a Glass</Text>
        </TouchableOpacity>
      </View>

      {/* Kick counter */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👶 Kick Counter</Text>
        {activeKick ? (
          <>
            <Text style={styles.cardValue}>{activeKick.kick_count} kicks</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/tracker/kick/${activeKick.id}` as any)}
            >
              <Text style={styles.actionButtonText}>Continue Session</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.actionButton} onPress={handleStartKick}>
            <Text style={styles.actionButtonText}>Start Counting</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sleep */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>😴 Sleep</Text>
        {sleep?.[0] ? (
          <Text style={styles.cardValue}>
            {sleep[0].duration_band.replace(/_/g, " ")} · {sleep[0].quality}
          </Text>
        ) : (
          <Text style={styles.cardMeta}>No sleep log for today</Text>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/tracker/sleep" as any)}
        >
          <Text style={styles.actionButtonText}>Log Sleep</Text>
        </TouchableOpacity>
      </View>

      {/* Mood */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌸 Mood</Text>
        {mood?.[0] ? (
          <Text style={styles.cardValue}>{mood[0].mood}</Text>
        ) : (
          <Text style={styles.cardMeta}>How are you feeling today?</Text>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/tracker/mood" as any)}
        >
          <Text style={styles.actionButtonText}>Log Mood</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.gray[50] },
  content:          { padding: spacing[4], gap: spacing[4] },
  card:             { backgroundColor: colors.white, borderRadius: 16, padding: spacing[5], gap: spacing[3], ...shadows.md },
  cardTitle:        { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.gray[700] },
  cardValue:        { fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.navy[700], textTransform: "capitalize" },
  cardMeta:         { fontSize: typography.fontSize.sm, color: colors.gray[400] },
  progressBar:      { height: 6, backgroundColor: colors.gray[100], borderRadius: 3, overflow: "hidden" },
  progressFill:     { height: "100%", backgroundColor: colors.rose[500], borderRadius: 3 },
  actionButton:     { backgroundColor: colors.rose[500], borderRadius: 10, paddingVertical: spacing[3], alignItems: "center" },
  actionButtonText: { color: colors.white, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm },
});
