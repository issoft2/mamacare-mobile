/**
 * mobile/components/auth/SocialSignInButtons.tsx
 *
 * Brand-aligned social sign-in buttons for safeborn.
 *
 * Brand Fixes:
 * - Google: Grid-based layout for strict guidelines.
 * - Microsoft: Toned to neutral slate.
 * - Facebook: Official blue brand token (#1877F2).
 * - Apple: Flat monochromatic dark slate (#000000) for a premium native look.
 *
 * Layout: Fluid wrapping outlined white cards, consistent with the
 * cream/rose design language of the rest of the auth flow.
 */

import { useSSO } from "@clerk/clerk-expo";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@safeborn/ui";
import { getErrorMessage } from "@/lib/errors";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import * as WebBrowser from "expo-web-browser";

const TEXT_BLACK = "#111111";
const LINK_BERRY = "#9A3E4D";
const FONT_FRIENDLY_SANS = Platform.select({ ios: "System", android: "Roboto", default: "sans-serif" });

type SupportedOAuthStrategy = "oauth_google" | "oauth_apple" | "oauth_facebook";

function normalizeClerkTarget(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      const path = `${url.pathname}${url.search}${url.hash}`;
      return path || null;
    } catch {
      return null;
    }
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

WebBrowser.maybeCompleteAuthSession();

export function SocialSignInButtons({
  afterAuthHref = "/tabs/home",
}: {
  afterAuthHref?: Href;
}) {
  const { width, fontScale } = useWindowDimensions();
  const stackButtons = width < 380 || fontScale >= 1.2;
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [busy, setBusy] = useState<SupportedOAuthStrategy | null>(null);

  const run = useCallback(
    async (strategy: SupportedOAuthStrategy) => {
      try {
        setBusy(strategy);
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.log("Social sign-in started:", strategy);
        }

        // 1. Build parameters dynamically 
        // We append a timestamp cache-burster to completely elimate 304 loop
        const ssoParams:  {strategy: SupportedOAuthStrategy; redirectUrl?: string} = { strategy }

        if (strategy === "oauth_facebook") {
          ssoParams.redirectUrl = "safeborn://sso-callback";
        }

        // 2. Pass 
        const { createdSessionId, setActive, authSessionResult } =
          await startSSOFlow(ssoParams);

        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.log("Social sign-in result:", {
            strategy,
            authSessionResultType: authSessionResult?.type ?? null,
            createdSessionId: createdSessionId ?? null,
          });
        }

        if (
          authSessionResult?.type === "cancel" ||
          authSessionResult?.type === "dismiss"
        )
          return;

        const afterAuthHrefStr =
          typeof afterAuthHref === "string" ? afterAuthHref : "";
        const forceAfterAuthHref = afterAuthHrefStr.startsWith("/onboarding");

        if (createdSessionId && setActive) {
          await setActive({
            session: createdSessionId,
            navigate: async (params) => {
              const session = params.session;
              const sessionTaskUrl = (params as { sessionTaskUrl?: string }).sessionTaskUrl;
              const redirectUrl = (params as { redirectUrl?: string }).redirectUrl;
              const target = forceAfterAuthHref
                ? (session ? afterAuthHref : "/auth/welcome")
                : (normalizeClerkTarget(sessionTaskUrl) ??
                   normalizeClerkTarget(redirectUrl) ??
                   (session ? afterAuthHref : "/auth/welcome"));
              router.replace(target as any);
            },
          });

          if (typeof __DEV__ !== "undefined" && __DEV__) {
            console.log("Social sign-in setActive completed for session:", createdSessionId);
          }
        } else if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.warn("Social sign-in did not produce an active session.");
        }
      } catch (err) {
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.warn("Social sign-in failed with raw error:", err);
        }
        Alert.alert("Sign-in failed", getErrorMessage(err, "Please try again."));
      } finally {
        setBusy(null);
      }
    },
    [afterAuthHref, router, startSSOFlow]
  );

  return (
    <View style={styles.container}>
      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Buttons */}
      <View style={[styles.buttonRow, stackButtons && styles.buttonRowStacked]}>

        {/* Google */}
        <TouchableOpacity
          style={[
            styles.socialBtn,
            stackButtons && styles.socialBtnStacked,
            busy === "oauth_google" && styles.btnBusy,
          ]}
          onPress={() => void run("oauth_google")}
          disabled={busy !== null}
          activeOpacity={0.8}
        >
          {busy === "oauth_google" ? (
            <ActivityIndicator color={colors.rose[400]} size="small" />
          ) : (
            <>
              <GoogleIcon size={20} />
              <Text style={styles.socialBtnText}>Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Facebook */}
        <TouchableOpacity
          style={[
            styles.socialBtn,
            stackButtons && styles.socialBtnStacked,
            busy === "oauth_facebook" && styles.btnBusy,
          ]}
          onPress={() => void run("oauth_facebook")}
          disabled={busy !== null}
          activeOpacity={0.8}
        >
          {busy === "oauth_facebook" ? (
            <ActivityIndicator color={colors.rose[400]} size="small" />
          ) : (
            <>
              <Ionicons name="logo-facebook" size={20} color="#1877F2" />
              <Text style={styles.socialBtnText}>Facebook</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Apple */}
        <TouchableOpacity
          style={[
            styles.socialBtn,
            stackButtons && styles.socialBtnStacked,
            busy === "oauth_apple" && styles.btnBusy,
          ]}
          onPress={() => void run("oauth_apple")}
          disabled={busy !== null}
          activeOpacity={0.8}
        >
          {busy === "oauth_apple" ? (
            <ActivityIndicator color={colors.rose[400]} size="small" />
          ) : (
            <>
              <Ionicons name="logo-apple" size={20} color="#000000" />
              <Text style={styles.socialBtnText}>Apple</Text>
            </>
          )}
        </TouchableOpacity>


      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[4],
    gap: spacing[4],
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingTop: spacing[1],
    paddingBottom: spacing[1],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.rose[100],
  },
  dividerText: {
    fontSize: 14,
    color: TEXT_BLACK,
    fontWeight: "500",
    letterSpacing: 0.2,
    fontFamily: FONT_FRIENDLY_SANS,
    paddingHorizontal: 2,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing[3],
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  buttonRowStacked: {
    flexDirection: "column",
  },
  socialBtn: {
    // Dynamic layout: side-by-side if there's space, else standard wrap
    flexGrow: 1,
    minWidth: "45%", 
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#D5D9E0",
    borderRadius: 16,
    minHeight: 50,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#BFC5D1",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  socialBtnStacked: {
    width: "100%",
  },
  socialBtnText: {
    color: LINK_BERRY,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  btnBusy: {
    opacity: 0.6,
  },
});