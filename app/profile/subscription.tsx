/**
 * mobile/app/profile/subscription.tsx
 */

import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSubscription, useUpgradePlan, useUsage } from "@mamacare/api";
import { colors, spacing, typography, shadows } from "@mamacare/ui";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "£0/month",
    features: ["AI chat (10 messages/day)", "Symptom logging", "Basic trackers"],
  },
  {
    id: "standard",
    name: "Standard",
    price: "£9.99/month",
    features: ["Unlimited AI chat", "Pattern detection", "Care team messaging (5/month)", "Pre-appointment summaries"],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "£19.99/month",
    features: ["Everything in Standard", "Unlimited care team messaging", "Agentic triage pipeline", "Priority support"],
  },
];

export default function SubscriptionScreen() {
  const { data: subscription, isLoading } = useSubscription();
  const { data: usage } = useUsage();
  const upgradePlan = useUpgradePlan();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.rose[500]} />
      </View>
    );
  }

  const currentPlan = subscription?.plan ?? "free";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Subscription</Text>

      {/* Current plan */}
      <View style={styles.currentPlan}>
        <Text style={styles.currentPlanLabel}>Current Plan</Text>
        <Text style={styles.currentPlanName}>{currentPlan.toUpperCase()}</Text>
        <Text style={styles.currentPlanStatus}>
          Status: {subscription?.plan_status ?? "active"}
        </Text>
      </View>

      {/* Usage summary */}
      {usage && (
        <View style={styles.usageCard}>
          <Text style={styles.usageTitle}>Usage This Month</Text>
          <Text style={styles.usageItem}>
            Care team members: {usage.usage.care_team_members.current}
            {usage.usage.care_team_members.limit ? ` / ${usage.usage.care_team_members.limit}` : " (unlimited)"}
          </Text>
        </View>
      )}

      {/* Plan cards */}
      <Text style={styles.sectionTitle}>Available Plans</Text>
      {PLANS.map((plan) => {
        const isCurrent = plan.id === currentPlan;
        return (
          <View key={plan.id} style={[styles.planCard, plan.popular && styles.planCardPopular]}>
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>{plan.price}</Text>
            {plan.features.map((f) => (
              <Text key={f} style={styles.feature}>✓  {f}</Text>
            ))}
            {isCurrent ? (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current Plan</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.upgradeButton, upgradePlan.isPending && styles.buttonDisabled]}
                onPress={() => upgradePlan.mutate(plan.id as any)}
                disabled={upgradePlan.isPending}
              >
                <Text style={styles.upgradeButtonText}>
                  {plan.id === "free" ? "Downgrade" : "Upgrade"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.gray[50] },
  content:          { padding: spacing[4], gap: spacing[4], maxWidth: 480, alignSelf: "center", width: "100%", paddingBottom: spacing[12] },
  center:           { flex: 1, alignItems: "center", justifyContent: "center" },
  title:            { fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.navy[700] },
  currentPlan:      { backgroundColor: colors.navy[700], borderRadius: 16, padding: spacing[6], alignItems: "center", gap: spacing[1] },
  currentPlanLabel: { fontSize: typography.fontSize.sm, color: colors.rose[200] },
  currentPlanName:  { fontSize: typography.fontSize["3xl"], fontWeight: typography.fontWeight.bold, color: colors.white },
  currentPlanStatus:{ fontSize: typography.fontSize.sm, color: colors.gray[300], textTransform: "capitalize" },
  usageCard:        { backgroundColor: colors.white, borderRadius: 12, padding: spacing[4], gap: spacing[2], ...shadows.sm },
  usageTitle:       { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.gray[800] },
  usageItem:        { fontSize: typography.fontSize.sm, color: colors.gray[600] },
  sectionTitle:     { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.gray[800] },
  planCard:         { backgroundColor: colors.white, borderRadius: 16, padding: spacing[5], gap: spacing[3], ...shadows.sm },
  planCardPopular:  { borderWidth: 2, borderColor: colors.rose[500] },
  popularBadge:     { backgroundColor: colors.rose[500], borderRadius: 6, paddingHorizontal: spacing[3], paddingVertical: spacing[1], alignSelf: "flex-start" },
  popularText:      { color: colors.white, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  planName:         { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.navy[700] },
  planPrice:        { fontSize: typography.fontSize.lg, color: colors.gray[600] },
  feature:          { fontSize: typography.fontSize.sm, color: colors.gray[600] },
  currentBadge:     { backgroundColor: colors.gray[100], borderRadius: 10, paddingVertical: spacing[3], alignItems: "center" },
  currentBadgeText: { color: colors.gray[500], fontWeight: typography.fontWeight.medium },
  upgradeButton:    { backgroundColor: colors.rose[500], borderRadius: 10, paddingVertical: spacing[3], alignItems: "center" },
  buttonDisabled:   { opacity: 0.6 },
  upgradeButtonText:{ color: colors.white, fontWeight: typography.fontWeight.semibold },
});
