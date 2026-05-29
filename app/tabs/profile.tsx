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
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { useProfile, useSubscription } from "@mumcare/api";
import { signOutWithPushCleanup } from "@/lib/pushNotifications";

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
    { label: "Medical Details", path: "/profile/medical", icon: "medkit", meta: "High Priority" },
    { label: "Care Team", path: "/profile/care-team", icon: "people" },
    { label: "Subscription", path: "/profile/subscription", icon: "star" },
    ...(!isWide
      ? [{ label: "Notifications", path: "/profile/notifications", icon: "notifications" }]
      : []),
  ];

  return (
    <View style={styles.screen}>
        <LinearGradient colors={["rgba(255,251,247,0.92)", "rgba(255,244,239,0.68)"]} style={styles.bgOverlay}>
          
          <ScrollView
            contentContainerStyle={[styles.content, isWide && styles.contentWide]}
            showsVerticalScrollIndicator={false}
          >
            
            <View style={[styles.profileGrid, isWide && styles.profileGridWide]}>
              {/* High-Depth Profile Card */}
              <View style={[styles.profileCard, isWide && styles.profileCardWide]}>
                <LinearGradient colors={["#FFF", "#FFF5F5"]} style={styles.cardInner}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {profile?.first_name?.[0] ?? user?.firstName?.[0] ?? "M"}
                      </Text>
                    </View>
                    <LinearGradient colors={["#C97B6E", "#E7A693"]} style={styles.plusBadge}>
                      <Ionicons name="camera" size={12} color="#FFF" />
                    </LinearGradient>
                  </View>

                  <Text style={styles.name}>{profile?.first_name} {profile?.last_name}</Text>
                  <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>

                  <View style={styles.planBadge}>
                    <Ionicons name="ribbon" size={14} color="#E8697C" />
                    <Text style={styles.planText}>{subscription?.plan?.toUpperCase() ?? "FREE"} MEMBER</Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Glass Menu Tiles */}
              <View style={[styles.menuContainer, isWide && styles.menuContainerWide]}>
                {menuItems.map((item) => (
                  <TouchableOpacity 
                    key={item.path} 
                    style={[styles.menuTile, isWide && styles.menuTileWide]} 
                    onPress={() => router.push(item.path as any)}
                  >
                    <View style={styles.tileLeft}>
                      <View style={styles.iconBox}>
                        <Ionicons name={item.icon as any} size={20} color="#6D4A45" />
                      </View>
                      <View>
                        <Text style={styles.tileLabel}>{item.label}</Text>
                        {item.meta && <Text style={styles.tileMeta}>{item.meta}</Text>}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
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
                      <Ionicons name="log-out-outline" size={20} color="#FF5252" />
                    </View>
                    <View>
                      <Text style={[styles.tileLabel, styles.signOutLabel]}>
                        Sign out
                      </Text>
                      <Text style={styles.signOutMeta}>Leave this account</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#FFB4B4" />
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </LinearGradient>
  
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgImage: { flex: 1 },
  bgOverlay: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  contentWide: { width: "100%", maxWidth: 1120, alignSelf: "center", padding: 32 },
  profileGrid: { gap: 0 },
  profileGridWide: { flexDirection: "row", alignItems: "flex-start", gap: 24 },
  profileCard: {
    borderRadius: 30,
    backgroundColor: '#FFF',
    elevation: 15,
    shadowColor: '#C97B6E',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    marginBottom: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)'
  },
  profileCardWide: { width: 340 },
  cardInner: { padding: 30, alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFE4E8', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFF' },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#8E5A54' },
  plusBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },
  name: { fontSize: 22, fontWeight: '800', color: '#4D3B39' },
  email: { fontSize: 14, color: '#757575', marginTop: 4 },
  planBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(201,123,110,0.14)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 15, gap: 5 },
  planText: { fontSize: 11, fontWeight: '800', color: '#8E5A54', letterSpacing: 1 },
  menuContainer: { gap: 12 },
  menuContainerWide: { flex: 1, flexDirection: "row", flexWrap: "wrap" },
  menuTile: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: 'rgba(255,255,255,0.8)', 
    padding: 16, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)'
  },
  menuTileWide: { width: "48.5%", minHeight: 78 },
  tileLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  tileLabel: { fontSize: 16, fontWeight: '700', color: '#4D3B39' },
  tileMeta: { fontSize: 12, color: '#8E5A54', fontWeight: '600' },
  signOutTile: {
    backgroundColor: "rgba(255,82,82,0.06)",
    borderColor: "rgba(255,82,82,0.14)",
  },
  signOutIconBox: {
    backgroundColor: "rgba(255,82,82,0.1)",
  },
  signOutLabel: {
    color: "#FF5252",
  },
  signOutMeta: {
    fontSize: 12,
    color: "#C86A6A",
    fontWeight: "600",
  },
});
