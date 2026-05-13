/**
 * mobile/app/(tabs)/home.tsx
 * Home screen — gestational week summary, quick actions, upcoming appointment.
 */

import { useUser } from "@clerk/clerk-expo";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useProfile } from "@mamacare/api";
import { useSymptomPatterns } from "@mamacare/api";
import { colors, spacing, typography, shadows } from "@mamacare/ui";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const { data: patterns } = useSymptomPatterns();

  const firstName = user?.firstName ?? "there";
  const week = profile?.gestational_week ?? "–";
  const hasAlerts = patterns?.has_alerts ?? false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Hello, {firstName}</Text>
        <Text style={styles.weekText}>Week {week} of your pregnancy</Text>
      </View>

      {/* Pattern alert banner */}
      {hasAlerts && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => router.push("/tabs/symptoms")}
        >
          <Text style={styles.alertText}>
            ⚠️ Recurring symptoms detected — tap to review
          </Text>
        </TouchableOpacity>
      )}

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/tabs/symptoms")}
        >
          <Text style={styles.actionEmoji}>🩺</Text>
          <Text style={styles.actionLabel}>Log Symptoms</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/tabs/chat")}
        >
          <Text style={styles.actionEmoji}>💬</Text>
          <Text style={styles.actionLabel}>Ask MamaCare</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/tabs/tracker")}
        >
          <Text style={styles.actionEmoji}>👶</Text>
          <Text style={styles.actionLabel}>Count Kicks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/tabs/tracker")}
        >
          <Text style={styles.actionEmoji}>💧</Text>
          <Text style={styles.actionLabel}>Log Water</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  content: { padding: spacing[6], gap: spacing[6] },
  greeting: {
    backgroundColor: colors.navy[700],
    borderRadius: 16,
    padding: spacing[6],
  },
  greetingText: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  weekText: {
    fontSize: typography.fontSize.base,
    color: colors.rose[200],
    marginTop: spacing[1],
  },
  alertBanner: {
    backgroundColor: colors.urgency.notify_midwife,
    borderRadius: 12,
    padding: spacing[4],
  },
  alertText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  actionCard: {
    width: "47%",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing[5],
    alignItems: "center",
    gap: spacing[2],
    ...shadows.md,
  },
  actionEmoji: { fontSize: 32 },
  actionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    textAlign: "center",
  },
});
