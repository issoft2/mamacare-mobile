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
import { useEffect, useState } from "react";
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
import { AUTH_UI } from "@/lib/authUiTokens";
import { PregnancyProvider, usePregnancyState } from "@/lib/pregnancyState";

// ── Constants ─────────────────────────────────────────────────────────────────

const TAB_BAR_BASE_HEIGHT = 60;
const SIDEBAR_WIDTH = 248;
const DRAWER_WIDTH = 292;
const MOBILE_HEADER_HEIGHT = 64;
const DESKTOP_BREAKPOINT = 900;
const ROSE = AUTH_UI.semanticSevere;
const BRAND_LOGO = require("../../assets/safebornlogo.png");
const NARROW_MOBILE_BREAKPOINT = 360;

// ── Tab icon ──────────────────────────────────────────────────────────────────

function TabIcon({
  name,
  color,
  focused,
  compact = false,
}: {
  name: string;
  color: string;
  focused: boolean;
  compact?: boolean;
}) {
  const common = {
    stroke: color,
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <View style={[styles.iconShell, compact && styles.iconShellCompact, focused && styles.iconShellActive]}>
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
      {focused && <View style={[styles.activeDot, compact && styles.activeDotCompact]} />}
    </View>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <PregnancyProvider>
      <TabsWithGuard />
    </PregnancyProvider>
  );
}

