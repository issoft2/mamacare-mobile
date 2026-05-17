/**
 * mobile/app/(tabs)/symptoms.tsx
 * Refined for High Depth & High Emotional Presence
 */

import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSymptomLogs, useSymptomPatterns } from "@mamacare/api";
import { colors, spacing, typography, shadows } from "@mamacare/ui";
import type { SymptomLogListItem } from "@mamacare/types";

function formatSymptomCodesForList(codes: string[]): string {
  return codes
    .map((c) =>
      c.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
    ).join(", ");
}

export default function SymptomsScreen() {
  const router = useRouter();
  const { data } = useSymptomLogs();
  const { data: patterns } = useSymptomPatterns();
  const logs = data?.items ?? [];

  function renderLog({ item }: { item: SymptomLogListItem }) {
    const urgencyColor = colors.urgency[item.urgency_tier ?? "none"] ?? colors.urgency.none;
    
    return (
      <TouchableOpacity
        style={styles.logCard}
        onPress={() => router.push(`/symptoms/${item.id}`)}
      >
        <View style={[styles.urgencyDot, { backgroundColor: urgencyColor, shadowColor: urgencyColor }]} />
        <View style={styles.logContent}>
          <View style={styles.logHeader}>
            <Text style={styles.logTitle}>Week {item.gestational_week}</Text>
            <Text style={styles.logSeverity}>{item.severity}</Text>
          </View>
          <Text style={styles.logSymptoms} numberOfLines={1}>
            {formatSymptomCodesForList(item.symptom_codes ?? [])}
          </Text>
          <Text style={styles.logDate}>
            {new Date(item.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screen}>
      <ImageBackground source={require("@/assets/images/mamacare-home-bg.png")} style={styles.bgImage}>
        <LinearGradient colors={["rgba(255,255,255,0.7)", "rgba(255,245,245,0.4)"]} style={styles.bgOverlay}>
          
          <FlatList
            data={logs}
            keyExtractor={(item) => item.id}
            renderItem={renderLog}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.headerArea}>
                <Text style={styles.screenTitle}>Symptom Journal</Text>
                
                {patterns?.has_alerts && (
                  <LinearGradient colors={["#FF9B9B", "#E8697C"]} style={styles.alertBanner}>
                    <Text style={styles.alertText}>
                      ✦ {patterns.patterns.filter((p) => p.alert).length} patterns detected. We should review these.
                    </Text>
                  </LinearGradient>
                )}

                <TouchableOpacity style={styles.logButton} onPress={() => router.push("/symptoms/new")}>
                  <LinearGradient colors={[colors.rose[400], "#FFA07A"]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.logButtonGradient}>
                    <Text style={styles.logButtonText}>+ Log New Symptoms</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            }
            ListEmptyComponent={<Text style={styles.emptyText}>Your journal is empty.</Text>}
          />
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgImage: { flex: 1 },
  bgOverlay: { flex: 1 },
  list: { padding: 20, paddingBottom: 100 },
  headerArea: { marginBottom: 20 },
  screenTitle: { fontSize: 28, fontWeight: "700", color: "#1A237E", marginBottom: 20, paddingTop: 40 },
  alertBanner: { borderRadius: 16, padding: 16, marginBottom: 20, elevation: 4 },
  alertText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
  logButton: { borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: "#E8697C", shadowOpacity: 0.3, shadowRadius: 10 },
  logButtonGradient: { paddingVertical: 16, alignItems: "center" },
  logButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  logCard: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    elevation: 3,
    shadowOpacity: 0.05,
  },
  urgencyDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12, shadowRadius: 4, shadowOpacity: 0.5 },
  logContent: { flex: 1 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  logTitle: { fontSize: 16, fontWeight: "700", color: "#1A237E" },
  logSeverity: { fontSize: 12, color: "#E8697C", fontWeight: "600", textTransform: 'uppercase' },
  logSymptoms: { fontSize: 14, color: "#757575" },
  logDate: { fontSize: 12, color: "#9E9E9E", marginTop: 4 },
  chevron: { fontSize: 24, color: "#BDBDBD", marginLeft: 10 },
  emptyText: { textAlign: "center", color: "#9E9E9E", marginTop: 40 },
});