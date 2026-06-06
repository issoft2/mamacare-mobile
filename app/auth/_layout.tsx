import { Stack } from "expo-router";
import { colors } from "@safeborn/ui";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.rose[50] },
        headerTintColor: colors.navy[700],
        headerBackTitle: "Back",
        headerShadowVisible: false,
      }}
    />
  );
}