function TabsWithGuard() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { activePregnancy, isLoading: isPregnancyLoading, isError: isPregnancyError } = usePregnancyState();
  const isDesktop = Platform.OS === "web" && width >= DESKTOP_BREAKPOINT;

  // Full tab bar height including device bottom inset (gesture bar / home indicator)
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;
  const mobileHeaderHeight = MOBILE_HEADER_HEIGHT + insets.top;

  useEffect(() => {
    if (isPregnancyLoading || isPregnancyError) {
      return;
    }

    if (activePregnancy === null) {
      void router.replace("/onboarding/profile-setup");
    }
  }, [activePregnancy, isPregnancyError, isPregnancyLoading, router]);

  if (isPregnancyLoading) {
    return <View style={{ flex: 1, backgroundColor: AUTH_UI.cream }} />;
  }

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
        tabBarInactiveTintColor: AUTH_UI.semanticNeutral,
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
  const { width } = useWindowDimensions();
  const isNarrowMobile = width <= NARROW_MOBILE_BREAKPOINT;

  const items = state.routes.map((route: any, index: number) => {
    const focused = state.index === index;
    const options = descriptors[route.key]?.options ?? {};
    const label = options.title ?? route.name;
    const color = focused ? ROSE : isDesktop ? AUTH_UI.mutedText : AUTH_UI.semanticNeutral;

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
    const color = focused ? ROSE : AUTH_UI.mutedIcon;

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
        <TabIcon name={route.name} color={color} focused={focused} compact={isNarrowMobile} />
        <Text
          style={[
            styles.quickNavLabel,
            isNarrowMobile && styles.quickNavLabelCompact,
            focused && styles.activeLabel,
          ]}
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
              <Text style={styles.brandName}>safeborn</Text>
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
                  color={notificationsActive ? ROSE : AUTH_UI.mutedText}
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
                  color={privacyActive ? ROSE : AUTH_UI.mutedText}
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
              <Text style={styles.installHint}>Open safeborn like a mobile app</Text>
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
          <Ionicons name="menu" size={24} color={AUTH_UI.brandNavy} />
        </TouchableOpacity>
        <View style={styles.mobileBrand}>
          <View style={styles.mobileLogoPlate}>
            <Image source={BRAND_LOGO} style={styles.mobileLogo} resizeMode="cover" />
          </View>
          <Text style={styles.mobileBrandText}>safeborn</Text>
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
                <Text style={styles.brandName}>safeborn</Text>
                <Text style={styles.brandSub}>Pregnancy care hub</Text>
              </View>
              <TouchableOpacity
                style={styles.drawerClose}
                onPress={() => setDrawerOpen(false)}
                activeOpacity={0.82}
              >
                <Ionicons name="close" size={22} color={AUTH_UI.mutedText} />
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
                    color={notificationsActive ? ROSE : AUTH_UI.mutedText}
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
                    color={privacyActive ? ROSE : AUTH_UI.mutedText}
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
                  <Ionicons name="log-out-outline" size={21} color={AUTH_UI.danger} />
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
                  <Text style={styles.installHint}>Open safeborn like a mobile app</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      <View
        style={[
          styles.quickNav,
          isNarrowMobile && styles.quickNavCompact,
          {
            height: tabBarHeight,
            paddingBottom: bottomInset > 0 ? bottomInset : isNarrowMobile ? 6 : 8,
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
    backgroundColor: AUTH_UI.textWhite,
    borderBottomWidth: 1,
    borderBottomColor: AUTH_UI.lineSoftWarm,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: AUTH_UI.textBlack,
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
    backgroundColor: AUTH_UI.semanticSevereBg,
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
    backgroundColor: AUTH_UI.textWhite,
    borderWidth: 1.5,
    borderColor: AUTH_UI.mutedBorder20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: AUTH_UI.shadowBrown,
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
    color: AUTH_UI.textWarmStrong,
    fontSize: 19,
    fontWeight: "800",
  },

  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },

  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AUTH_UI.overlayDark25,
  },

  mobileDrawer: {
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: AUTH_UI.textWhite,
    paddingHorizontal: 18,
    justifyContent: "flex-start",
    shadowColor: AUTH_UI.shadowBrown,
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
    backgroundColor: AUTH_UI.surfaceTint,
  },

  drawerNav: {
    gap: 6,
  },

  drawerSubNav: {
    borderTopWidth: 1,
    borderTopColor: AUTH_UI.lineCoolAlt,
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
    color: AUTH_UI.textWarm,
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
    color: AUTH_UI.danger,
  },

  quickNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AUTH_UI.textWhite,
    borderTopWidth: 1,
    borderTopColor: AUTH_UI.lineSoftWarm,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 6,
    paddingHorizontal: 4,
    shadowColor: AUTH_UI.textBlack,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  quickNavCompact: {
    paddingTop: 4,
    paddingHorizontal: 2,
  },

  quickNavItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    rowGap: 1,
  },

  quickNavLabel: {
    width: "100%",
    textAlign: "center",
    color: AUTH_UI.textWarmMuted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 0,
    paddingHorizontal: 1,
  },
  quickNavLabelCompact: {
    fontSize: 9,
    marginTop: 0,
  },

  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: AUTH_UI.textWhite,
    borderRightWidth: 1,
    borderRightColor: AUTH_UI.lineSoftWarm,
    padding: 22,
    justifyContent: "space-between",
    shadowColor: AUTH_UI.shadowBrown,
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
    backgroundColor: AUTH_UI.textWhite,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: AUTH_UI.mutedBorder20,
    shadowColor: AUTH_UI.shadowBrown,
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
    color: AUTH_UI.textWarmStrong,
    fontSize: 21,
    fontWeight: "800",
  },

  brandSub: {
    color: AUTH_UI.shadowRose,
    fontSize: 12,
    marginTop: 2,
  },

  sidebarNav: {
    gap: 6,
    marginBottom: 6,
  },

  sidebarSubNav: {
    borderTopWidth: 1,
    borderTopColor: AUTH_UI.lineSoftWarm,
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
    color: AUTH_UI.textWarm,
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
    backgroundColor: AUTH_UI.semanticSevereBg,
  },

  sidebarFooter: {
    gap: 12,
  },

  installButton: {
    backgroundColor: AUTH_UI.brandNavy,
    borderRadius: 16,
    padding: 14,
  },

  installTitle: {
    color: AUTH_UI.textWhite,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },

  installHint: {
    color: AUTH_UI.overlayWhite76,
    fontSize: 12,
    lineHeight: 16,
  },

  signOutButton: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AUTH_UI.dangerSoft18,
    backgroundColor: AUTH_UI.dangerSoft06,
    alignItems: "center",
    justifyContent: "center",
  },

  signOutText: {
    color: AUTH_UI.danger,
    fontSize: 14,
    fontWeight: "800",
  },

  sidebarFootnote: {
    color: AUTH_UI.mutedIcon,
    fontSize: 12,
    lineHeight: 17,
  },

  iconShell: {
    width: 44,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  iconShellCompact: {
    width: 40,
    height: 28,
    borderRadius: 11,
  },

  iconShellActive: {
    backgroundColor: AUTH_UI.semanticSevereBg,
  },

  activeDot: {
    position: "absolute",
    bottom: 1,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: ROSE,
  },
  activeDotCompact: {
    bottom: 1,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
