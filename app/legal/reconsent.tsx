import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getActiveLegalDocument, getActiveLegalRoute } from "@/lib/legal";
import { colors } from "@mumcare/ui";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

export default function ReconsentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ privacyReviewed?: string; termsReviewed?: string }>();
  const [loading, setLoading] = useState(false);
  const [reviewedPrivacy, setReviewedPrivacy] = useState(false);
  const [reviewedTerms, setReviewedTerms] = useState(false);

  const activePrivacy = getActiveLegalDocument("privacy");
  const activeTerms = getActiveLegalDocument("terms");

  useEffect(() => {
    if (params.privacyReviewed === "1") {
      setReviewedPrivacy(true);
    }
    if (params.termsReviewed === "1") {
      setReviewedTerms(true);
    }
  }, [params.privacyReviewed, params.termsReviewed]);

  const canAccept = reviewedPrivacy && reviewedTerms && !loading;

  const reviewProgressQuery = useMemo(() => {
    const privacyReviewed = reviewedPrivacy ? "1" : "0";
    const termsReviewed = reviewedTerms ? "1" : "0";
    return `privacyReviewed=${privacyReviewed}&termsReviewed=${termsReviewed}&from=reconsent`;
  }, [reviewedPrivacy, reviewedTerms]);

  const openPrivacy = () => {
    setReviewedPrivacy(true);
    router.push(`${getActiveLegalRoute("privacy")}&${reviewProgressQuery}` as any);
  };

  const openTerms = () => {
    setReviewedTerms(true);
    router.push(`${getActiveLegalRoute("terms")}&${reviewProgressQuery}` as any);
  };

  const handleAccept = async () => {
    if (!canAccept) {
      return;
    }
    setLoading(true);
    try {
      // Simulate API call to update consent version
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace("/tabs/home");
    } catch (error) {
      console.error("Failed to update consents:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]}
        style={styles.gradient}
      >
        <Text style={styles.title}>We updated our terms</Text>
        <Text style={styles.description}>
          Our Privacy Policy and Terms of Service have changed. Please review both documents to continue.
        </Text>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>Review updated documents</Text>

        <TouchableOpacity style={styles.linkRow} onPress={openPrivacy} activeOpacity={0.86}>
          <Text style={styles.linkText}>
            Privacy Policy ({activePrivacy.region.toUpperCase()} {activePrivacy.version})
          </Text>
          <Text style={styles.statusText}>{reviewedPrivacy ? "Reviewed" : "Open"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={openTerms} activeOpacity={0.86}>
          <Text style={styles.linkText}>
            Terms of Service ({activeTerms.region.toUpperCase()} {activeTerms.version})
          </Text>
          <Text style={styles.statusText}>{reviewedTerms ? "Reviewed" : "Open"}</Text>
        </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, !canAccept && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={!canAccept}
        >
          <Text style={styles.buttonText}>
            {loading ? "Updating..." : "Accept and continue"}
          </Text>
        </TouchableOpacity>

        {!canAccept ? (
          <Text style={styles.helperText}>Please open both updated documents before continuing.</Text>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_UI.warmBackground,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: AUTH_UI.textHeading,
    marginBottom: 10,
    textAlign: "center",
    fontFamily: FONT_WARM_SERIF,
  },
  description: {
    fontSize: 15,
    color: AUTH_UI.textBlack,
    textAlign: "center",
    marginBottom: 22,
    lineHeight: 22,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  reviewCard: {
    width: "100%",
    backgroundColor: AUTH_UI.overlayCard,
    borderRadius: AUTH_UI.cardRadius,
    padding: 16,
    marginBottom: 18,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: AUTH_UI.legalBorderSoft,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: AUTH_UI.textHeading,
    marginBottom: 8,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  linkRow: {
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: AUTH_UI.lineSubtle,
  },
  linkText: {
    fontSize: 13,
    color: AUTH_UI.linkBerry,
    fontWeight: "700",
    textDecorationLine: "underline",
    flex: 1,
    paddingRight: 10,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  statusText: {
    fontSize: 12,
    color: AUTH_UI.textBlack,
    fontWeight: "700",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  button: {
    backgroundColor: colors.rose[500],
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: AUTH_UI.textWhite,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  helperText: {
    marginTop: 10,
    fontSize: 12,
    color: AUTH_UI.textBlack,
    textAlign: "center",
    fontFamily: FONT_FRIENDLY_SANS,
  },
});