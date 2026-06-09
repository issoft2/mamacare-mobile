/**
 * mobile/components/auth/SocialSignInButtons.tsx
 *
 * Brand-aligned social sign-in buttons for safeborn.
 *
 * Google brand fix:
 *  - Ionicons "logo-google" renders a single-colour G — off-brand.
 *  - Google's guidelines require the full multicolour logo.
 *  - Since we're in React Native (no SVG inline easily), we render
 *    the four Google brand colours as coloured squares forming the
 *    iconic 2×2 grid — clean, recognisable, guideline-safe.
 *  - Microsoft icon is toned to neutral slate so it does not compete
 *    with the app's warm palette on auth screens.
 *
 * Layout: side-by-side outlined white cards, consistent with the
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

const TEXT_BLACK = "#111111";
const LINK_BERRY = "#9A3E4D";
const FONT_FRIENDLY_SANS = Platform.select({ ios: "System", android: "Roboto", default: "sans-serif" });

type SupportedOAuthStrategy = "oauth_google" | "oauth_microsoft" | "oauth_apple";

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

// ── Component ─────────────────────────────────────────────────────────────────

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
          // eslint-disable-next-line no-console
          console.log("Social sign-in started:", strategy);
        }

        const { createdSessionId, setActive, authSessionResult } =
          await startSSOFlow({ strategy });

        if (typeof __DEV__ !== "undefined" && __DEV__) {
          // eslint-disable-next-line no-console
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

        // When the caller explicitly asks us to land on an onboarding screen
        // (e.g. /onboarding/profile-setup from the Register page) we must
        // ignore Clerk's `sessionTaskUrl` / `redirectUrl`. Those values point
        // at Clerk-hosted next-step pages and would skip our in-app
        // onboarding flow, leaving freshly-registered users stuck without a
        // profile.
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
            // eslint-disable-next-line no-console
            console.log("Social sign-in setActive completed for session:", createdSessionId);
          }
        } else if (typeof __DEV__ !== "undefined" && __DEV__) {
          // eslint-disable-next-line no-console
          console.warn("Social sign-in did not produce an active session.");
        }
      } catch (err) {
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          // eslint-disable-next-line no-console
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

        {/* Microsoft */}
        
        {/* Apple */}
        {Platform.OS === "ios" ? (
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
                <Ionicons name="logo-apple" size={20} color="#1F1A17" />
                <Text style={styles.socialBtnText}>Apple</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[4],
    gap: spacing[4],
  },

  // Divider
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

  // Social buttons — white outlined cards, side by side
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
    width: "48%",
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#D5D9E0",
    borderRadius: 16,
    minHeight: 50,
    paddingVertical: 16,
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
