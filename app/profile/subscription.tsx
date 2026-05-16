/**
 * mobile/app/profile/subscription.tsx
 *
 * Subscription / plan management screen.
 *
 * Design philosophy:
 *  - Calm and informative, NOT salesy. No pushy "MOST POPULAR" badges
 *    or pressure tactics. Just clear information and choice.
 *  - Region-aware pricing: detects user's locale and shows NGN, GBP,
 *    or USD accordingly. The actual currency Clerk charges in is
 *    configured on the Clerk side; this display helps the user
 *    understand cost in their familiar currency.
 *  - Soft cream background consistent with the rest of the care screens.
 *  - Inline status banners (no native alerts) except for destructive
 *    actions like cancellation.
 */

import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Localization from "expo-localization";

import { useSubscription, useUpgradePlan, useUsage } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";
import { getErrorMessage } from "@/lib/errors";

// ── Types ────────────────────────────────────────────────────────────────────

type PlanId = "free" | "standard" | "premium";
type Region = "NG" | "UK" | "OTHER";
type Currency = "NGN" | "GBP" | "USD";

interface PlanFeature {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

interface Plan {
  id: PlanId;
  name: string;
  shortDescription: string;
  features: PlanFeature[];
  recommended?: boolean;
}

interface PriceInfo {
  amount: string;
  currency: Currency;
  symbol: string;
  period: string;
}

// ── Configuration ────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    shortDescription: "Get started at no cost",
    features: [
      { icon: "chatbubble-ellipses-outline", label: "AI chat — 10 messages a day" },
      { icon: "pulse-outline", label: "Symptom logging" },
      { icon: "fitness-outline", label: "Basic trackers" },
    ],
  },
  {
    id: "standard",
    name: "Standard",
    shortDescription: "For everyday support",
    recommended: true,
    features: [
      { icon: "chatbubble-ellipses-outline", label: "Unlimited AI chat" },
      { icon: "analytics-outline", label: "Pattern detection across your logs" },
      { icon: "people-outline", label: "Care team messaging — 5 a month" },
      { icon: "document-text-outline", label: "Pre-appointment summaries" },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    shortDescription: "For comprehensive care",
    features: [
      { icon: "checkmark-circle-outline", label: "Everything in Standard" },
      { icon: "people-outline", label: "Unlimited care team messaging" },
      { icon: "alert-circle-outline", label: "AI triage for urgent concerns" },
      { icon: "headset-outline", label: "Priority support" },
    ],
  },
];

// Pricing per region. Update these when your billing setup confirms NGN amounts.
const PRICING: Record<Region, Record<PlanId, PriceInfo>> = {
  NG: {
    free: { amount: "0", currency: "NGN", symbol: "₦", period: "" },
    standard: { amount: "4,000", currency: "NGN", symbol: "₦", period: "/ month" },
    premium: { amount: "8,000", currency: "NGN", symbol: "₦", period: "/ month" },
  },
  UK: {
    free: { amount: "0", currency: "GBP", symbol: "£", period: "" },
    standard: { amount: "9.99", currency: "GBP", symbol: "£", period: "/ month" },
    premium: { amount: "19.99", currency: "GBP", symbol: "£", period: "/ month" },
  },
  OTHER: {
    free: { amount: "0", currency: "USD", symbol: "$", period: "" },
    standard: { amount: "12.99", currency: "USD", symbol: "$", period: "/ month" },
    premium: { amount: "24.99", currency: "USD", symbol: "$", period: "/ month" },
  },
};

const CREAM = "#FFF8F4";

// ── Helpers ──────────────────────────────────────────────────────────────────

function detectRegion(): Region {
  try {
    const locales = Localization.getLocales();
    const code =
      locales[0]?.regionCode || (Localization as any).region || "";
    if (code === "NG") return "NG";
    if (code === "GB") return "UK";
    return "OTHER";
  } catch {
    return "OTHER";
  }
}

function formatPlanRank(planId: PlanId): number {
  return { free: 0, standard: 1, premium: 2 }[planId];
}

