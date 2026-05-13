import { Stack } from "expo-router";
import { colors } from "@mamacare/ui";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy[700] },
        headerTintColor: colors.white,
        headerTitle: "Setup",
        headerBackVisible: false,
      }}
    />
  );
}
