/**
 * mobile/app/symptoms/[id].tsx
 * Symptom log detail view.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSymptomLog } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";

export default function SymptomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: log, isLoading } = useSymptomLog(id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  if (!log) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Symptom log not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Week {log.gestational_week} · {log.severity}</Text>
      <Text style={styles.date}>
        {new Date(log.created_at).toLocaleDateString("en-GB", {
          weekday: "long", year: "numeric", month: "long", day: "numeric"
        })}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Symptoms</Text>
        {log.symptoms.map(s => (
          <Text key={s.id} style={styles.symptom}>• {s.symptom_label}</Text>
        ))}
      </View>

      {log.free_text_notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notes}>{log.free_text_notes}</Text>
        </View>
      )}

      {log.urgency_tier && log.urgency_tier !== "none" && (
        <View style={styles.urgencyBanner}>
          <Text style={styles.urgencyText}>
            Urgency: {log.urgency_tier.replace(/_/g, " ")}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.white },
  content: {
    padding: spacing[6],
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[4],
  },
  loading: { color: colors.gray[500], fontSize: typography.fontSize.base },
  back:    { color: colors.rose[500], fontSize: typography.fontSize.base },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[700],
    textTransform: "capitalize",
  },
  date: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[400],
    marginTop: spacing[1],
    marginBottom: spacing[6],
  },
  section:      { marginBottom: spacing[6] },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing[3],
  },
  symptom: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    marginBottom: spacing[2],
  },
  notes: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    lineHeight: 24,
  },
  urgencyBanner: {
    backgroundColor: colors.rose[100],
    borderRadius: 12,
    padding: spacing[4],
  },
  urgencyText: {
    color: colors.rose[600],
    fontWeight: typography.fontWeight.semibold,
    textTransform: "capitalize",
  },
});
