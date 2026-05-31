/**
 * OAuth / SSO redirect target — Clerk + expo-auth-session use path `sso-callback`
 */
import { View, Text } from "react-native";
import { AUTH_UI, FONT_FRIENDLY_SANS } from "@/lib/authUiTokens";

export default function SsoCallbackScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: AUTH_UI.warmBackground, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS }}>Signing you in...</Text>
    </View>
  );
}

// Force this route to be statically generated
export const unstable_settings = {
  initialRouteName: "sso-callback",
};
