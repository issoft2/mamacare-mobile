import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { getActiveLegalDocument, getActiveLegalRoute } from "@/lib/legal";

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
      <Text style={styles.title}>We’ve Updated Our Terms</Text>
      <Text style={styles.description}>
        Our Privacy Policy and Terms of Service have been updated. Please review and accept the new terms to continue using the app.
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
          {loading ? "Updating..." : "Accept and Continue"}
        </Text>
      </TouchableOpacity>

      {!canAccept ? (
        <Text style={styles.helperText}>Please open both updated documents before continuing.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFF8F4",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A237E",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    marginBottom: 20,
  },
  reviewCard: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A237E",
    marginBottom: 8,
  },
  linkRow: {
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
  },
  linkText: {
    fontSize: 13,
    color: "#1A237E",
    fontWeight: "700",
    textDecorationLine: "underline",
    flex: 1,
    paddingRight: 10,
  },
  statusText: {
    fontSize: 12,
    color: "#E8697C",
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#E8697C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  helperText: {
    marginTop: 10,
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
  },
});