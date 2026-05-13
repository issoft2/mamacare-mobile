/**
 * Clerk SSO buttons (Google, Microsoft) via useSSO — works on iOS, Android, and web.
 * Enable providers in Clerk Dashboard → User & Authentication → Social connections.
 */

import { useSSO } from "@clerk/clerk-expo";
import { type Href, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, spacing, typography } from "@mamacare/ui";

import { getErrorMessage } from "@/lib/errors";
import { goHomeAfterClerkSetActive } from "@/lib/goHomeAfterClerkSetActive";

/** Clerk Dashboard → Social connections: Google + Microsoft (Azure). */
type SupportedOAuthStrategy = "oauth_google" | "oauth_microsoft";

export type SocialSignInButtonsProps = {
  /** Where to send the user after `setActive` (mirror email/password flows). */
  afterAuthHref?: Href;
};

export function SocialSignInButtons({
  afterAuthHref = "/tabs/home",
}: SocialSignInButtonsProps) {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [busy, setBusy] = useState<SupportedOAuthStrategy | null>(null);

  const run = useCallback(
    async (strategy: SupportedOAuthStrategy) => {
      try {
        setBusy(strategy);
        const { createdSessionId, setActive, authSessionResult } =
          await startSSOFlow({
            strategy,
          });

        if (
          authSessionResult?.type === "cancel" ||
          authSessionResult?.type === "dismiss"
        ) {
          return;
        }

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          goHomeAfterClerkSetActive(router, afterAuthHref);
          return;
        }

        Alert.alert(
          "Additional step required",
          "This account may need email verification or another sign-in method. Try signing in with email or finish setup on the web."
        );
      } catch (err: unknown) {
        Alert.alert(
          "Sign-in failed",
          getErrorMessage(err, "Please try again.")
        );
      } finally {
        setBusy(null);
      }
    },
    [afterAuthHref, router, startSSOFlow]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.btn, styles.google, busy !== null && styles.btnDisabled]}
        onPress={() => void run("oauth_google")}
        disabled={busy !== null}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
      >
        {busy === "oauth_google" ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.btnText}>Continue with Google</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.btn,
          styles.microsoft,
          busy !== null && styles.btnDisabled,
        ]}
        onPress={() => void run("oauth_microsoft")}
        disabled={busy !== null}
        accessibilityRole="button"
        accessibilityLabel="Continue with Microsoft"
      >
        {busy === "oauth_microsoft" ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.btnText}>Continue with Microsoft</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing[3],
    marginTop: spacing[2],
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[1],
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    marginHorizontal: spacing[3],
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  btn: {
    borderRadius: 12,
    paddingVertical: spacing[4],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  google: {
    backgroundColor: "#4285F4",
  },
  microsoft: {
    backgroundColor: "#2F2F2F",
  },
  btnText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
