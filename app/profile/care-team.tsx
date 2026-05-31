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
import { colors } from "@mumcare/ui";
import type { CareTeamMember } from "@mumcare/types";
import { ctaButtonStyles, ctaGradientColors } from "@/components/styles/ctaButton";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

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
    if (role === "obstetrician") return "Obstetrician";
    if (role === "midwife") return "Midwife";
    return "Specialist";
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
                <Text style={styles.primaryText}>Primary</Text>
              </LinearGradient>
            )}
          </View>
          <Ionicons name="shield-checkmark-outline" size={19} color={AUTH_UI.semanticBlueSlate} />
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{item.full_name}</Text>
          {item.practice_name && (
            <View style={styles.practiceRow}>
              <Ionicons name="business-outline" size={14} color={AUTH_UI.mutedText} />
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
            <Ionicons name="call" size={17} color={item.phone ? AUTH_UI.linkBerry : AUTH_UI.semanticNeutral} />
            <Text style={[styles.actionBtnText, !item.phone && styles.disabledText]}>Call</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={[styles.actionBtn, !item.email && styles.disabledBtn]}
            onPress={() => handleEmail(item.email)}
            disabled={!item.email}
            activeOpacity={0.86}
          >
            <Ionicons name="mail" size={17} color={item.email ? AUTH_UI.linkBerry : AUTH_UI.semanticNeutral} />
            <Text style={[styles.actionBtnText, !item.email && styles.disabledText]}>Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.bgOverlay}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.86}>
            <Ionicons name="chevron-back" size={24} color={AUTH_UI.linkBerry} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>Care circle</Text>
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
              <ActivityIndicator color={colors.rose[500]} style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="heart-outline" size={36} color={AUTH_UI.semanticBlue} />
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
            <Ionicons name="add-circle-outline" size={18} color={AUTH_UI.textWhite} />
            <Text style={ctaButtonStyles.text}>Add member</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_UI.warmBackground },
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
    backgroundColor: AUTH_UI.textWhite,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    ...Platform.select({
      ios: {
        shadowColor: AUTH_UI.shadowBrown,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  headerCopy: { flex: 1 },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: AUTH_UI.linkBerry,
    marginBottom: 4,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  headerTitle: { fontSize: 30, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.5 },
  headerSubtext: {
    fontSize: 14,
    lineHeight: 20,
    color: AUTH_UI.textBlack,
    marginTop: 6,
    paddingRight: 8,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
  card: {
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: AUTH_UI.cardRadius,
    padding: 18,
    marginBottom: 14,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    ...Platform.select({
      ios: {
        shadowColor: colors.rose[500],
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
    backgroundColor: AUTH_UI.semanticBluePale,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "800", color: AUTH_UI.semanticBlueMuted },
  roleTag: {
    backgroundColor: colors.rose[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AUTH_UI.inputRadius,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
  },
  roleText: {
    fontSize: 12,
    fontWeight: "700",
    color: AUTH_UI.linkBerry,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  primaryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: AUTH_UI.inputRadius },
  primaryText: { fontSize: 12, fontWeight: "700", color: AUTH_UI.textWhite, fontFamily: FONT_FRIENDLY_SANS },
  body: { marginBottom: 14 },
  name: { fontSize: 19, fontWeight: "700", color: AUTH_UI.textHeading, marginBottom: 5, fontFamily: FONT_FRIENDLY_SANS },
  practiceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  practiceText: { fontSize: 14, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  actionRow: {
    flexDirection: "row",
    borderTopWidth: AUTH_UI.borderWidth,
    borderTopColor: colors.rose[100],
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
  actionBtnText: { fontWeight: "700", color: AUTH_UI.linkBerry, fontSize: 14, fontFamily: FONT_FRIENDLY_SANS },
  actionDivider: { width: 1, height: 20, backgroundColor: AUTH_UI.lineCool },
  disabledBtn: { opacity: 0.45 },
  disabledText: { color: AUTH_UI.semanticNeutral },
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
    backgroundColor: AUTH_UI.textWhite,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: AUTH_UI.semanticBlue,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
    }),
  },
  emptyText: { fontSize: 22, fontWeight: "800", color: AUTH_UI.textHeading, marginBottom: 8, fontFamily: FONT_WARM_SERIF },
  emptySubtext: { fontSize: 14, color: AUTH_UI.textBlack, textAlign: "center", lineHeight: 21, fontFamily: FONT_FRIENDLY_SANS },
  addBtn: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 28,
  },
});
