/**
 * mobile/app/profile/care-team.tsx
 * Refined Care Team - Professional Contact Cards
 */

import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useCareTeam } from "@mumcare/api";
import type { CareTeamMember } from "@mumcare/types";
import { ctaButtonStyles, ctaGradientColors } from "@/components/styles/ctaButton";

export default function CareTeamScreen() {
  const router = useRouter();
  const { data: careTeam, isLoading } = useCareTeam();

  const handleCall = (phone?: string | null) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email?: string | null) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  const members = careTeam ?? [];

  const roleLabel = (role: CareTeamMember["role"]) => {
    if (role === "gp") return "GP";
    if (role === "obstetrician") return "OBSTETRICIAN";
    if (role === "midwife") return "MIDWIFE";
    return "SPECIALIST";
  };

  const initialsFromName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "CT";
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return `${first}${second}`.toUpperCase();
  };

  function renderMember({ item }: { item: CareTeamMember }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initialsFromName(item.full_name)}</Text>
            </View>
            <View style={styles.roleTag}>
              <Text style={styles.roleText}>{roleLabel(item.role)}</Text>
            </View>
            {item.is_primary && (
              <LinearGradient
                colors={ctaGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryTag}
              >
                <Text style={styles.primaryText}>PRIMARY</Text>
              </LinearGradient>
            )}
          </View>
          <Ionicons name="shield-checkmark-outline" size={19} color="#97A2BC" />
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{item.full_name}</Text>
          {item.practice_name && (
            <View style={styles.practiceRow}>
              <Ionicons name="business-outline" size={14} color="#7A86A0" />
              <Text style={styles.practiceText}>{item.practice_name}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, !item.phone && styles.disabledBtn]}
            onPress={() => handleCall(item.phone)}
            disabled={!item.phone}
            activeOpacity={0.86}
          >
            <Ionicons name="call" size={17} color={item.phone ? "#1A237E" : "#BDBDBD"} />
            <Text style={[styles.actionBtnText, !item.phone && styles.disabledText]}>Call</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={[styles.actionBtn, !item.email && styles.disabledBtn]}
            onPress={() => handleEmail(item.email)}
            disabled={!item.email}
            activeOpacity={0.86}
          >
            <Ionicons name="mail" size={17} color={item.email ? "#1A237E" : "#BDBDBD"} />
            <Text style={[styles.actionBtnText, !item.email && styles.disabledText]}>Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={["#FFF8F4", "#F8FAFF"]} style={styles.bgOverlay}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.86}>
            <Ionicons name="chevron-back" size={24} color="#1A237E" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>CARE CIRCLE</Text>
            <Text style={styles.headerTitle}>Your Care Team</Text>
            <Text style={styles.headerSubtext}>Keep your trusted contacts close for calmer, coordinated support.</Text>
          </View>
        </View>

        <FlatList
          data={members}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMember}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator color="#E8697C" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="heart-outline" size={36} color="#6B7BB8" />
                </View>
                <Text style={styles.emptyText}>No care team added yet</Text>
                <Text style={styles.emptySubtext}>
                  Add your midwife, GP, or obstetrician so MumCare can keep your care journey in sync.
                </Text>
              </View>
            )
          }
        />

        <TouchableOpacity
          style={[ctaButtonStyles.button, styles.addBtn]}
          onPress={() => router.push("/profile/care-team/new" as any)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={ctaGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={ctaButtonStyles.gradient}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFF" />
            <Text style={ctaButtonStyles.text}>Add Member</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgOverlay: { flex: 1 },
  headerNav: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 58,
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#1A2E4A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  headerCopy: { flex: 1 },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#E8697C",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1A237E" },
  headerSubtext: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6E7890",
    marginTop: 6,
    paddingRight: 8,
  },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    ...Platform.select({
      ios: {
        shadowColor: "#E8697C",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: { elevation: 3 },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F4F6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "800", color: "#5A6AA6" },
  roleTag: {
    backgroundColor: "#F0F2F8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6B7BB8",
    letterSpacing: 0.6,
  },
  primaryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  primaryText: { fontSize: 10, fontWeight: "800", color: "#FFF", letterSpacing: 0.4 },
  body: { marginBottom: 14 },
  name: { fontSize: 18, fontWeight: "700", color: "#1A237E", marginBottom: 5 },
  practiceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  practiceText: { fontSize: 14, color: "#667085" },
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F2F4FA",
    paddingTop: 13,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 34,
  },
  actionBtnText: { fontWeight: "700", color: "#1A237E", fontSize: 14 },
  actionDivider: { width: 1, height: 20, backgroundColor: "#EEF1F7" },
  disabledBtn: { opacity: 0.45 },
  disabledText: { color: "#BDBDBD" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 44,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#6B7BB8",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
    }),
  },
  emptyText: { fontSize: 18, fontWeight: "700", color: "#1A237E", marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: "#6E7890", textAlign: "center", lineHeight: 21 },
  addBtn: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 28,
  },
});
