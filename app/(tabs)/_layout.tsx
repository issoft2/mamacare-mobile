/**
 * mobile/app/(tabs)/_layout.tsx
 * Main tab navigator — Home, Symptoms, Chat, Tracker, Profile.
 */

import { Tabs } from "expo-router";
import { colors } from "@mamacare/ui";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.rose[500],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[200],
        },
        headerStyle: { backgroundColor: colors.navy[700] },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home", tabBarLabel: "Home" }}
      />
      <Tabs.Screen
        name="symptoms"
        options={{ title: "Symptoms", tabBarLabel: "Symptoms" }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: "Chat", tabBarLabel: "Chat" }}
      />
      <Tabs.Screen
        name="tracker"
        options={{ title: "Tracker", tabBarLabel: "Tracker" }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarLabel: "Profile" }}
      />
    </Tabs>
  );
}
