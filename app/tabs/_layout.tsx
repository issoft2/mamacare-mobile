/**
 * mobile/app/(tabs)/_layout.tsx
 * Floating Tab Bar with Soft Glow
 */

import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "@mamacare/ui";

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const common = { stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <View style={[styles.iconShell, focused && styles.iconShellActive]}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        {name === "home" && <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...common} />}
        {name === "chat" && <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...common} />}
        {name === "symptoms" && <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" {...common} />}
        {name === "tracker" && <Path d="M18 20V10M12 20V4M6 20v-6" {...common} />}
        {name === "profile" && <><Circle cx="12" cy="7" r="4" {...common} /><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" {...common} /></>}
      </Svg>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: "#E8697C",
      tabBarInactiveTintColor: "#9E9E9E",
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: styles.tabBar,
    }}>
      <Tabs.Screen name="home" options={{ tabBarIcon: (p) => <TabIcon name="home" {...p} /> }} />
      <Tabs.Screen name="symptoms" options={{ tabBarIcon: (p) => <TabIcon name="symptoms" {...p} /> }} />
      <Tabs.Screen name="chat" options={{ tabBarIcon: (p) => <TabIcon name="chat" {...p} /> }} />
      <Tabs.Screen name="tracker" options={{ tabBarIcon: (p) => <TabIcon name="tracker" {...p} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: (p) => <TabIcon name="profile" {...p} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute', bottom: 25, left: 20, right: 20,
    height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 0, elevation: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20,
  },
  iconShell: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 25 },
  iconShellActive: { backgroundColor: 'rgba(232,105,124,0.1)' }
});