/**
 * mobile/components/auth/SocialSignInButtons.tsx
 *
 * Brand-aligned social sign-in buttons for mumcare.
 *
 * Google brand fix:
 *  - Ionicons "logo-google" renders a single-colour G — off-brand.
 *  - Google's guidelines require the full multicolour logo.
 *  - Since we're in React Native (no SVG inline easily), we render
 *    the four Google brand colours as coloured squares forming the
 *    iconic 2×2 grid — clean, recognisable, guideline-safe.
 *  - Microsoft keeps its brand-blue icon — already correct.
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
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, shadows } from "@mumcare/ui";
import { getErrorMessage } from "@/lib/errors";
import { goHomeAfterClerkSetActive } from "@/lib/goHomeAfterClerkSetActive";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

type SupportedOAuthStrategy = "oauth_google" | "oauth_microsoft";

// ── Component ─────────────────────────────────────────────────────────────────

export function SocialSignInButtons({
  afterAuthHref = "/tabs/home",
}: {
  afterAuthHref?: Href;
}) {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [busy, setBusy] = useState<SupportedOAuthStrategy | null>(null);

  const run = useCallback(
    async (strategy: SupportedOAuthStrategy) => {
      try {
        setBusy(strategy);
        const { createdSessionId, setActive, authSessionResult } =
          await startSSOFlow({ strategy });

        if (
          authSessionResult?.type === "cancel" ||
          authSessionResult?.type === "dismiss"
        )
          return;

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          goHomeAfterClerkSetActive(router, afterAuthHref);
        }
      } catch (err) {
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
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>

        {/* Google */}
        <TouchableOpacity
          style={[styles.socialBtn, busy === "oauth_google" && styles.btnBusy]}
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
        <TouchableOpacity
          style={[styles.socialBtn, busy === "oauth_microsoft" && styles.btnBusy]}
          onPress={() => void run("oauth_microsoft")}
          disabled={busy !== null}
          activeOpacity={0.8}
        >
          {busy === "oauth_microsoft" ? (
            <ActivityIndicator color={colors.rose[400]} size="small" />
          ) : (
            <>
              <Ionicons name="logo-microsoft" size={20} color="#00A4EF" />
              <Text style={styles.socialBtnText}>Microsoft</Text>
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

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.rose[100],
  },
  dividerText: {
    fontSize: 12,
    color: colors.navy[300],
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Social buttons — white outlined cards, side by side
  buttonRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: colors.rose[100],
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: colors.rose[200],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  socialBtnText: {
    color: colors.navy[600],
    fontSize: 15,
    fontWeight: "600",
  },
  btnBusy: {
    opacity: 0.6,
  },
});
