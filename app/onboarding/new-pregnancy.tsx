import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useStartNewPregnancy } from "@mumcare/api";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

export default function NewPregnancyScreen() {
  const router = useRouter();
  const startNewPregnancy = useStartNewPregnancy();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleStartPregnancy() {
    setIsSubmitting(true);
    try {
      await startNewPregnancy.mutateAsync();
      router.replace("/tabs/home");
    } catch (error) {
      Alert.alert(
        "Could not start a new pregnancy",
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.iconShell}>
            <Ionicons name="calendar" size={32} color={AUTH_UI.textWhite} />
          </View>
          <Text style={styles.title}>Welcome to your new pregnancy journey</Text>
          <Text style={styles.subtitle}>
            We’ll create a fresh pregnancy record for your current stage and keep your existing care notes accessible in your profile history.
          </Text>
        </View>

        <View style={styles.copyBlock}>
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle" size={20} color={AUTH_UI.semanticBlue} />
            <Text style={styles.detailText}>Your previous data remains saved under profile history.</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle" size={20} color={AUTH_UI.semanticBlue} />
            <Text style={styles.detailText}>You can track symptoms, chat, and appointments for this pregnancy.</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle" size={20} color={AUTH_UI.semanticBlue} />
            <Text style={styles.detailText}>You can always come back to pregnancy history later.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.ctaButton, isSubmitting && styles.ctaButtonDisabled]}
            onPress={handleStartPregnancy}
            activeOpacity={0.84}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={AUTH_UI.textWhite} />
            ) : (
              <Text style={styles.ctaLabel}>Start pregnancy</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace("/tabs/home")}
            activeOpacity={0.84}
          >
            <Text style={styles.secondaryLabel}>Not ready yet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 70 : 52,
    paddingHorizontal: 24,
    backgroundColor: AUTH_UI.warmBackground,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 40,
  },
  hero: {
    gap: 22,
  },
  iconShell: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AUTH_UI.semanticBlue,
    shadowColor: AUTH_UI.shadowNavy,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 40,
    color: AUTH_UI.textHeading,
    fontFamily: FONT_WARM_SERIF,
  },
  subtitle: {
    fontSize: 16,
    color: AUTH_UI.textBlack,
    lineHeight: 24,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  copyBlock: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  detailText: {
    flex: 1,
    color: AUTH_UI.textBlack,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  footer: {
    gap: 14,
  },
  ctaButton: {
    backgroundColor: AUTH_UI.brandNavy,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaLabel: {
    color: AUTH_UI.textWhite,
    fontSize: 16,
    fontWeight: "800",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 18,
  },
  secondaryLabel: {
    color: AUTH_UI.textWarmStrong,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FONT_FRIENDLY_SANS,
  },
});
