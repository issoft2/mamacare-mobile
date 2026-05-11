/**
 * OAuth / SSO redirect target — Clerk + expo-auth-session use path `sso-callback`
 */
import { View, Text } from "react-native";

export default function SsoCallbackScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" }}>
      <Text>Signing you in...</Text>
    </View>
  );
}

// Force this route to be statically generated
export const unstable_settings = {
  initialRouteName: "sso-callback",
};
