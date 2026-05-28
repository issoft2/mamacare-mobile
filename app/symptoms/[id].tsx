/**
 * mobile/app/symptoms/[id].tsx
 * Refined High-Depth Detail View
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ImageBackground, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSymptomLog } from "@mumcare/api";
import { colors, spacing, typography } from "@mumcare/ui";

export default function SymptomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: log, isLoading } = useSymptomLog(id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E8697C" />
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
    log.severity === 'severe' ? '#E8697C' : 
    log.severity === 'moderate' ? '#F4B183' : '#88B0A8';

  return (
    <View style={styles.screen}>
      {/* <ImageBackground source={require("@/assets/welcome-bg.png")} style={styles.bgImage}> */}
        <LinearGradient colors={["rgba(255,251,247,0.92)", "rgba(255,244,239,0.68)"]} style={styles.bgOverlay}>
          
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
                <Text style={styles.sectionTitle}>SYMPTOMS LOGGED</Text>
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
                  <Text style={styles.sectionTitle}>YOUR NOTES</Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{log.free_text_notes}</Text>
                  </View>
                </View>
              )}

              {/* Urgency Action - High Depth Card */}
              {log.urgency_tier && log.urgency_tier !== "none" && (
                <LinearGradient 
                  colors={["#FFF", "rgba(232,105,124,0.05)"]} 
                  style={styles.urgencyActionCard}
                >
                  <Text style={styles.urgencyLabel}>CARE GUIDANCE</Text>
                  <Text style={styles.urgencyValue}>
                    This pattern is flagged as <Text style={{fontWeight: '800'}}>{log.urgency_tier.replace(/_/g, " ")}</Text>.
                  </Text>
                  <TouchableOpacity style={styles.actionLink} onPress={() => router.push("/tabs/chat")}>
                    <Text style={styles.actionLinkText}>Discuss this with mumcare ✦</Text>
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
  screen: { flex: 1 },
  bgImage: { flex: 1 },
  bgOverlay: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  inlineBack: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backArrow: { fontSize: 32, color: "#C97B6E", marginRight: 8, lineHeight: 32 },
  backLabel: { color: "#757575", fontWeight: "600" },

  glassCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(140,90,82,0.14)",
    elevation: 10,
    shadowColor: "#C97B6E",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  weekLabel: { fontSize: 24, fontWeight: "800", color: "#4D3B39" },
  dateLabel: { fontSize: 14, color: "#9E9E9E", marginTop: 4 },
  
  severityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  severityText: { fontSize: 12, fontWeight: "700", textTransform: 'uppercase' },
  
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.05)", marginVertical: 20 },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#8E5A54", letterSpacing: 1.2, marginBottom: 16 },
  
  symptomWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  symptomTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 16,
    elevation: 2,
    shadowOpacity: 0.05
  },
  tagDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  symptomLabel: { color: "#424242", fontWeight: "600", fontSize: 15 },
  
  notesBox: { backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 16, padding: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#BDBDBD' },
  notesText: { fontSize: 15, color: "#616161", lineHeight: 22 },
  
  urgencyActionCard: { marginTop: 10, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: "rgba(201,123,110,0.2)" },
  urgencyLabel: { fontSize: 10, fontWeight: "800", color: "#8E5A54", letterSpacing: 1, marginBottom: 8 },
  urgencyValue: { fontSize: 15, color: "#424242", marginBottom: 12 },
  actionLink: { alignSelf: 'flex-start' },
  actionLinkText: { color: "#8E5A54", fontWeight: "700", fontSize: 15 },
  
  errorText: { color: "#9E9E9E", marginBottom: 20 },
  backButton: { backgroundColor: "#C97B6E", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  backButtonText: { color: "#FFF", fontWeight: "700" }
});