/**
 * mobile/app/(tabs)/_layout.tsx
 *
 * Bottom tab navigation — native-feeling, anchored to screen edge.
 *
 * Key design decisions:
 *  - Tab bar is position:absolute, pinned flush to the bottom edge.
 *    Its white background fills behind the gesture bar — no floating gap.
 *  - sceneStyle.paddingBottom is set globally here so EVERY tab screen
 *    automatically clears the tab bar. No paddingBottom needed in any
 *    individual screen's ScrollView or FlatList.
 *  - Rounded top corners + elevation shadow for a native card feel.
 *  - Active state: soft rose pill background + small dot indicator.
 */

import { Tabs, usePathname, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Platform,
  StyleSheet,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { usePwaInstallPrompt } from "@/lib/usePwaInstallPrompt";
import { signOutWithPushCleanup } from "@/lib/pushNotifications";

// ── Constants ─────────────────────────────────────────────────────────────────

const TAB_BAR_BASE_HEIGHT = 60;
const SIDEBAR_WIDTH = 248;
const DRAWER_WIDTH = 292;
const MOBILE_HEADER_HEIGHT = 64;
const DESKTOP_BREAKPOINT = 900;
const ROSE = "#E8697C";
const BRAND_LOGO = require("../../assets/mumlogo.png");

// ── Tab icon ──────────────────────────────────────────────────────────────────

function TabIcon({
  name,
  color,
  focused,
}: {
  name: string;
  color: string;
  focused: boolean;
}) {
  const common = {
    stroke: color,
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <View style={[styles.iconShell, focused && styles.iconShellActive]}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        {name === "home" && (
          <Path
            d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            {...common}
          />
        )}
        {name === "chat" && (
          <Path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            {...common}
          />
        )}
        {name === "symptoms" && (
          <Path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            {...common}
          />
        )}
        {name === "tracker" && (
          <Path d="M18 20V10M12 20V4M6 20v-6" {...common} />
        )}
        {name === "profile" && (
          <>
            <Circle cx="12" cy="7" r="4" {...common} />
            <Path
              d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
              {...common}
            />
          </>
        )}
      </Svg>

      {/* Active dot below icon */}
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= DESKTOP_BREAKPOINT;

  // Full tab bar height including device bottom inset (gesture bar / home indicator)
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;
  const mobileHeaderHeight = MOBILE_HEADER_HEIGHT + insets.top;

  return (
    <Tabs
      tabBar={(props: any) => (
        <ResponsiveTabBar
          {...props}
          isDesktop={isDesktop}
          tabBarHeight={tabBarHeight}
          mobileHeaderHeight={mobileHeaderHeight}
          bottomInset={insets.bottom}
          topInset={insets.top}
        />
      )}
      screenOptions={{
        tabBarActiveTintColor: ROSE,
        tabBarInactiveTintColor: "#BDBDBD",
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,

        // ── Global scene padding ─────────────────────────────────
        // Applies to EVERY tab screen automatically.
        // Scrollable content will always end above the tab bar
        // without touching a single ScrollView or FlatList.
        sceneStyle: {
          paddingBottom: isDesktop ? 0 : tabBarHeight,
          paddingTop: isDesktop ? 0 : mobileHeaderHeight,
          marginLeft: isDesktop ? SIDEBAR_WIDTH : 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: (p) => <TabIcon name="home" {...p} />,
        }}
      />
      <Tabs.Screen
        name="symptoms"
        options={{
          title: "Symptoms",
          tabBarIcon: (p) => <TabIcon name="symptoms" {...p} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: (p) => <TabIcon name="chat" {...p} />,
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          title: "Tracker",
          tabBarIcon: (p) => <TabIcon name="tracker" {...p} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: (p) => <TabIcon name="profile" {...p} />,
        }}
      />
    </Tabs>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function ResponsiveTabBar({
  state,
  descriptors,
  navigation,
  isDesktop,
  tabBarHeight,
  mobileHeaderHeight,
  bottomInset,
  topInset,
}: any) {
  const install = usePwaInstallPrompt();
  const { signOut, userId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const privacyActive = pathname.startsWith("/profile/privacy");
  const notificationsActive = pathname.startsWith("/profile/notifications");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const items = state.routes.map((route: any, index: number) => {
    const focused = state.index === index;
    const options = descriptors[route.key]?.options ?? {};
    const label = options.title ?? route.name;
    const color = focused ? ROSE : isDesktop ? "#7B8498" : "#BDBDBD";

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
      setDrawerOpen(false);
    };

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        style={isDesktop ? styles.sidebarItem : styles.drawerItem}
        activeOpacity={0.82}
      >
        <TabIcon name={route.name} color={color} focused={focused} />
        <Text
          style={[
            isDesktop ? styles.sidebarLabel : styles.drawerLabel,
            focused && styles.activeLabel,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  });

  const quickItems = state.routes.map((route: any, index: number) => {
    const focused = state.index === index;
    const options = descriptors[route.key]?.options ?? {};
    const label = options.title ?? route.name;
    const color = focused ? ROSE : "#9AA2B4";

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        style={styles.quickNavItem}
        activeOpacity={0.82}
      >
        <TabIcon name={route.name} color={color} focused={focused} />
        <Text
          style={[styles.quickNavLabel, focused && styles.activeLabel]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  });

  if (isDesktop) {
    return (
      <View style={styles.sidebar}>
        <View>
          <View style={styles.sidebarBrand}>
            <View style={styles.brandMark}>
              <Image
                source={BRAND_LOGO}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.brandName}>MumCare</Text>
              <Text style={styles.brandSub}>Pregnancy care hub</Text>
            </View>
          </View>

          <View style={styles.sidebarNav}>{items}</View>

          <View style={styles.sidebarSubNav}>
            <TouchableOpacity
              style={styles.sidebarItem}
              onPress={() => router.push("/profile/notifications")}
              activeOpacity={0.82}
            >
              <View
                style={[
                  styles.sidebarExtraIcon,
                  notificationsActive && styles.sidebarExtraIconActive,
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={21}
                  color={notificationsActive ? ROSE : "#7B8498"}
                />
              </View>
              <Text
                style={[
                  styles.sidebarLabel,
                  notificationsActive && styles.activeLabel,
                ]}
              >
                Notifications
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sidebarItem}
              onPress={() => router.push("/profile/privacy")}
              activeOpacity={0.82}
            >
              <View
                style={[
                  styles.sidebarExtraIcon,
                  privacyActive && styles.sidebarExtraIconActive,
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={21}
                  color={privacyActive ? ROSE : "#7B8498"}
                />
              </View>
              <Text
                style={[styles.sidebarLabel, privacyActive && styles.activeLabel]}
              >
                Data & Privacy
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sidebarFooter}>
          {install.canPrompt && (
            <TouchableOpacity
              style={styles.installButton}
              onPress={install.promptInstall}
              activeOpacity={0.84}
            >
              <Text style={styles.installTitle}>Install app</Text>
              <Text style={styles.installHint}>Open MumCare like a mobile app</Text>
            </TouchableOpacity>
          )}
        
          <Text style={styles.sidebarFootnote}>Secure care, wherever you sign in.</Text>
        </View>
      </View>
    );
  }

  return (
    <View pointerEvents="box-none" style={styles.mobileNavLayer}>
      <View
        style={[
          styles.mobileHeader,
          { height: mobileHeaderHeight, paddingTop: topInset },
        ]}
      >
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setDrawerOpen(true)}
          activeOpacity={0.82}
        >
          <Ionicons name="menu" size={24} color="#1A237E" />
        </TouchableOpacity>
        <View style={styles.mobileBrand}>
          <View style={styles.mobileLogoPlate}>
            <Image source={BRAND_LOGO} style={styles.mobileLogo} resizeMode="cover" />
          </View>
          <Text style={styles.mobileBrandText}>MumCare</Text>
        </View>
      </View>

      {drawerOpen && (
        <View style={styles.drawerOverlay}>
          <Pressable
            style={styles.drawerBackdrop}
            onPress={() => setDrawerOpen(false)}
          />
          <View
            style={[
              styles.mobileDrawer,
              {
                paddingTop: topInset + 18,
                paddingBottom: bottomInset + 18,
              },
            ]}
          >
            <View style={styles.drawerHeader}>
              <View style={styles.brandMark}>
                <Image
                  source={BRAND_LOGO}
                  style={styles.brandLogo}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.drawerTitleWrap}>
                <Text style={styles.brandName}>MumCare</Text>
                <Text style={styles.brandSub}>Pregnancy care hub</Text>
              </View>
              <TouchableOpacity
                style={styles.drawerClose}
                onPress={() => setDrawerOpen(false)}
                activeOpacity={0.82}
              >
                <Ionicons name="close" size={22} color="#7B8498" />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerSubNav}>
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push("/profile/notifications");
                }}
                activeOpacity={0.82}
              >
                <View
                  style={[
                    styles.sidebarExtraIcon,
                    notificationsActive && styles.sidebarExtraIconActive,
                  ]}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={21}
                    color={notificationsActive ? ROSE : "#7B8498"}
                  />
                </View>
                <Text
                  style={[
                    styles.drawerLabel,
                    notificationsActive && styles.activeLabel,
                  ]}
                >
                  Notifications
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setDrawerOpen(false);
                  router.push("/profile/privacy");
                }}
                activeOpacity={0.82}
              >
                <View
                  style={[
                    styles.sidebarExtraIcon,
                    privacyActive && styles.sidebarExtraIconActive,
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={21}
                    color={privacyActive ? ROSE : "#7B8498"}
                  />
                </View>
                <Text
                  style={[styles.drawerLabel, privacyActive && styles.activeLabel]}
                >
                  Data & Privacy
                </Text>
              </TouchableOpacity>
              
            </View>
                <View style={styles.drawerNav}>
              {items}
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setDrawerOpen(false);
                  void signOutWithPushCleanup({ userId, signOut });
                }}
                activeOpacity={0.82}
              >
                <View style={styles.sidebarExtraIcon}>
                  <Ionicons name="log-out-outline" size={21} color="#FF5252" />
                </View>
                <Text style={[styles.drawerLabel, styles.drawerDangerLabel]}>
                  Sign out
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.drawerFooter}>
              {install.canPrompt && (
                <TouchableOpacity
                  style={styles.installButton}
                  onPress={() => {
                    setDrawerOpen(false);
                    void install.promptInstall();
                  }}
                  activeOpacity={0.84}
                >
                  <Text style={styles.installTitle}>Install app</Text>
                  <Text style={styles.installHint}>Open MumCare like a mobile app</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      <View
        style={[
          styles.quickNav,
          {
            height: tabBarHeight,
            paddingBottom: bottomInset > 0 ? bottomInset : 8,
          },
        ]}
      >
        {quickItems}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileNavLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },

  mobileHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1E4DE",
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(201,123,110,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  mobileBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 12,
  },

  mobileLogoPlate: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "rgba(140, 90, 82, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#6A4039",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },

  mobileLogo: {
    width: "100%",
    height: "100%",
  },

  mobileBrandText: {
    color: "#4D3B39",
    fontSize: 19,
    fontWeight: "800",
  },

  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },

  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(58, 35, 29, 0.25)",
  },

  mobileDrawer: {
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    justifyContent: "flex-start",
    shadowColor: "#6A4039",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 10, height: 0 },
    elevation: 20,
  },

  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 26,
  },

  drawerTitleWrap: {
    flex: 1,
  },

  drawerClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8EEE9",
  },

  drawerNav: {
    gap: 6,
  },

  drawerSubNav: {
    borderTopWidth: 1,
    borderTopColor: "#EEF1F6",
    marginTop: 10,
    paddingTop: 10,
    gap: 6,
  },

  drawerFooter: {
    marginTop: "auto",
    gap: 12,
  },

  drawerItem: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  drawerLabel: {
    flex: 1,
    color: "#6D4A45",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },

  drawerDangerLabel: {
    color: "#FF5252",
  },

  quickNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1E4DE",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 6,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },

  quickNavItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  quickNavLabel: {
    width: "100%",
    textAlign: "center",
    color: "#9A7F79",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
    paddingHorizontal: 1,
  },

  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#F1E4DE",
    padding: 22,
    justifyContent: "space-between",
    shadowColor: "#6A4039",
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 8, height: 0 },
  },

  sidebarBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 30,
  },

  brandMark: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(140, 90, 82, 0.2)",
    shadowColor: "#6A4039",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },

  brandLogo: {
    width: "100%",
    height: "100%",
  },

  brandName: {
    color: "#4D3B39",
    fontSize: 21,
    fontWeight: "800",
  },

  brandSub: {
    color: "#8E5A54",
    fontSize: 12,
    marginTop: 2,
  },

  sidebarNav: {
    gap: 6,
    marginBottom: 6,
  },

  sidebarSubNav: {
    borderTopWidth: 1,
    borderTopColor: "#F1E4DE",
    marginTop: 8,
    paddingTop: 8,
    gap: 6,
  },

  sidebarItem: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  sidebarLabel: {
    color: "#6D4A45",
    fontSize: 15,
    fontWeight: "700",
  },

  activeLabel: {
    color: ROSE,
  },

  sidebarExtraIcon: {
    width: 46,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },

  sidebarExtraIconActive: {
    backgroundColor: "rgba(232,105,124,0.12)",
  },

  sidebarFooter: {
    gap: 12,
  },

  installButton: {
    backgroundColor: "#1A237E",
    borderRadius: 16,
    padding: 14,
  },

  installTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },

  installHint: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 12,
    lineHeight: 16,
  },

  signOutButton: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,82,82,0.18)",
    backgroundColor: "rgba(255,82,82,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  signOutText: {
    color: "#FF5252",
    fontSize: 14,
    fontWeight: "800",
  },

  sidebarFootnote: {
    color: "#9AA2B4",
    fontSize: 12,
    lineHeight: 17,
  },

  iconShell: {
    width: 46,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },

  iconShellActive: {
    backgroundColor: "rgba(232,105,124,0.12)",
  },

  activeDot: {
    position: "absolute",
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ROSE,
  },
});
