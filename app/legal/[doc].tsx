import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";

import { getActiveLegalContent, getActiveLegalDocument } from "@/lib/legal";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

export default function LegalDocumentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    doc?: string;
    region?: string;
    from?: string;
    privacyReviewed?: string;
    termsReviewed?: string;
  }>();

  const rawDocType = params.doc === "terms" ? "terms" : "privacy";
  const region = params.region === "uk" ? "uk" : "ng";

  const active = getActiveLegalDocument(rawDocType, region);
  const content = getActiveLegalContent(rawDocType, region);

  const title = rawDocType === "terms" ? "Terms of Service" : "Privacy Policy";
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContent = content
    .split("\n\n")
    .filter((block) => block.toLowerCase().includes(searchQuery.toLowerCase()));

  const goBack = () => {
    if (params.from === "reconsent") {
      const privacyReviewed =
        rawDocType === "privacy" || params.privacyReviewed === "1" ? "1" : "0";
      const termsReviewed =
        rawDocType === "terms" || params.termsReviewed === "1" ? "1" : "0";

      router.replace(
        `/legal/reconsent?privacyReviewed=${privacyReviewed}&termsReviewed=${termsReviewed}` as any,
      );
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/tabs/home");
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.backBtn}
          activeOpacity={0.86}
        >
          <Ionicons name="chevron-back" size={24} color={AUTH_UI.textHeading} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Legal document</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>
            {active.region.toUpperCase()} · {active.version} · {active.language.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search document..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filteredContent.map((block, idx) => (
          <Text key={idx} style={styles.paragraph}>
            {block}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_UI.warmBackground },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 58,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AUTH_UI.textWhite,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: AUTH_UI.legalBorderSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 12, fontWeight: "700", color: AUTH_UI.textBlack, marginBottom: 4, fontFamily: FONT_FRIENDLY_SANS },
  title: { fontSize: 30, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF, letterSpacing: -0.5 },
  meta: { marginTop: 6, fontSize: 12, color: AUTH_UI.textBlack, fontWeight: "600", fontFamily: FONT_FRIENDLY_SANS },
  searchContainer: { paddingHorizontal: 20, marginBottom: 10 },
  searchBar: {
    height: 44,
    borderColor: AUTH_UI.mutedBorder18,
    borderWidth: AUTH_UI.borderWidth,
    borderRadius: AUTH_UI.inputRadius,
    paddingHorizontal: AUTH_UI.fieldPaddingX,
    marginBottom: 10,
    backgroundColor: AUTH_UI.overlayCard,
    color: AUTH_UI.textBlack,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  content: { paddingHorizontal: 20, paddingBottom: 34 },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: AUTH_UI.textBlack,
    marginBottom: 14,
    backgroundColor: AUTH_UI.overlayCard84,
    borderRadius: 14,
    padding: 14,
    fontFamily: FONT_FRIENDLY_SANS,
  },
});
