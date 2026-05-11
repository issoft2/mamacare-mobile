/**
 * mobile/app/profile/care-team.tsx
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCareTeam } from "@mamacare/api";
import { colors, spacing, typography, shadows } from "@mamacare/ui";
import type { CareTeamMember } from "@mamacare/types";

export default function CareTeamScreen() {
  const router = useRouter();
  const { data: careTeam, isLoading } = useCareTeam();

  function renderMember({ item }: { item: CareTeamMember }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
          </View>
          {item.is_primary && (
            <View style={styles.primaryTag}>
              <Text style={styles.primaryText}>PRIMARY</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{item.full_name}</Text>
        {item.practice_name && <Text style={styles.detail}>{item.practice_name}</Text>}
        {item.email && <Text style={styles.detail}>✉️  {item.email}</Text>}
        {item.phone && <Text style={styles.detail}>📞  {item.phone}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={careTeam ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.title}>Your Care Team</Text>
        }
        ListEmptyComponent={
          isLoading
            ? <ActivityIndicator color={colors.rose[500]} style={{ marginTop: spacing[8] }} />
            : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No care team members added yet.</Text>
                <Text style={styles.emptySubtext}>
                  Add your midwife, GP, or obstetrician so MamaCare AI can contact them on your behalf.
                </Text>
              </View>
            )
        }
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/profile/care-team/new" as any)}
      >
        <Text style={styles.addButtonText}>+ Add Care Team Member</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.gray[50] },
  list:       { padding: spacing[4], gap: spacing[3], paddingBottom: spacing[24] },
  title:      { fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.navy[700], marginBottom: spacing[4] },
  card:       { backgroundColor: colors.white, borderRadius: 16, padding: spacing[5], gap: spacing[2], ...shadows.sm },
  cardHeader: { flexDirection: "row", gap: spacing[2] },
  roleTag:    { backgroundColor: colors.navy[100], borderRadius: 6, paddingHorizontal: spacing[2], paddingVertical: 2 },
  roleText:   { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.navy[700] },
  primaryTag: { backgroundColor: colors.rose[100], borderRadius: 6, paddingHorizontal: spacing[2], paddingVertical: 2 },
  primaryText:{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.rose[600] },
  name:       { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.gray[900] },
  detail:     { fontSize: typography.fontSize.sm, color: colors.gray[500] },
  emptyContainer: { alignItems: "center", paddingTop: spacing[8], gap: spacing[3] },
  emptyText:  { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, color: colors.gray[600] },
  emptySubtext: { fontSize: typography.fontSize.sm, color: colors.gray[400], textAlign: "center", paddingHorizontal: spacing[6] },
  addButton:  { position: "absolute", bottom: spacing[6], left: spacing[4], right: spacing[4], backgroundColor: colors.rose[500], borderRadius: 12, paddingVertical: spacing[4], alignItems: "center" },
  addButtonText: { color: colors.white, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.base },
});
