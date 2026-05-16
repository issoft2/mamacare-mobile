/**
 * mobile/app/profile/subscription.tsx
 *
 * Subscription screen.
 *
 *  - Free is the only currently active plan
 *  - Standard and Premium are shown as "Coming soon"
 *  - Each coming-soon plan has a "Talk to us" button that opens
 *    WhatsApp with a pre-filled message — the user can edit before sending
 *
 * WhatsApp deep linking works on iOS, Android, and web:
 *   https://wa.me/<number>?text=<url-encoded message>
 */

import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Localization from "expo-localization";

import { useSubscription, useUsage } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";

// ── Types ────────────────────────────────────────────────────────────────────

type PlanId = "free" | "standard" | "premium";
type Region = "NG" | "UK" | "OTHER";

interface PlanFeature {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

interface Plan {
  id: PlanId;
  name: string;
  shortDescription: string;
  features: PlanFeature[];
  isAvailable: boolean;
}

interface PriceInfo {
  amount: string;
  symbol: string;
  period: string;
}

// ── Configuration ────────────────────────────────────────────────────────────

// WhatsApp number in international format (no + or spaces).
const WHATSAPP_NUMBER = "2349059691747";

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    shortDescription: "Get started at no cost",
    isAvailable: true,
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
    isAvailable: false,
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
    isAvailable: false,
    features: [
      { icon: "checkmark-circle-outline", label: "Everything in Standard" },
      { icon: "people-outline", label: "Unlimited care team messaging" },
      { icon: "alert-circle-outline", label: "AI triage for urgent concerns" },
      { icon: "headset-outline", label: "Priority support" },
    ],
  },
];

const PRICING: Record<Region, Record<PlanId, PriceInfo>> = {
  NG: {
    free: { amount: "0", symbol: "₦", period: "" },
    standard: { amount: "4,000", symbol: "₦", period: "/ month" },
    premium: { amount: "8,000", symbol: "₦", period: "/ month" },
  },
  UK: {
    free: { amount: "0", symbol: "£", period: "" },
    standard: { amount: "9.99", symbol: "£", period: "/ month" },
    premium: { amount: "19.99", symbol: "£", period: "/ month" },
  },
  OTHER: {
    free: { amount: "0", symbol: "$", period: "" },
    standard: { amount: "12.99", symbol: "$", period: "/ month" },
    premium: { amount: "24.99", symbol: "$", period: "/ month" },
  },
};

const CREAM = "#FFF8F4";

// ── Helpers ──────────────────────────────────────────────────────────────────

function detectRegion(): Region {
  try {
    const locales = Localization.getLocales();
    const code = locales[0]?.regionCode || (Localization as any).region || "";
    if (code === "NG") return "NG";
    if (code === "GB") return "UK";
    return "OTHER";
  } catch {
    return "OTHER";
  }
}

function formatPlanName(planId: PlanId): string {
  return { free: "Free", standard: "Standard", premium: "Premium" }[planId];
}

function buildWhatsAppMessage(planName: string, userEmail: string | null) {
  const emailLine = userEmail
    ? `My account email is ${userEmail}.`
    : "I can share my account email here when you're ready.";
  return (
    `Hi MumCare team,\n\n` +
    `I'd like to upgrade to the ${planName} plan.\n` +
    `${emailLine}\n\n` +
    `Thank you!`
  );
}

