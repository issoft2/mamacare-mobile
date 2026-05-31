/**
 * mobile/app/profile/subscription.tsx
 * Refined Subscription Management with WhatsApp Concierge
 */

import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useSubscription, useUsage } from "@mumcare/api";
import { colors, shadows } from "@mumcare/ui";
import { ctaButtonStyles, ctaGradientColors } from "@/components/styles/ctaButton";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";
import { getActiveLegalDocument, getActiveLegalRoute } from "@/lib/legal";

const WHATSAPP_NUMBER = "2349059691747";
const WHATSAPP_GREEN = AUTH_UI.successWhatsapp;

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { isLoading } = useSubscription();
  const { data: usage } = useUsage();
  const activePrivacy = getActiveLegalDocument("privacy");
  const activeTerms = getActiveLegalDocument("terms");

  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";

  const openWhatsApp = async (planName: string) => {
    const msg = `Hi mumcare team, I'd like to learn more about the ${planName} plan. My account is ${userEmail}.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Contact Us", "Please message us on WhatsApp at +234 905 969 1747");
    }
  };

  if (isLoading) return (
    <View style={styles.center}><ActivityIndicator color={colors.rose[500]} /></View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.bgOverlay}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={24} color={colors.navy[700]} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>Membership</Text>
          <Text style={styles.headerTitle}>Plans and access</Text>
          <Text style={styles.headerSubtext}>Choose the support level that feels right for your journey.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.title}>Your Health, Simplified</Text>
          <Text style={styles.subtitle}>
            We are rolling out premium features with care so every upgrade feels reliable, helpful, and human.
          </Text>
        </View>

        {/* Current Plan & Usage Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>Active plan</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Free forever</Text>
            </View>
          </View>
          
          <View style={styles.usageRow}>
            <View style={styles.usageItem}>
              <Text style={styles.usageVal}>{usage?.usage?.care_team_members?.current ?? 0}</Text>
              <Text style={styles.usageSub}>Team members</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.usageItem}>
              <Text style={styles.usageVal}>10</Text>
              <Text style={styles.usageSub}>Daily messages</Text>
            </View>
          </View>
          <Text style={styles.statusFootnote}>Your free plan is active and fully available while new plans are prepared.</Text>
        </View>

        {/* Plan Comparison */}
        <View style={styles.planSection}>
          <Text style={styles.sectionTitle}>Explore Plans</Text>
          
          {/* Standard Plan */}
          <View style={[styles.planCard, styles.lockedCard]}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>Coming soon</Text>
            </View>
            <Text style={styles.planName}>Standard</Text>
            <Text style={styles.planPrice}>₦-- <Text style={styles.period}>/ month</Text></Text>
            
            <View style={styles.featureList}>
              {['Unlimited AI Chat', 'Pattern Detection', 'Care Team Messaging'].map(f => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.navy[200]} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[ctaButtonStyles.button, styles.waButtonShell]}
              onPress={() => openWhatsApp("Standard")}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={ctaGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={ctaButtonStyles.gradient}
              >
                <Ionicons name="logo-whatsapp" size={20} color={colors.white} />
                <Text style={ctaButtonStyles.text}>Inquire for access</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Premium Plan */}
          <LinearGradient 
            colors={[colors.white, AUTH_UI.surfaceTint2]} 
            style={[styles.planCard, styles.lockedCard, styles.premiumCard]}
          >
            <View style={[styles.planBadge, { backgroundColor: colors.rose[500] }]}>
              <Text style={[styles.planBadgeText, { color: colors.white }]}>coming soon</Text>
            </View>
            <Text style={styles.planName}>Premium Care</Text>
            <Text style={styles.planPrice}>₦-- <Text style={styles.period}>/ month</Text></Text>

            <View style={styles.featureList}>
              {['AI Triage for Emergencies', 'Priority Support', 'Unlimited Team Sync'].map(f => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="sparkles" size={18} color={colors.rose[300]} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[ctaButtonStyles.button, styles.waButtonShell]} 
              onPress={() => openWhatsApp("Premium")}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={ctaGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={ctaButtonStyles.gradient}
              >
                <Ionicons name="logo-whatsapp" size={20} color={colors.white} />
                <Text style={ctaButtonStyles.text}>Inquire for access</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <Text style={styles.footerNote}>
          Secure payments powered by Flutterwave. You stay in control of your plan at every step.
        </Text>
        <View style={styles.legalLinksRow}>
          <TouchableOpacity
            onPress={() => router.push(getActiveLegalRoute("privacy") as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.legalLinkText}>
              Privacy ({activePrivacy.region.toUpperCase()} {activePrivacy.version})
            </Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>•</Text>
          <TouchableOpacity
            onPress={() => router.push(getActiveLegalRoute("terms") as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.legalLinkText}>
              Terms ({activeTerms.region.toUpperCase()} {activeTerms.version})
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AUTH_UI.warmBackground },
  bgOverlay: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    paddingTop: 58, 
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  backCircle: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: colors.white, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 14,
    ...shadows.sm 
  },
  headerCopy: { flex: 1 },
  headerEyebrow: { fontSize: 13, fontWeight: '700', color: AUTH_UI.textBlack, marginBottom: 4, fontFamily: FONT_FRIENDLY_SANS },
  headerTitle: { fontSize: 30, fontWeight: '800', color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.5 },
  headerSubtext: { marginTop: 8, fontSize: 16, lineHeight: 24, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  heroSection: { marginBottom: 24 },
  title: { fontSize: 30, fontWeight: '800', color: AUTH_UI.textHeading, marginBottom: 8, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: AUTH_UI.textBlack, lineHeight: 24, fontFamily: FONT_FRIENDLY_SANS },
  statusCard: { 
    backgroundColor: AUTH_UI.textWhite, 
    borderRadius: AUTH_UI.cardRadius, 
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
    marginBottom: 30,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    ...shadows.md
  },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statusLabel: { fontSize: 14, fontWeight: '600', color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  activeBadge: { backgroundColor: colors.rose[50], borderWidth: 1, borderColor: colors.rose[200], paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  activeBadgeText: { color: AUTH_UI.linkBerry, fontWeight: '700', fontSize: 13, fontFamily: FONT_FRIENDLY_SANS },
  usageRow: { flexDirection: 'row', alignItems: 'center' },
  usageItem: { flex: 1, alignItems: 'center' },
  usageVal: { fontSize: 30, fontWeight: '800', color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF },
  usageSub: { fontSize: 13, color: AUTH_UI.textBlack, marginTop: 4, fontFamily: FONT_FRIENDLY_SANS },
  divider: { width: 1, height: 30, backgroundColor: colors.gray[100] },
  statusFootnote: { marginTop: 14, textAlign: 'center', fontSize: 13, color: AUTH_UI.textBlack, lineHeight: 20, fontFamily: FONT_FRIENDLY_SANS },
  planSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: AUTH_UI.textHeading, marginBottom: 15, fontFamily: FONT_WARM_SERIF },
  planCard: { 
    backgroundColor: AUTH_UI.textWhite, 
    borderRadius: AUTH_UI.cardRadius, 
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
    marginBottom: 16,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    ...shadows.sm,
  },
  premiumCard: { borderColor: colors.rose[200] },
  planBadge: { alignSelf: 'flex-start', backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.rose[200], paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  planBadgeText: { fontSize: 11, fontWeight: '700', color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  planName: { fontSize: 24, fontWeight: '800', color: AUTH_UI.textHeading, marginBottom: 4, fontFamily: FONT_WARM_SERIF },
  planPrice: { fontSize: 30, fontWeight: '800', color: AUTH_UI.textHeading, marginBottom: 20, fontFamily: FONT_WARM_SERIF },
  period: { fontSize: 14, color: AUTH_UI.textBlack, fontWeight: '400', fontFamily: FONT_FRIENDLY_SANS },
  featureList: { gap: 12, marginBottom: 25 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 15, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  waButtonShell: {
    marginTop: 2,
  },
  footerNote: { textAlign: 'center', fontSize: 13, color: AUTH_UI.textBlack, marginTop: 20, lineHeight: 20, fontFamily: FONT_FRIENDLY_SANS },
  legalLinksRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  legalLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: AUTH_UI.linkBerry,
    textDecorationLine: "underline",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  legalDot: { fontSize: 12, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  lockedCard: { opacity: 0.9 }
});
