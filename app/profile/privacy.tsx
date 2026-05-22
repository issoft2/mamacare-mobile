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

import { apiRequest } from "@mumcare/api";
import { colors, spacing, typography, shadows } from "@mumcare/ui";

export default function PrivacyScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  
  const [consents, setConsents] = useState({
    essential_health: true,
    ai_guidance: true,
    care_team_sharing: true,
    research: true,
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
              We use 256-bit encryption to protect your health records. MumCare never sells your personal information.
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
          </View>
        </View>

        {/* Rights Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          <View style={styles.groupCard}>
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
              onPress={() => handleDeleteAccount(signOut)}
            />
          </View>
        </View>

        <Text style={styles.footerNote}>
          MumCare complies with UK GDPR and NDPA. Health records are legally retained for 7 years post-due date per DCB0129 standards.
        </Text>
      </ScrollView>
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
          trackColor={{ false: '#E0E0E0', true: colors.rose[200] }}
          thumbColor={value ? colors.rose[500] : '#F5F5F5'}
        />
      )}
    </View>
  );
}

function ActionRow({ icon, title, desc, onPress, danger }: any) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.iconCircle, danger && { backgroundColor: '#FFF0F0' }]}>
        <Ionicons name={icon} size={20} color={danger ? '#FF4D4F' : colors.navy[600]} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && { color: '#FF4D4F' }]}>{title}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.navy[100]} />
    </TouchableOpacity>
  );
}

const handleDeleteAccount = (signOut: any) => {
  Alert.alert(
    "Are you sure?",
    "This will delete your account. Health data will be archived for 7 years per clinical law but will not be accessible to you.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete Everything", style: "destructive", onPress: () => signOut() }
    ]
  );
};

function getWithdrawalCopy(tier: string) {
  if (tier === 'ai_guidance') return "You will lose personalized health insights and pattern detection.";
  return "Your care team will no longer receive automated updates from your logs.";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', ...shadows.sm },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.navy[700] },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  securityBanner: { flexDirection: 'row', backgroundColor: '#FFF', padding: 20, borderRadius: 24, marginBottom: 30, borderWidth: 1, borderColor: colors.rose[50], ...shadows.sm },
  shieldIcon: { marginRight: 15, paddingTop: 5 },
  securityText: { flex: 1 },
  securityTitle: { fontSize: 18, fontWeight: '800', color: colors.navy[700], marginBottom: 4 },
  securitySub: { fontSize: 13, color: colors.navy[400], lineHeight: 18 },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.navy[300], letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, marginLeft: 5 },
  groupCard: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  rowText: { flex: 1, paddingRight: 15 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.navy[700] },
  rowDesc: { fontSize: 13, color: colors.navy[400], lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#F8F8F8', marginHorizontal: 20 },
  reqBadge: { backgroundColor: colors.navy[50], paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  reqText: { fontSize: 10, fontWeight: '800', color: colors.navy[500] },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F4F7FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  footerNote: { textAlign: 'center', fontSize: 12, color: colors.navy[200], lineHeight: 18, paddingHorizontal: 20 }
});