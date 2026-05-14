/**
 * mobile/app/auth/register.tsx
 * Clerk-powered registration screen.
 */

import { useClerk, useSignUp } from "@clerk/clerk-expo";
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

import { AuthScreenShell } from "@/components/auth/AuthScreenShell";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { getErrorMessage, isClerkSessionExistsError } from "@/lib/errors";
import { resetClerkForSignIn } from "@/lib/resetClerkForSignIn";

export default function RegisterScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const clerk = useClerk();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!isLoaded) return;
    setLoading(true);
    try {
      await resetClerkForSignIn(clerk);
      try {
        await signUp.create({ emailAddress: email, password });
      } catch (err) {
        if (isClerkSessionExistsError(err)) {
          await resetClerkForSignIn(clerk);
          await signUp.create({ emailAddress: email, password });
        } else {
          throw err;
        }
      }
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: unknown) {
      Alert.alert(
        "Registration failed",
        getErrorMessage(err, "Please try again.")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/onboarding/profile-setup");
      }
    } catch (err: unknown) {
      Alert.alert(
        "Verification failed",
        getErrorMessage(err, "Invalid code.")
      );
    } finally {
      setLoading(false);
    }
  }

  if (pendingVerification) {
    return (
      <AuthScreenShell>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a verification code to {email}
        </Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Verification code"
            placeholderTextColor={colors.gray[400]}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoComplete="one-time-code"
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Verify Email</Text>
            )}
          </TouchableOpacity>
        </View>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Your pregnancy health companion awaits</Text>

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
          autoComplete="new-password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <SocialSignInButtons afterAuthHref="/onboarding/profile-setup" />
      </View>

      <TouchableOpacity onPress={() => router.push("/auth/login")}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
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
  buttonDisabled: { opacity: 0.6 },
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
