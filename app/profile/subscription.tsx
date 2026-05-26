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
import { getActiveLegalDocument, getActiveLegalRoute } from "@/lib/legal";

const WHATSAPP_NUMBER = "2349059691747";
const WHATSAPP_GREEN = "#25D366";

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
      <LinearGradient colors={["#FFF8F4", "#F8FAFF"]} style={styles.bgOverlay}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={24} color={colors.navy[700]} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>MEMBERSHIP</Text>
          <Text style={styles.headerTitle}>Plans & Access</Text>
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
            <Text style={styles.statusLabel}>ACTIVE PLAN</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Free Forever</Text>
            </View>
          </View>
          
          <View style={styles.usageRow}>
            <View style={styles.usageItem}>
              <Text style={styles.usageVal}>{usage?.usage?.care_team_members?.current ?? 0}</Text>
              <Text style={styles.usageSub}>Team Members</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.usageItem}>
              <Text style={styles.usageVal}>10</Text>
              <Text style={styles.usageSub}>Daily Messages</Text>
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
              <Text style={styles.planBadgeText}>COMING SOON</Text>
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
                <Text style={ctaButtonStyles.text}>Inquire for Access</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Premium Plan */}
          <LinearGradient 
            colors={[colors.white, '#FFF0F3']} 
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
                <Text style={ctaButtonStyles.text}>Inquire for Access</Text>
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
  container: { flex: 1, backgroundColor: '#FFF8F4' },
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
  headerEyebrow: { fontSize: 11, fontWeight: '800', color: colors.rose[500], letterSpacing: 1.2, marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.navy[700] },
  headerSubtext: { marginTop: 6, fontSize: 13, lineHeight: 19, color: colors.navy[400] },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  heroSection: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: colors.navy[700], marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.navy[400], lineHeight: 22 },
  statusCard: { 
    backgroundColor: 'rgba(255,255,255,0.92)', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 30,
    borderWidth: 1,
    borderColor: colors.rose[100],
    ...shadows.md
  },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statusLabel: { fontSize: 12, fontWeight: '800', color: colors.navy[300], letterSpacing: 1 },
  activeBadge: { backgroundColor: colors.rose[50], paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  activeBadgeText: { color: colors.rose[600], fontWeight: '700', fontSize: 12 },
  usageRow: { flexDirection: 'row', alignItems: 'center' },
  usageItem: { flex: 1, alignItems: 'center' },
  usageVal: { fontSize: 24, fontWeight: '800', color: colors.navy[700] },
  usageSub: { fontSize: 12, color: colors.navy[400], marginTop: 4 },
  divider: { width: 1, height: 30, backgroundColor: colors.gray[100] },
  statusFootnote: { marginTop: 14, textAlign: 'center', fontSize: 12, color: colors.navy[300], lineHeight: 18 },
  planSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.navy[700], marginBottom: 15 },
  planCard: { 
    backgroundColor: 'rgba(255,255,255,0.93)', 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
    ...shadows.sm,
  },
  premiumCard: { borderColor: colors.rose[200] },
  planBadge: { alignSelf: 'flex-start', backgroundColor: colors.gray[100], paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 12 },
  planBadgeText: { fontSize: 10, fontWeight: '800', color: colors.gray[500] },
  planName: { fontSize: 22, fontWeight: '700', color: colors.navy[700], marginBottom: 4 },
  planPrice: { fontSize: 28, fontWeight: '800', color: colors.navy[700], marginBottom: 20 },
  period: { fontSize: 14, color: colors.navy[300], fontWeight: '400' },
  featureList: { gap: 12, marginBottom: 25 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, color: colors.navy[500] },
  waButtonShell: {
    marginTop: 2,
  },
  footerNote: { textAlign: 'center', fontSize: 12, color: colors.navy[300], marginTop: 20, lineHeight: 18 },
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
    color: colors.navy[500],
    textDecorationLine: "underline",
  },
  legalDot: { fontSize: 12, color: colors.navy[300] },
  lockedCard: { opacity: 0.9 }
});
