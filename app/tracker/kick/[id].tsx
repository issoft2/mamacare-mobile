/**
 * mobile/app/tracker/kick/[id].tsx
 * Active kick counting session.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useEndKickSession, useLogKick } from "@mamacare/api";
import { colors, shadows, spacing, typography } from "@mamacare/ui";

export default function KickCounterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const logKick    = useLogKick(id);
  const endSession = useEndKickSession(id);

  const [count,   setCount]   = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes     = Math.floor(seconds / 60);
  const secs        = seconds % 60;
  const concernColor = count >= 10 ? colors.sage[500] : colors.urgency.log_only;

  async function handleKick() {
    setCount(c => c + 1);
    await logKick.mutateAsync(1);
  }

  async function handleEnd() {
    await endSession.mutateAsync();
    router.back();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>
        {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </Text>

      <View style={[styles.countCircle, { borderColor: concernColor }]}>
        <Text style={styles.countNumber}>{count}</Text>
        <Text style={styles.countLabel}>kicks</Text>
      </View>

      <Text style={styles.guidance}>
        {count < 10
          ? `${10 - count} more kicks needed in 2 hours`
          : "✓ 10 kicks reached — great!"}
      </Text>

      <TouchableOpacity style={styles.kickButton} onPress={handleKick} activeOpacity={0.7}>
        <Text style={styles.kickButtonText}>👶  Feel a Kick</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.endButton}
        onPress={handleEnd}
        disabled={endSession.isPending}
      >
        <Text style={styles.endButtonText}>End Session</Text>
      </TouchableOpacity>

      {count < 10 && seconds > 7200 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>
            ⚠️ Less than 10 kicks in 2 hours. Please contact your midwife.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.navy[700], alignItems: "center", justifyContent: "center", padding: spacing[8], gap: spacing[8] },
  timer:          { fontSize: typography.fontSize["4xl"], fontWeight: typography.fontWeight.bold, color: colors.rose[200], letterSpacing: 4 },
  countCircle:    { width: 180, height: 180, borderRadius: 90, borderWidth: 4, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" },
  countNumber:    { fontSize: 72, fontWeight: typography.fontWeight.bold, color: colors.white },
  countLabel:     { fontSize: typography.fontSize.base, color: colors.rose[200] },
  guidance:       { fontSize: typography.fontSize.base, color: colors.gray[300], textAlign: "center" },
  kickButton:     { backgroundColor: colors.rose[500], borderRadius: 20, paddingVertical: spacing[5], paddingHorizontal: spacing[12], ...shadows.lg },
  kickButtonText: { color: colors.white, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  endButton:      { paddingVertical: spacing[3], paddingHorizontal: spacing[8] },
  endButtonText:  { color: colors.gray[400], fontSize: typography.fontSize.base },
  alertBanner:    { backgroundColor: colors.urgency.emergency, borderRadius: 12, padding: spacing[4], position: "absolute", bottom: spacing[8], left: spacing[4], right: spacing[4] },
  alertText:      { color: colors.white, fontSize: typography.fontSize.sm, textAlign: "center" },
});
