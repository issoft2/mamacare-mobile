/**
 * mobile/app/symptoms/[id].tsx
 * Refined High-Depth Detail View
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ImageBackground, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSymptomLog } from "@safeborn/api";
import { colors, spacing, typography } from "@safeborn/ui";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

export default function SymptomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: log, isLoading } = useSymptomLog(id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.rose[500]} />
      </View>
    );
  }

  if (!log) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Entry not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Return to Journal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Map severity to colors for the badge
  const severityColor = 
    log.severity === 'severe' ? AUTH_UI.semanticSevere : 
    log.severity === 'moderate' ? AUTH_UI.semanticModerateAlt : AUTH_UI.semanticMild;

  return (
    <View style={styles.screen}>
      {/* <ImageBackground source={require("@/assets/welcome-bg.png")} style={styles.bgImage}> */}
        <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.bgOverlay}>
          
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* Header Area */}
            <TouchableOpacity onPress={() => router.back()} style={styles.inlineBack}>
              <Text style={styles.backArrow}>‹</Text>
              <Text style={styles.backLabel}>Back to Symptoms</Text>
            </TouchableOpacity>

            <View style={styles.glassCard}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.weekLabel}>Week {log.gestational_week}</Text>
                  <Text style={styles.dateLabel}>
                    {new Date(log.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: severityColor + '20', borderColor: severityColor }]}>
                  <Text style={[styles.severityText, { color: severityColor }]}>{log.severity}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Symptoms Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Symptoms logged</Text>
                <View style={styles.symptomWrap}>
                  {log.symptoms.map(s => (
                    <View key={s.id} style={styles.symptomTag}>
                      <View style={[styles.tagDot, { backgroundColor: severityColor }]} />
                      <Text style={styles.symptomLabel}>{s.symptom_label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Notes Section */}
              {log.free_text_notes && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your notes</Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{log.free_text_notes}</Text>
                  </View>
                </View>
              )}

              {/* Urgency Action - High Depth Card */}
              {log.urgency_tier && log.urgency_tier !== "none" && (
                <LinearGradient 
                  colors={[AUTH_UI.textWhite, AUTH_UI.semanticSevereBgThin]} 
                  style={styles.urgencyActionCard}
                >
                  <Text style={styles.urgencyLabel}>Care guidance</Text>
                  <Text style={styles.urgencyValue}>
                    This pattern is flagged as <Text style={{fontWeight: '800'}}>{log.urgency_tier.replace(/_/g, " ")}</Text>.
                  </Text>
                  <TouchableOpacity style={styles.actionLink} onPress={() => router.push("/tabs/chat")}>
                    <Text style={styles.actionLinkText}>Discuss this with safeborn ✦</Text>
                  </TouchableOpacity>
                </LinearGradient>
              )}
            </View>

          </ScrollView>
        </LinearGradient>
      {/* </ImageBackground> */}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_UI.warmBackground },
  bgImage: { flex: 1 },
  bgOverlay: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  inlineBack: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backArrow: { fontSize: 32, color: colors.rose[500], marginRight: 8, lineHeight: 32 },
  backLabel: { color: AUTH_UI.textBlack, fontWeight: "600", fontFamily: FONT_FRIENDLY_SANS },

  glassCard: {
    backgroundColor: AUTH_UI.overlayCard82,
    borderRadius: AUTH_UI.cardRadius,
    padding: 24,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    elevation: 10,
    shadowColor: colors.rose[500],
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  weekLabel: { fontSize: 30, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.4 },
  dateLabel: { fontSize: 14, color: AUTH_UI.textBlack, marginTop: 4, fontFamily: FONT_FRIENDLY_SANS },
  
  severityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  severityText: { fontSize: 12, fontWeight: "700", textTransform: 'uppercase' },
  
  divider: { height: 1, backgroundColor: AUTH_UI.lineFaint, marginVertical: 20 },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: AUTH_UI.textBlack, marginBottom: 16, fontFamily: FONT_FRIENDLY_SANS },
  
  symptomWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  symptomTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: AUTH_UI.textWhite, 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 16,
    elevation: 2,
    shadowOpacity: 0.05
  },
  tagDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  symptomLabel: { color: AUTH_UI.textBlack, fontWeight: "600", fontSize: 15, fontFamily: FONT_FRIENDLY_SANS },
  
  notesBox: { backgroundColor: AUTH_UI.overlayCard40, borderRadius: 16, padding: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: AUTH_UI.semanticNeutral },
  notesText: { fontSize: 15, color: AUTH_UI.textBlack, lineHeight: 22, fontFamily: FONT_FRIENDLY_SANS },
  
  urgencyActionCard: { marginTop: 10, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: AUTH_UI.shadowRoseSoft20 },
  urgencyLabel: { fontSize: 10, fontWeight: "800", color: AUTH_UI.linkBerry, letterSpacing: 1, marginBottom: 8 },
  urgencyValue: { fontSize: 15, color: AUTH_UI.textBlack, marginBottom: 12, fontFamily: FONT_FRIENDLY_SANS },
  actionLink: { alignSelf: 'flex-start' },
  actionLinkText: { color: AUTH_UI.linkBerry, fontWeight: "700", fontSize: 15, fontFamily: FONT_FRIENDLY_SANS },
  
  errorText: { color: AUTH_UI.textBlack, marginBottom: 20, fontFamily: FONT_FRIENDLY_SANS },
  backButton: { backgroundColor: colors.rose[500], paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  backButtonText: { color: AUTH_UI.textWhite, fontWeight: "700" }
});