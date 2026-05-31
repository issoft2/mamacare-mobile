/**
 * mobile/app/(tabs)/profile.tsx
 * Refined Profile Portal - High Depth ID Card
 */

import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { useProfile, useSubscription } from "@mumcare/api";
import { colors } from "@mumcare/ui";
import { signOutWithPushCleanup } from "@/lib/pushNotifications";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut, userId } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 980;
  const { data: profile } = useProfile();
  const { data: subscription } = useSubscription();

  const menuItems = [
    { label: "Personal Details", path: "/profile/edit", icon: "person" },
    { label: "Medical Details", path: "/profile/medical", icon: "medkit", meta: "High priority" },
    { label: "Care Team", path: "/profile/care-team", icon: "people" },
    { label: "Subscription", path: "/profile/subscription", icon: "star" },
    ...(!isWide
      ? [{ label: "Notifications", path: "/profile/notifications", icon: "notifications" }]
      : []),
  ];

  return (
    <View style={styles.screen}>
        <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.bgOverlay}>
          
          <ScrollView
            contentContainerStyle={[styles.content, isWide && styles.contentWide]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerArea}>
              <Text style={styles.screenTitle}>Your profile</Text>
              <Text style={styles.screenSubtitle}>Manage your care information and account settings.</Text>
            </View>

            <View style={[styles.profileGrid, isWide && styles.profileGridWide]}>
              <View style={[styles.profileCard, isWide && styles.profileCardWide]}>
                <LinearGradient colors={[AUTH_UI.textWhite, AUTH_UI.warmBackground]} style={styles.cardInner}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={34} color={AUTH_UI.linkBerry} />
                    </View>
                    <LinearGradient colors={[colors.rose[500], AUTH_UI.shadowRose]} style={styles.plusBadge}>
                      <Ionicons name="camera" size={12} color={AUTH_UI.textWhite} />
                    </LinearGradient>
                  </View>

                  <Text style={styles.name}>{profile?.first_name} {profile?.last_name}</Text>
                  <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>

                  <View style={styles.planBadge}>
                    <Ionicons name="ribbon" size={14} color={colors.rose[500]} />
                    <Text style={styles.planText}>{(subscription?.plan ?? "Free")} member</Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={[styles.menuContainer, isWide && styles.menuContainerWide]}>
                {menuItems.map((item) => (
                  <TouchableOpacity 
                    key={item.path} 
                    style={[styles.menuTile, isWide && styles.menuTileWide]} 
                    onPress={() => router.push(item.path as any)}
                  >
                    <View style={styles.tileLeft}>
                      <View style={styles.iconBox}>
                        <Ionicons name={item.icon as any} size={20} color={AUTH_UI.linkBerry} />
                      </View>
                      <View>
                        <Text style={styles.tileLabel}>{item.label}</Text>
                        {item.meta && <Text style={styles.tileMeta}>{item.meta}</Text>}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={AUTH_UI.semanticNeutral} />
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[
                    styles.menuTile,
                    styles.signOutTile,
                    isWide && styles.menuTileWide,
                  ]}
                  onPress={() => {
                    void signOutWithPushCleanup({ userId, signOut });
                  }}
                  activeOpacity={0.82}
                >
                  <View style={styles.tileLeft}>
                    <View style={[styles.iconBox, styles.signOutIconBox]}>
                      <Ionicons name="log-out-outline" size={20} color={AUTH_UI.danger} />
                    </View>
                    <View>
                      <Text style={[styles.tileLabel, styles.signOutLabel]}>
                        Sign out
                      </Text>
                      <Text style={styles.signOutMeta}>Leave this account</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={AUTH_UI.dangerSoftText} />
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </LinearGradient>
  
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_UI.cream },
  bgOverlay: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 52, paddingBottom: 40 },
  contentWide: { width: "100%", maxWidth: 1120, alignSelf: "center", paddingHorizontal: 32, paddingTop: 56, paddingBottom: 40 },
  headerArea: { marginBottom: 20 },
  screenTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: AUTH_UI.textHeading,
    fontFamily: FONT_WARM_SERIF,
    letterSpacing: -0.6,
  },
  screenSubtitle: {
    fontSize: 16,
    color: AUTH_UI.textBlack,
    lineHeight: 24,
    marginTop: 8,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  profileGrid: { gap: 0 },
  profileGridWide: { flexDirection: "row", alignItems: "flex-start", gap: 24 },
  profileCard: {
    borderRadius: AUTH_UI.cardRadius,
    backgroundColor: AUTH_UI.textWhite,
    elevation: 10,
    shadowColor: colors.rose[500],
    shadowOpacity: 0.12,
    shadowRadius: 14,
    marginBottom: 30,
    overflow: "hidden",
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
  },
  profileCardWide: { width: 340 },
  cardInner: { padding: 28, alignItems: "center" },
  avatarContainer: { position: "relative", marginBottom: 14 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: AUTH_UI.avatarRoseBg, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: AUTH_UI.textWhite },
  avatarText: { fontSize: 32, fontWeight: "800", color: AUTH_UI.linkBerry, fontFamily: FONT_FRIENDLY_SANS },
  plusBadge: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: AUTH_UI.textWhite },
  name: { fontSize: 24, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.4 },
  email: { fontSize: 14, color: AUTH_UI.textBlack, marginTop: 6, fontFamily: FONT_FRIENDLY_SANS },
  planBadge: { flexDirection: "row", alignItems: "center", backgroundColor: AUTH_UI.shadowRoseSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 15, gap: 5, borderWidth: 1, borderColor: colors.rose[200] },
  planText: { fontSize: 13, fontWeight: "700", color: AUTH_UI.linkBerry, fontFamily: FONT_FRIENDLY_SANS },
  menuContainer: { gap: 12 },
  menuContainerWide: { flex: 1, flexDirection: "row", flexWrap: "wrap" },
  menuTile: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    backgroundColor: AUTH_UI.textWhite,
    paddingHorizontal: AUTH_UI.fieldPaddingX,
    paddingVertical: AUTH_UI.fieldPaddingY,
    borderRadius: AUTH_UI.inputRadius,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
  },
  menuTileWide: { width: "48.5%", minHeight: 78 },
  tileLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: AUTH_UI.warmBackground, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.rose[200] },
  tileLabel: { fontSize: 16, fontWeight: "700", color: AUTH_UI.textHeading, fontFamily: FONT_FRIENDLY_SANS },
  tileMeta: { fontSize: 13, color: AUTH_UI.textBlack, fontWeight: "600", fontFamily: FONT_FRIENDLY_SANS },
  signOutTile: {
    backgroundColor: AUTH_UI.dangerSoft06,
    borderColor: AUTH_UI.dangerSoft14,
  },
  signOutIconBox: {
    backgroundColor: AUTH_UI.dangerSoft10,
  },
  signOutLabel: {
    color: AUTH_UI.danger,
  },
  signOutMeta: {
    fontSize: 13,
    color: AUTH_UI.dangerMutedText,
    fontWeight: "600",
    fontFamily: FONT_FRIENDLY_SANS,
  },
});