async function openWhatsApp(planName: string, userEmail: string | null) {
  const message = buildWhatsAppMessage(planName, userEmail);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message
  )}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback for environments where canOpenURL is too strict
      await Linking.openURL(url);
    }
  } catch (err) {
    Alert.alert(
      "Couldn't open WhatsApp",
      "Please reach us at +234 905 969 1747 or message us on WhatsApp."
    );
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { data: subscription, isLoading } = useSubscription();
  const { data: usage } = useUsage();

  const region = useMemo(detectRegion, []);
  const pricing = PRICING[region];

  const userEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.rose[500]} />
      </View>
    );
  }

  const currentPlan = (subscription?.plan ?? "free") as PlanId;

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
          Right now everyone is on Free. We're building paid plans
          carefully — they'll arrive soon. In the meantime, message us
          on WhatsApp if you'd like early access.
        </Text>

        {/* Current plan summary */}
        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanInfo}>
            <Text style={styles.currentPlanLabel}>Currently on</Text>
            <Text style={styles.currentPlanName}>
              {formatPlanName(currentPlan)}
            </Text>
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

        {/* Plans */}
        <Text style={styles.sectionLabel}>What's available</Text>
        {PLANS.map((plan) => {
          const price = pricing[plan.id];
          const isCurrent = plan.id === currentPlan;

          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                isCurrent && styles.planCardCurrent,
                !plan.isAvailable && styles.planCardComingSoon,
              ]}
            >
              {/* Header */}
              <View style={styles.planHeader}>
                <View style={styles.planTitleRow}>
                  <Text
                    style={[
                      styles.planName,
                      !plan.isAvailable && styles.planNameMuted,
                    ]}
                  >
                    {plan.name}
                  </Text>
                  {isCurrent ? (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  ) : null}
                  {!plan.isAvailable ? (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonBadgeText}>
                        Coming soon
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.planDescription,
                    !plan.isAvailable && styles.planDescriptionMuted,
                  ]}
                >
                  {plan.shortDescription}
                </Text>
              </View>

              {/* Price */}
              <View style={styles.priceRow}>
                <Text
                  style={[
                    styles.priceSymbol,
                    !plan.isAvailable && styles.priceMuted,
                  ]}
                >
                  {price.symbol}
                </Text>
                <Text
                  style={[
                    styles.priceAmount,
                    !plan.isAvailable && styles.priceMuted,
                  ]}
                >
                  {price.amount}
                </Text>
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
                      color={
                        plan.isAvailable
                          ? colors.rose[500]
                          : colors.navy[300]
                      }
                      style={{ marginRight: spacing[2] }}
                    />
                    <Text
                      style={[
                        styles.featureLabel,
                        !plan.isAvailable && styles.featureLabelMuted,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Footer state */}
              {isCurrent ? (
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
              ) : null}

              {!plan.isAvailable ? (
                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={() => openWhatsApp(plan.name, userEmail)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Contact us about ${plan.name} plan on WhatsApp`}
                >
                  <Ionicons
                    name="logo-whatsapp"
                    size={18}
                    color={colors.white}
                    style={{ marginRight: spacing[2] }}
                  />
                  <Text style={styles.whatsappButtonText}>
                    Talk to us about {plan.name}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}

        {/* Currency note */}
        <Text style={styles.currencyNote}>
          {region === "NG"
            ? "Future prices shown in Nigerian Naira (₦)."
            : region === "UK"
            ? "Future prices shown in British Pounds (£)."
            : "Future prices shown in US Dollars ($)."}
        </Text>
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

// WhatsApp brand green, used sparingly to signal the platform
const WHATSAPP_GREEN = "#25D366";

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
  planCardCurrent: {
    backgroundColor: colors.rose[50],
    borderColor: colors.rose[300],
  },
  planCardComingSoon: {
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[100],
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
  planNameMuted: {
    color: colors.navy[400],
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
  comingSoonBadge: {
    backgroundColor: colors.navy[50],
    borderRadius: 6,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  comingSoonBadgeText: {
    color: colors.navy[500],
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  planDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.navy[500],
  },
  planDescriptionMuted: {
    color: colors.navy[400],
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
  priceMuted: {
    color: colors.navy[400],
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
  featureLabelMuted: {
    color: colors.navy[400],
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

  // WhatsApp button
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WHATSAPP_GREEN,
    borderRadius: 12,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    ...Platform.select({
      ios: {
        shadowColor: WHATSAPP_GREEN,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      web: {
        // @ts-ignore
        cursor: "pointer",
        // @ts-ignore
        boxShadow: "0px 2px 8px rgba(37, 211, 102, 0.25)",
      },
    }),
  },
  whatsappButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },

  // Currency note
  currencyNote: {
    fontSize: typography.fontSize.xs,
    color: colors.navy[400],
    textAlign: "center",
    fontStyle: "italic",
    marginTop: spacing[3],
    paddingHorizontal: spacing[4],
    lineHeight: typography.fontSize.xs * 1.6,
  },
});