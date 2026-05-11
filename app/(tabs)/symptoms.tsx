/**
 * mobile/app/(tabs)/symptoms.tsx
 * Symptom log list with pattern alert banner.
 */

import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSymptomLogs, useSymptomPatterns } from "@mamacare/api";
import { colors, spacing, typography, shadows } from "@mamacare/ui";
import type { SymptomLogListItem } from "@mamacare/types";

/** Renders list-row codes (e.g. NAUSEA_VOMITING) in a short readable form. */
function formatSymptomCodesForList(codes: string[]): string {
  return codes
    .map((c) =>
      c
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    )
    .join(", ");
}

export default function SymptomsScreen() {
  const router = useRouter();
  const { data } = useSymptomLogs();
  const { data: patterns } = useSymptomPatterns();
  const logs = data?.items ?? [];

  function renderLog({ item }: { item: SymptomLogListItem }) {
    const urgencyColor =
      colors.urgency[item.urgency_tier ?? "none"] ?? colors.urgency.none;
    return (
      <TouchableOpacity
        style={styles.logCard}
        onPress={() => router.push(`/symptoms/${item.id}`)}
      >
        <View style={[styles.urgencyDot, { backgroundColor: urgencyColor }]} />
        <View style={styles.logContent}>
          <Text style={styles.logTitle}>
            Week {item.gestational_week} · {item.severity}
          </Text>
          <Text style={styles.logSymptoms}>
            {formatSymptomCodesForList(item.symptom_codes ?? [])}
          </Text>
          <Text style={styles.logDate}>
            {new Date(item.created_at).toLocaleDateString("en-GB")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {patterns?.has_alerts && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>
            ⚠️ {patterns.patterns.filter((p) => p.alert).length} recurring symptom(s) detected
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.logButton}
        onPress={() => router.push("/symptoms/new")}
      >
        <Text style={styles.logButtonText}>+ Log New Symptoms</Text>
      </TouchableOpacity>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderLog}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No symptoms logged yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  alertBanner: {
    backgroundColor: colors.urgency.notify_midwife,
    padding: spacing[4],
  },
  alertText: { color: colors.white, fontSize: typography.fontSize.sm },
  logButton: {
    margin: spacing[4],
    backgroundColor: colors.rose[500],
    borderRadius: 12,
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  logButtonText: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.base,
  },
  list: { paddingHorizontal: spacing[4], gap: spacing[3] },
  logCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing[4],
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    ...shadows.sm,
  },
  urgencyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  logContent: { flex: 1 },
  logTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
    textTransform: "capitalize",
  },
  logSymptoms: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginTop: spacing[1],
  },
  logDate: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    marginTop: spacing[1],
  },
  emptyText: {
    textAlign: "center",
    color: colors.gray[400],
    marginTop: spacing[12],
  },
});
