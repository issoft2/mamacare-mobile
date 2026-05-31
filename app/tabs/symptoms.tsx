/**
 * mobile/app/(tabs)/symptoms.tsx
 * Refined for High Depth & High Emotional Presence
 */

import { useRouter } from "expo-router";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSymptomLogs, useSymptomPatterns } from "@mumcare/api";
import { colors } from "@mumcare/ui";
import type { SymptomLogListItem } from "@mumcare/types";
import { ctaGradientColors } from "../../components/styles/ctaButton";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

function formatSymptomCodesForList(codes: string[]): string {
  return codes
    .map((c) =>
      c.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
    ).join(", ");
}

export default function SymptomsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 980;
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
          <Text style={styles.logSymptoms} numberOfLines={2}>
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
        <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.bgOverlay}>
          
          <FlatList
            data={logs}
            keyExtractor={(item) => item.id}
            renderItem={renderLog}
            contentContainerStyle={[styles.list, isWide && styles.listWide]}
            ListHeaderComponent={
              <View style={styles.headerArea}>
                <Text style={styles.screenTitle}>Symptom journal</Text>
                
                {patterns?.has_alerts && (
                  <LinearGradient colors={[AUTH_UI.semanticSevere, colors.rose[500]]} style={styles.alertBanner}>
                    <Text style={styles.alertText}>
                      {patterns.patterns.filter((p) => p.alert).length} patterns detected. Please review these with your care team.
                    </Text>
                  </LinearGradient>
                )}

                <TouchableOpacity style={styles.logButton} onPress={() => router.push("/symptoms/new")}>
                  <LinearGradient colors={ctaGradientColors} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.logButtonGradient}>
                    <Text style={styles.logButtonText}>Log new symptoms</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            }
            ListEmptyComponent={<Text style={styles.emptyText}>Your journal is empty.</Text>}
          />
        </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_UI.cream },
  bgOverlay: { flex: 1 },
  list: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  listWide: { width: "100%", maxWidth: 980, alignSelf: "center", padding: 32 },
  headerArea: { marginBottom: 20 },
  screenTitle: { fontSize: 30, fontWeight: "800", color: AUTH_UI.textHeading, marginBottom: 20, paddingTop: 16, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.6 },
  alertBanner: { borderRadius: AUTH_UI.inputRadius, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20, borderWidth: 1, borderColor: AUTH_UI.semanticSevereBorder22 },
  alertText: { color: AUTH_UI.textWhite, fontWeight: "700", fontSize: 15, lineHeight: 22, fontFamily: FONT_FRIENDLY_SANS },
  logButton: { borderRadius: 20, overflow: "hidden", elevation: 8, shadowColor: colors.rose[500], shadowOpacity: 0.3, shadowRadius: 10 },
  logButtonGradient: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  logButtonText: { color: AUTH_UI.textWhite, fontWeight: "800", fontSize: 16, fontFamily: FONT_FRIENDLY_SANS },
  logCard: {
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: AUTH_UI.inputRadius,
    paddingHorizontal: AUTH_UI.fieldPaddingX,
    paddingVertical: AUTH_UI.fieldPaddingY,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    elevation: 2,
    shadowOpacity: 0.04,
  },
  urgencyDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12, shadowRadius: 4, shadowOpacity: 0.5 },
  logContent: { flex: 1 },
  logHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  logTitle: { fontSize: 16, fontWeight: "700", color: AUTH_UI.textHeading, fontFamily: FONT_FRIENDLY_SANS },
  logSeverity: { fontSize: 13, color: AUTH_UI.textBlack, fontWeight: "600", textTransform: "capitalize", fontFamily: FONT_FRIENDLY_SANS },
  logSymptoms: { fontSize: 15, color: AUTH_UI.textBlack, lineHeight: 22, fontFamily: FONT_FRIENDLY_SANS },
  logDate: { fontSize: 13, color: AUTH_UI.textBlack, marginTop: 6, fontFamily: FONT_FRIENDLY_SANS },
  chevron: { fontSize: 24, color: colors.rose[300], marginLeft: 10 },
  emptyText: { textAlign: "center", color: AUTH_UI.textBlack, marginTop: 40, fontSize: 16, fontFamily: FONT_FRIENDLY_SANS },
});
