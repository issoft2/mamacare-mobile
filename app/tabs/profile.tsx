/**
 * mobile/app/(tabs)/profile.tsx
 * Profile screen — personal info, care team, subscription.
 */

import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useProfile, useSubscription } from "@mamacare/api";
import { colors, spacing, typography, shadows } from "@mamacare/ui";
import type { Profile } from "@mamacare/types";

function countCompletedMedicalFields(profile: Profile | undefined) {
  if (!profile) return 0;
  let count = 0;
  if (profile.blood_type) count++;
  if (profile.lmp_date) count++;
  if (profile.gravida != null) count++;
  if (profile.parity != null) count++;
  if (profile.known_conditions?.length) count++;
  if (profile.allergies?.length) count++;
  if (profile.nhs_number) count++;
  if (profile.nhia_number) count++;
  return count;
}

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: subscription } = useSubscription();
  const medicalCompleted = countCompletedMedicalFields(profile);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User info */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.first_name?.[0] ?? user?.firstName?.[0] ?? "M"}
          </Text>
        </View>
        <Text style={styles.name}>
          {profile?.first_name} {profile?.last_name}
        </Text>
        <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
        <View style={styles.planBadge}>
          <Text style={styles.planText}>
            {subscription?.plan?.toUpperCase() ?? "FREE"} PLAN
          </Text>
        </View>
      </View>

      {/* Menu items */}
      {[
        { label: "Edit Profile", path: "/profile/edit" },
        {
          label: "Medical Details",
          path: "/profile/medical",
          meta: `${medicalCompleted} of 8 completed`,
        },
        { label: "Care Team", path: "/profile/care-team" },
        { label: "Appointments", path: "/profile/appointments" },
        { label: "Notifications", path: "/profile/notifications" },
        { label: "Data & Privacy", path: "/profile/privacy" },
        { label: "Subscription", path: "/profile/subscription" },
      ].map((item) => (
        <TouchableOpacity
          key={item.path}
          style={styles.menuItem}
          onPress={() => router.push(item.path as any)}
        >
          <View style={styles.menuText}>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {"meta" in item && item.meta ? (
              <Text style={styles.menuMeta}>{item.meta}</Text>
            ) : null}
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      ))}

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutButton} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  content: { padding: spacing[4], gap: spacing[3] },
  header: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing[6],
    alignItems: "center",
    ...shadows.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.rose[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  avatarText: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.rose[600],
  },
  name: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  email: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing[1],
  },
  planBadge: {
    backgroundColor: colors.rose[100],
    borderRadius: 20,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    marginTop: spacing[3],
  },
  planText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.rose[600],
    letterSpacing: 0.5,
  },
  menuItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing[4],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...shadows.sm,
  },
  menuLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[800],
  },
  menuText: {
    flex: 1,
  },
  menuMeta: {
    color: colors.gray[500],
    fontSize: typography.fontSize.xs,
    marginTop: spacing[1],
  },
  menuArrow: {
    fontSize: typography.fontSize.xl,
    color: colors.gray[400],
  },
  signOutButton: {
    marginTop: spacing[4],
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  signOutText: {
    color: colors.error,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
});
