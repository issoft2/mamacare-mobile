/**
 * mobile/app/profile/subscription.tsx
 * Refined Subscription Management with WhatsApp Concierge
 */

import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useMemo } from "react";
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
import { LinearGradient } from "expo-linear-gradient";

import { useSubscription, useUsage } from "@mumcare/api";
import { colors, spacing, typography, shadows } from "@mumcare/ui";

const WHATSAPP_NUMBER = "2349059691747";
const WHATSAPP_GREEN = "#25D366";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { data: subscription, isLoading } = useSubscription();
  const { data: usage } = useUsage();

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={24} color={colors.navy[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Membership</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.title}>Your Health, Simplified.</Text>
          <Text style={styles.subtitle}>
            We're rolling out our premium features slowly to ensure the highest quality of care.
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
              style={styles.waButton} 
              onPress={() => openWhatsApp("Standard")}
            >
              <Ionicons name="logo-whatsapp" size={20} color={colors.white} />
              <Text style={styles.waButtonText}>Join the Waitlist</Text>
            </TouchableOpacity>
          </View>

          {/* Premium Plan */}
          <LinearGradient 
            colors={[colors.white, '#FFF0F3']} 
            style={[styles.planCard, styles.lockedCard, styles.premiumCard]}
          >
            <View style={[styles.planBadge, { backgroundColor: colors.rose[500] }]}>
              <Text style={[styles.planBadgeText, { color: colors.white }]}>PREMIUM</Text>
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
              style={[styles.waButton, { backgroundColor: colors.navy[700] }]} 
              onPress={() => openWhatsApp("Premium")}
            >
              <Text style={styles.waButtonText}>Inquire for Early Access</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <Text style={styles.footerNote}>
          Secure payments powered by Flutterwave.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 60, 
    paddingHorizontal: 20,
    marginBottom: 20 
  },
  backCircle: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: colors.white, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...shadows.sm 
  },
  headerTitle: { flex: 1, textAlign: 'center', marginRight: 40, fontSize: 18, fontWeight: '700', color: colors.navy[700] },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  heroSection: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: colors.navy[700], marginBottom: 10 },
  subtitle: { fontSize: 16, color: colors.navy[400], lineHeight: 22 },
  statusCard: { 
    backgroundColor: colors.white, 
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
  planSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.navy[700], marginBottom: 15 },
  planCard: { 
    backgroundColor: colors.white, 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[100]
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
  waButton: { 
    flexDirection: 'row', 
    backgroundColor: WHATSAPP_GREEN, 
    padding: 16, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 10 
  },
  waButtonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  footerNote: { textAlign: 'center', fontSize: 12, color: colors.navy[300], marginTop: 20 },
  lockedCard: { opacity: 0.9 }
});
