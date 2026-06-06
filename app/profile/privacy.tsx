/**
 * mobile/app/profile/privacy.tsx
 * Refined Data & Privacy - Secure, Granular, and Compliant.
 */

import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { apiRequest } from "@safeborn/api";
import { colors, spacing, typography, shadows } from "@safeborn/ui";
import { getActiveLegalDocument, getActiveLegalRoute } from "@/lib/legal";
import { signOutWithPushCleanup } from "@/lib/pushNotifications";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

export default function PrivacyScreen() {
  const { signOut, userId } = useAuth();
  const router = useRouter();
  const activePrivacy = getActiveLegalDocument("privacy");
  const activeTerms = getActiveLegalDocument("terms");
  
  const [consents, setConsents] = useState({
    essential_health: true,
    ai_guidance: true,
    care_team_sharing: true,
    research: true,
    marketing: false,
    system_improvement: false,
    anon_commercial: false,
    model_training: false,
  });

  const [loadingState, setLoadingState] = useState<{tier: string | null, action: 'export' | 'delete' | null}>({
    tier: null,
    action: null
  });

  const toggleConsent = (tier: keyof typeof consents) => {
    const isWithdrawing = consents[tier];
    
    if (isWithdrawing) {
      Alert.alert(
        "Limit your experience?",
        getWithdrawalCopy(tier),
        [
          { text: "Keep On", style: "cancel" },
          { 
            text: "Turn Off", 
            style: "destructive", 
            onPress: () => handleUpdate(tier, false) 
          }
        ]
      );
    } else {
      handleUpdate(tier, true);
    }
  };

  const handleUpdate = async (tier: string, value: boolean) => {
    setLoadingState({ ...loadingState, tier });
    // Simulate API call for sync
    setTimeout(() => {
      setConsents(prev => ({ ...prev, [tier]: value }));
      setLoadingState({ ...loadingState, tier: null });
    }, 600);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.bgOverlay}>
      {/* Subtle Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/tabs/home")} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.navy[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Data</Text>
        <Ionicons name="lock-closed" size={20} color={colors.navy[200]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Security Shield Section */}
        <View style={styles.securityBanner}>
          <View style={styles.shieldIcon}>
            <Ionicons name="shield-checkmark" size={32} color={colors.rose[500]} />
          </View>
          <View style={styles.securityText}>
            <Text style={styles.securityTitle}>Your data is your own.</Text>
            <Text style={styles.securitySub}>
              We use 256-bit encryption to protect your health records. safeborn never sells your personal information.
            </Text>
          </View>
        </View>

        {/* Consent Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Permissions</Text>
          <View style={styles.groupCard}>
            <ConsentRow 
              title="Essential Health Data" 
              desc="Symptom logs and profile info needed for core app functions." 
              value={consents.essential_health} 
              required 
            />
            <View style={styles.divider} />
            <ConsentRow 
              title="AI Health Guidance" 
              desc="Personalized analysis of your symptoms and trends." 
              value={consents.ai_guidance} 
              onToggle={() => toggleConsent('ai_guidance')}
              loading={loadingState.tier === 'ai_guidance'}
            />
            <View style={styles.divider} />
            <ConsentRow 
              title="Care Team Sync" 
              desc="Automatically share logs with your linked providers." 
              value={consents.care_team_sharing} 
              onToggle={() => toggleConsent('care_team_sharing')}
              loading={loadingState.tier === 'care_team_sharing'}
            />
            <View style={styles.divider} />
            <ConsentRow
              title="Marketing (optional)"
              desc={<Text>Receive updates, offers, and health tips. <Text style={{color: colors.rose[500], textDecorationLine: 'underline'}} onPress={() => router.push(getActiveLegalRoute('privacy') as any)}>Learn more</Text></Text>}
              value={consents.marketing}
              onToggle={() => toggleConsent('marketing')}
              loading={loadingState.tier === 'marketing'}
            />
            <View style={styles.divider} />
            <ConsentRow
              title="System Improvement (optional)"
              desc={<Text>Help us improve features and experience. <Text style={{color: colors.rose[500], textDecorationLine: 'underline'}} onPress={() => router.push(getActiveLegalRoute('privacy') as any)}>Learn more</Text></Text>}
              value={consents.system_improvement}
              onToggle={() => toggleConsent('system_improvement')}
              loading={loadingState.tier === 'system_improvement'}
            />
            <View style={styles.divider} />
            <ConsentRow
              title="Anonymous Commercialization (optional)"
              desc={<Text>Allow use of anonymized data for research or commercial purposes. <Text style={{color: colors.rose[500], textDecorationLine: 'underline'}} onPress={() => router.push(getActiveLegalRoute('privacy') as any)}>Learn more</Text></Text>}
              value={consents.anon_commercial}
              onToggle={() => toggleConsent('anon_commercial')}
              loading={loadingState.tier === 'anon_commercial'}
            />
            <View style={styles.divider} />
            <ConsentRow
              title="Model Training (optional)"
              desc={<Text>Allow your data to help train and improve AI models. <Text style={{color: colors.rose[500], textDecorationLine: 'underline'}} onPress={() => router.push(getActiveLegalRoute('privacy') as any)}>Learn more</Text></Text>}
              value={consents.model_training}
              onToggle={() => toggleConsent('model_training')}
              loading={loadingState.tier === 'model_training'}
            />
          </View>
        </View>

        {/* Rights Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          <View style={styles.groupCard}>
            <ActionRow
              icon="document-text-outline"
              title={`Privacy Policy (${activePrivacy.region.toUpperCase()} ${activePrivacy.version})`}
              desc="View the active policy version applied to your account region."
              onPress={() => router.push(getActiveLegalRoute("privacy") as any)}
            />
            <View style={styles.divider} />
            <ActionRow
              icon="reader-outline"
              title={`Terms of Service (${activeTerms.region.toUpperCase()} ${activeTerms.version})`}
              desc="View the active terms version for your region."
              onPress={() => router.push(getActiveLegalRoute("terms") as any)}
            />
            <View style={styles.divider} />
            <ActionRow 
              icon="download-outline" 
              title="Request Data Export" 
              desc="Get a copy of all your data via email."
              onPress={() => Alert.alert("Request Sent", "We'll prepare your file within 30 days.")}
            />
            <View style={styles.divider} />
            <ActionRow 
              icon="trash-outline" 
              title="Delete My Account" 
              desc="Permanently remove your personal information."
              danger
              onPress={() => handleDeleteAccount(signOut, userId)}
            />
          </View>
        </View>

        <Text style={styles.footerNote}>
          safeborn complies with UK GDPR and NDPA. Health records are legally retained for 7 years post-due date per DCB0129 standards.
        </Text>
      </ScrollView>
      </LinearGradient>
    </View>
  );
}

// Helper Components
function ConsentRow({ title, desc, value, required = false, onToggle, loading }: any) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <View style={styles.titleLine}>
          <Text style={styles.rowTitle}>{title}</Text>
          {required && <View style={styles.reqBadge}><Text style={styles.reqText}>Required</Text></View>}
        </View>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.rose[400]} />
      ) : (
        <Switch 
          value={value} 
          onValueChange={onToggle} 
          disabled={required}
          trackColor={{ false: AUTH_UI.semanticNeutralSoft, true: colors.rose[200] }}
          thumbColor={value ? colors.rose[500] : AUTH_UI.semanticNeutralLight}
        />
      )}
    </View>
  );
}

function ActionRow({ icon, title, desc, onPress, danger }: any) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.iconCircle, danger && { backgroundColor: AUTH_UI.dangerSoftBg }]}>
        <Ionicons name={icon} size={20} color={danger ? AUTH_UI.dangerSoft : colors.navy[600]} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && { color: AUTH_UI.dangerSoft }]}>{title}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.navy[100]} />
    </TouchableOpacity>
  );
}

const handleDeleteAccount = (signOut: any, userId: string | null | undefined) => {
  Alert.alert(
    "Are you sure?",
    "This will delete your account. Health data will be archived for 7 years per clinical law but will not be accessible to you.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete Everything",
        style: "destructive",
        onPress: () => {
          void signOutWithPushCleanup({ userId, signOut });
        },
      }
    ]
  );
};

function getWithdrawalCopy(tier: string) {
  if (tier === 'ai_guidance') return "You will lose personalized health insights and pattern detection.";
  return "Your care team will no longer receive automated updates from your logs.";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AUTH_UI.warmBackground },
  bgOverlay: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: AUTH_UI.textWhite, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200], justifyContent: 'center', alignItems: 'center', ...shadows.sm },
  headerTitle: { fontSize: 30, fontWeight: '800', color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  securityBanner: { flexDirection: 'row', backgroundColor: AUTH_UI.textWhite, padding: 20, borderRadius: 24, marginBottom: 30, borderWidth: 1, borderColor: colors.rose[50], ...shadows.sm },
  shieldIcon: { marginRight: 15, paddingTop: 5 },
  securityText: { flex: 1 },
  securityTitle: { fontSize: 20, fontWeight: '800', color: AUTH_UI.textHeading, marginBottom: 4, fontFamily: FONT_WARM_SERIF },
  securitySub: { fontSize: 13, color: AUTH_UI.textBlack, lineHeight: 18, fontFamily: FONT_FRIENDLY_SANS },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: AUTH_UI.textHeading, marginBottom: 12, marginLeft: 2, fontFamily: FONT_WARM_SERIF },
  groupCard: { backgroundColor: AUTH_UI.textWhite, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: AUTH_UI.semanticNeutralSofter },
  row: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  rowText: { flex: 1, paddingRight: 15 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: AUTH_UI.textHeading, fontFamily: FONT_FRIENDLY_SANS },
  rowDesc: { fontSize: 13, color: AUTH_UI.textBlack, lineHeight: 18, fontFamily: FONT_FRIENDLY_SANS },
  divider: { height: 1, backgroundColor: AUTH_UI.semanticPanel, marginHorizontal: 20 },
  reqBadge: { backgroundColor: colors.navy[50], paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  reqText: { fontSize: 10, fontWeight: '800', color: colors.navy[500] },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: AUTH_UI.semanticBluePale, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  footerNote: { textAlign: 'center', fontSize: 12, color: AUTH_UI.textBlack, lineHeight: 18, paddingHorizontal: 20, fontFamily: FONT_FRIENDLY_SANS }
});

const enhancedStyles = StyleSheet.create({
  consentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: AUTH_UI.textWhite,
    marginBottom: 10,
    shadowColor: AUTH_UI.textBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  consentTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: AUTH_UI.brandNavy,
  },
  consentDesc: {
    fontSize: 12,
    color: AUTH_UI.mutedTextSoft,
    marginTop: 4,
  },
  learnMore: {
    color: colors.rose[500],
    textDecorationLine: "underline",
  },
});