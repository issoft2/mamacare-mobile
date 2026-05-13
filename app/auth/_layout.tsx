import { Stack } from "expo-router";
import { colors } from "@mamacare/ui";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy[700] },
        headerTintColor: colors.white,
        headerBackTitle: "Back",
      }}
    />
  );
}
