/**
 * mobile/app/(auth)/login.tsx
 * Clerk-powered login: email + password, then second factor (MFA) when required.
 * Web can show the full Clerk UI; this screen must call attemptSecondFactor on mobile.
 */

import { useClerk, useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, spacing, typography } from "@mamacare/ui";

import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { getErrorMessage, isClerkSessionExistsError } from "@/lib/errors";
import { goHomeAfterClerkSetActive } from "@/lib/goHomeAfterClerkSetActive";
import { resetClerkForSignIn } from "@/lib/resetClerkForSignIn";

type MfaKind = "totp" | "phone_code" | "backup_code";

function pickSecondFactor(
  supported: { strategy: string }[] | null | undefined
): MfaKind | null {
  if (!supported?.length) {
    return null;
  }
  if (supported.some((f) => f.strategy === "totp")) {
    return "totp";
  }
  if (supported.some((f) => f.strategy === "phone_code")) {
    return "phone_code";
  }
  if (supported.some((f) => f.strategy === "backup_code")) {
    return "backup_code";
  }
  return null;
}

/** Clerk sometimes returns needs_second_factor with an empty list on the create() result; the hook's signIn may be filled in first. */
function mergeSupportedSecondFactors(
  fromCreate: { strategy: string }[] | null | undefined,
  fromSignIn: { strategy: string }[] | null | undefined
): { strategy: string }[] {
  const a = fromCreate?.length ? fromCreate : null;
  const b = fromSignIn?.length ? fromSignIn : null;
  if (a?.length) {
    return a;
  }
  if (b?.length) {
    return b;
  }
  return fromCreate ?? fromSignIn ?? [];
}

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const clerk = useClerk();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaKind, setMfaKind] = useState<MfaKind | null>(null);
  const [mfaHint, setMfaHint] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  function resetMfa() {
    setMfaKind(null);
    setMfaHint("");
    setMfaCode("");
  }

  async function handleLogin() {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    try {
      await resetClerkForSignIn(clerk);
      let result: Awaited<ReturnType<typeof signIn.create>>;
      try {
        result = await signIn.create({ identifier: email, password });
      } catch (err) {
        if (isClerkSessionExistsError(err)) {
          await resetClerkForSignIn(clerk);
          result = await signIn.create({ identifier: email, password });
        } else {
          throw err;
        }
      }
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        goHomeAfterClerkSetActive(router);
        return;
      }

      if (result.status === "needs_second_factor") {
        const supported = mergeSupportedSecondFactors(
          result.supportedSecondFactors,
          signIn.supportedSecondFactors
        );
        let kind = pickSecondFactor(supported);
        if (!kind) {
          // MFA is required but Clerk returned an empty factor list on this response; default to TOTP.
          kind = "totp";
          setMfaHint("Enter the 6-digit code from your authenticator app.");
          setMfaKind(kind);
          return;
        }

        if (kind === "phone_code") {
          const phoneFactor = supported.find(
            (f) => f.strategy === "phone_code"
          ) as { phoneNumberId?: string } | undefined;
          await signIn.prepareSecondFactor({
            strategy: "phone_code",
            phoneNumberId: phoneFactor?.phoneNumberId,
          });
          setMfaHint("Enter the code sent to your phone.");
        } else if (kind === "totp") {
          setMfaHint("Enter the 6-digit code from your authenticator app.");
        } else {
          setMfaHint("Enter a backup code.");
        }

        setMfaKind(kind);
        return;
      }

      Alert.alert(
        "Additional step required",
        `Clerk status: ${result.status}. Complete any steps in the dashboard or on web, then try again.`
      );
    } catch (err: unknown) {
      Alert.alert("Login failed", getErrorMessage(err, "Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyMfa() {
    if (!isLoaded || !signIn || !mfaKind) return;
    const code = mfaCode.trim();
    if (!code) {
      Alert.alert("Code required", "Enter your verification code.");
      return;
    }
    setLoading(true);
    try {
      const r = await signIn.attemptSecondFactor(
        mfaKind === "totp"
          ? { strategy: "totp", code }
          : mfaKind === "phone_code"
            ? { strategy: "phone_code", code }
            : { strategy: "backup_code", code }
      );
      if (r.status === "complete" && r.createdSessionId) {
        await setActive({ session: r.createdSessionId });
        resetMfa();
        goHomeAfterClerkSetActive(router);
        return;
      }
      Alert.alert("Sign-in", `Still needs a step (status: ${r.status}).`);
    } catch (err: unknown) {
      Alert.alert("Verification failed", getErrorMessage(err, "Invalid code."));
    } finally {
      setLoading(false);
    }
  }

  if (mfaKind) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Two-step verification</Text>
        <Text style={styles.subtitle}>{mfaHint}</Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Verification code"
            placeholderTextColor={colors.gray[400]}
            value={mfaCode}
            onChangeText={setMfaCode}
            autoCapitalize="none"
            keyboardType="default"
            autoComplete="one-time-code"
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyMfa}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={resetMfa}>
            <Text style={styles.link}>Back to email and password</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={colors.gray[400]}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.gray[400]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <SocialSignInButtons afterAuthHref="/(tabs)/home" />
      </View>

      <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
        <Text style={styles.link}>Don&apos;t have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
  },
  title: {
    fontSize: typography.fontSize["3xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[700],
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    marginBottom: spacing[8],
  },
  form: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    backgroundColor: colors.gray[50],
  },
  button: {
    backgroundColor: colors.rose[500],
    borderRadius: 12,
    paddingVertical: spacing[4],
    alignItems: "center",
    marginTop: spacing[2],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  link: {
    textAlign: "center",
    color: colors.rose[500],
    fontSize: typography.fontSize.sm,
  },
});
