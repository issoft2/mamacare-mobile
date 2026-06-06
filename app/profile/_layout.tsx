import { Stack } from "expo-router";
import { PregnancyProvider } from "@/lib/pregnancyState";

export default function ProfileLayout() {
  return (
    <PregnancyProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </PregnancyProvider>
  );
}