function getActionLabel(
  currentPlan: PlanId,
  targetPlan: PlanId
): "current" | "upgrade" | "downgrade" {
  if (currentPlan === targetPlan) return "current";
  return formatPlanRank(targetPlan) > formatPlanRank(currentPlan)
    ? "upgrade"
    : "downgrade";
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SubscriptionScreen() {
  const router = useRouter();
  const { data: subscription, isLoading } = useSubscription();
  const { data: usage } = useUsage();
  const upgradePlan = useUpgradePlan();

  const [error, setError] = useState("");
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);

  const region = useMemo(detectRegion, []);
  const pricing = PRICING[region];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.rose[500]} />
      </View>
    );
  }

  const currentPlan = (subscription?.plan ?? "free") as PlanId;
  const planStatus = subscription?.plan_status ?? "active";
  const isActive = planStatus === "active" || planStatus === "trialing";

  function handlePlanChange(targetPlan: PlanId) {
    const action = getActionLabel(currentPlan, targetPlan);
    if (action === "current") return;

    if (action === "downgrade") {
      Alert.alert(
        `Switch to ${formatPlanName(targetPlan)}?`,
        getDowngradeWarning(currentPlan, targetPlan),
        [
          { text: "Keep current plan", style: "cancel" },
          {
            text: "Switch plan",
            style: "destructive",
            onPress: () => commitPlanChange(targetPlan),
          },
        ]
      );
      return;
    }

    commitPlanChange(targetPlan);
  }

  async function commitPlanChange(targetPlan: PlanId) {
    setError("");
    setPendingPlan(targetPlan);
    try {
      await upgradePlan.mutateAsync(targetPlan as any);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Couldn't change your plan right now."));
    } finally {
      setPendingPlan(null);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/tabs/home");
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.navy[700]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your plan</Text>
        <Text style={styles.subtitle}>
          Pick what works for you. You can change any time.
        </Text>

        {/* Current plan summary */}
        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanInfo}>
            <Text style={styles.currentPlanLabel}>Currently on</Text>
            <Text style={styles.currentPlanName}>
              {formatPlanName(currentPlan)}
            </Text>
            {!isActive ? (
              <Text style={styles.currentPlanStatus}>
                Status: {planStatus}
              </Text>
            ) : null}
          </View>
          {usage?.usage?.care_team_members ? (
            <View style={styles.usageBlock}>
              <Text style={styles.usageLabel}>Care team</Text>
              <Text style={styles.usageValue}>
                {usage.usage.care_team_members.current}
                {usage.usage.care_team_members.limit
                  ? ` / ${usage.usage.care_team_members.limit}`
                  : " (unlimited)"}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Error banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle"
              size={18}
              color="#A32D2D"
              style={{ marginRight: spacing[2] }}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Plans */}
        <Text style={styles.sectionLabel}>Choose a plan</Text>
        {PLANS.map((plan) => {
          const price = pricing[plan.id];
          const action = getActionLabel(currentPlan, plan.id);
          const isPending = pendingPlan === plan.id;

          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                action === "current" && styles.planCardCurrent,
                plan.recommended &&
                  action !== "current" &&
                  styles.planCardRecommended,
              ]}
            >
              {/* Header row */}
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.planTitleRow}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {plan.recommended && action !== "current" ? (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedBadgeText}>
                          Recommended
                        </Text>
                      </View>
                    ) : null}
                    {action === "current" ? (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.planDescription}>
                    {plan.shortDescription}
                  </Text>
                </View>
              </View>

              {/* Price */}
              <View style={styles.priceRow}>
                <Text style={styles.priceSymbol}>{price.symbol}</Text>
                <Text style={styles.priceAmount}>{price.amount}</Text>
                {price.period ? (
                  <Text style={styles.pricePeriod}>{price.period}</Text>
                ) : null}
              </View>

              {/* Features */}
              <View style={styles.featuresList}>
                {plan.features.map((f) => (
                  <View key={f.label} style={styles.featureRow}>
                    <Ionicons
                      name={f.icon}
                      size={16}
                      color={colors.rose[500]}
                      style={{ marginRight: spacing[2] }}
                    />
                    <Text style={styles.featureLabel}>{f.label}</Text>
                  </View>
                ))}
              </View>

              {/* Action button */}
              {action === "current" ? (
                <View style={styles.currentPlanIndicator}>
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={colors.navy[500]}
                    style={{ marginRight: spacing[2] }}
                  />
                  <Text style={styles.currentPlanIndicatorText}>
                    You're on this plan
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    action === "downgrade" && styles.actionButtonSecondary,
                    isPending && styles.actionButtonDisabled,
                  ]}
                  onPress={() => handlePlanChange(plan.id)}
                  disabled={isPending}
                  activeOpacity={0.85}
                >
                  {isPending ? (
                    <ActivityIndicator
                      color={
                        action === "downgrade"
                          ? colors.navy[600]
                          : colors.white
                      }
                    />
                  ) : (
                    <Text
                      style={[
                        styles.actionButtonText,
                        action === "downgrade" &&
                          styles.actionButtonTextSecondary,
                      ]}
                    >
                      {action === "upgrade"
                        ? `Switch to ${plan.name}`
                        : `Switch to ${plan.name}`}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Currency note */}
        <Text style={styles.currencyNote}>
          {region === "NG"
            ? "Prices shown in Nigerian Naira (₦)."
            : region === "UK"
            ? "Prices shown in British Pounds (£)."
            : "Prices shown in US Dollars ($)."}{" "}
          Your actual charge will be in the currency configured at sign-up.
        </Text>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Questions you might have</Text>

          <FaqItem
            q="Can I switch plans later?"
            a="Yes. You can move between plans any time — your billing adjusts at the next cycle."
          />
          <FaqItem
            q="What happens if I downgrade?"
            a="You'll keep access to your current plan until the end of your billing period. After that, features outside your new plan will be paused."
          />
          <FaqItem
            q="Can I cancel?"
            a="Yes. Move back to the Free plan any time — no questions asked. Your data stays safe."
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.faqQuestionRow}>
        <Text style={styles.faqQuestion}>{q}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.navy[400]}
        />
      </View>
      {expanded ? <Text style={styles.faqAnswer}>{a}</Text> : null}
    </TouchableOpacity>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPlanName(planId: PlanId): string {
  return { free: "Free", standard: "Standard", premium: "Premium" }[planId];
}

function getDowngradeWarning(from: PlanId, to: PlanId): string {
  if (from === "premium" && to === "free") {
    return "You'll go from unlimited features to 10 AI messages a day and 1 care team member. Your data stays safe.";
  }
  if (from === "premium" && to === "standard") {
    return "You'll lose unlimited care team messaging and AI triage. You'll keep unlimited chat and pattern detection.";
  }
  if (from === "standard" && to === "free") {
    return "You'll go from unlimited chat to 10 messages a day. Care team messaging and pattern detection will pause.";
  }
  return "Some features will be limited on the new plan.";
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CREAM,
  },

  // Header
  header: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[2],
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
  },

  // Content
  content: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },

  // Titles
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[700],
    marginBottom: spacing[2],
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.navy[500],
    marginBottom: spacing[5],
    lineHeight: typography.fontSize.base * 1.5,
  },

  // Current plan card
  currentPlanCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing[4],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.rose[100],
    gap: spacing[4],
  },
  currentPlanInfo: {
    flex: 1,
  },
  currentPlanLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.navy[400],
    marginBottom: 2,
  },
  currentPlanName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[700],
    letterSpacing: -0.3,
  },
  currentPlanStatus: {
    fontSize: typography.fontSize.xs,
    color: colors.rose[500],
    marginTop: 2,
    fontStyle: "italic",
    textTransform: "capitalize",
  },
  usageBlock: {
    alignItems: "flex-end",
    paddingLeft: spacing[3],
    borderLeftWidth: 1,
    borderLeftColor: colors.rose[100],
  },
  usageLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.navy[400],
    marginBottom: 2,
  },
  usageValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy[700],
  },

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCEBEB",
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  errorText: {
    flex: 1,
    color: "#A32D2D",
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.4,
  },

  // Section
  sectionLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy[700],
    marginBottom: spacing[3],
    letterSpacing: -0.3,
  },

  // Plan card
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing[5],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.rose[100],
  },
  planCardRecommended: {
    borderColor: colors.rose[400],
    borderWidth: 2,
  },
  planCardCurrent: {
    backgroundColor: colors.rose[50],
    borderColor: colors.rose[300],
  },

  // Plan header
  planHeader: {
    marginBottom: spacing[3],
  },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: 4,
    flexWrap: "wrap",
  },
  planName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[700],
    letterSpacing: -0.3,
  },
  recommendedBadge: {
    backgroundColor: colors.rose[500],
    borderRadius: 6,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  recommendedBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  currentBadge: {
    backgroundColor: colors.navy[50],
    borderRadius: 6,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  currentBadgeText: {
    color: colors.navy[600],
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  planDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.navy[500],
  },

  // Price
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: spacing[4],
  },
  priceSymbol: {
    fontSize: typography.fontSize.lg,
    color: colors.navy[700],
    fontWeight: typography.fontWeight.semibold,
    marginRight: 2,
  },
  priceAmount: {
    fontSize: typography.fontSize["3xl"],
    color: colors.navy[700],
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -1,
  },
  pricePeriod: {
    fontSize: typography.fontSize.sm,
    color: colors.navy[400],
    marginLeft: spacing[2],
  },

  // Features
  featuresList: {
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.navy[600],
    lineHeight: typography.fontSize.sm * 1.4,
  },

  // Action button
  actionButton: {
    backgroundColor: colors.rose[500],
    borderRadius: 12,
    paddingVertical: spacing[4],
    alignItems: "center",
    ...Platform.select({
      web: { /* @ts-ignore */ cursor: "pointer" },
    }),
  },
  actionButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.navy[200],
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  actionButtonTextSecondary: {
    color: colors.navy[600],
  },

  // Current plan indicator
  currentPlanIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[3],
  },
  currentPlanIndicatorText: {
    color: colors.navy[500],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },

  // Currency note
  currencyNote: {
    fontSize: typography.fontSize.xs,
    color: colors.navy[400],
    textAlign: "center",
    fontStyle: "italic",
    marginVertical: spacing[5],
    paddingHorizontal: spacing[4],
    lineHeight: typography.fontSize.xs * 1.6,
  },

  // FAQ
  faqSection: {
    marginTop: spacing[4],
  },
  faqTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy[700],
    marginBottom: spacing[3],
    letterSpacing: -0.3,
  },
  faqItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing[4],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.rose[100],
    ...Platform.select({
      web: { /* @ts-ignore */ cursor: "pointer" },
    }),
  },
  faqQuestionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestion: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.navy[700],
    fontWeight: typography.fontWeight.medium,
    paddingRight: spacing[2],
  },
  faqAnswer: {
    fontSize: typography.fontSize.sm,
    color: colors.navy[500],
    marginTop: spacing[2],
    lineHeight: typography.fontSize.sm * 1.5,
  },
});