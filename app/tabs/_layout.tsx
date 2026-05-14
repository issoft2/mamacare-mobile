/**
 * mobile/app/(tabs)/_layout.tsx
 * Main tab navigator — Home, Symptoms, Chat, Tracker, Profile.
 */

import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "@mamacare/ui";

type TabIconName = "home" | "symptoms" | "chat" | "tracker" | "profile";

function TabIcon({
  name,
  color,
  focused,
}: {
  name: TabIconName;
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
          <>
            <Path d="M4 10.8 12 4l8 6.8" {...common} />
            <Path d="M6.5 10.2V20h11V10.2" {...common} />
            <Path d="M9.5 20v-5h5v5" {...common} />
          </>
        )}
        {name === "symptoms" && (
          <>
            <Path
              d="M12 20s-6.5-4.2-6.5-8.8c0-2.7 2.6-4.4 6.5-1.1 3.9-3.3 6.5-1.6 6.5 1.1C18.5 15.8 12 20 12 20z"
              fill={focused ? color : "none"}
              opacity={focused ? 0.16 : 1}
            />
            <Path
              d="M12 20s-6.5-4.2-6.5-8.8c0-2.7 2.6-4.4 6.5-1.1 3.9-3.3 6.5-1.6 6.5 1.1C18.5 15.8 12 20 12 20z"
              {...common}
            />
          </>
        )}
        {name === "chat" && (
          <Path
            d="M5 7.5C5 5.6 6.6 4 8.5 4h7C17.4 4 19 5.6 19 7.5v4.2c0 1.9-1.6 3.5-3.5 3.5h-3.2L8 19v-3.8C6.3 15 5 13.5 5 11.7V7.5z"
            {...common}
          />
        )}
        {name === "tracker" && (
          <>
            <Path d="M5 19V5" {...common} />
            <Path d="M5 15.5h14" {...common} />
            <Path d="M8.5 12.5 11 9l2.4 3 2.1-5 2.3 5.5" {...common} />
          </>
        )}
        {name === "profile" && (
          <>
            <Circle cx="12" cy="8.5" r="3.5" {...common} />
            <Path d="M5.5 20c.8-3.2 3.1-5 6.5-5s5.7 1.8 6.5 5" {...common} />
          </>
        )}
      </Svg>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.rose[500],
        tabBarInactiveTintColor: colors.gray[500],
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.rose[100],
          borderTopWidth: 1,
          height: Platform.select({ ios: 88, android: 76, default: 76 }),
          paddingBottom: Platform.select({ ios: 24, android: 10, default: 10 }),
          paddingTop: 8,
          ...styles.tabBarShadow,
        },
        headerStyle: { backgroundColor: colors.rose[50] },
        headerTintColor: colors.navy[700],
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="symptoms"
        options={{
          title: "Symptoms",
          tabBarLabel: "Symptoms",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="symptoms" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarLabel: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chat" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          title: "Tracker",
          tabBarLabel: "Tracker",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="tracker" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="profile" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconShell: {
    alignItems: "center",
    borderRadius: 18,
    height: 34,
    justifyContent: "center",
    marginBottom: 2,
    width: 44,
  },
  iconShellActive: {
    backgroundColor: colors.rose[50],
  },
  tabBarShadow: {
    shadowColor: colors.rose[900],
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
});
