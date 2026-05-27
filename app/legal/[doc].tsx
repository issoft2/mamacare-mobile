import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";

import { getActiveLegalContent, getActiveLegalDocument } from "@/lib/legal";

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
          <Ionicons name="chevron-back" size={24} color="#1A237E" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>LEGAL DOCUMENT</Text>
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
  screen: { flex: 1, backgroundColor: "#FFF8F4" },
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
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: "800", color: "#E8697C", letterSpacing: 1.1, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "800", color: "#1A237E" },
  meta: { marginTop: 6, fontSize: 12, color: "#6E7890", fontWeight: "600" },
  searchContainer: { paddingHorizontal: 20, marginBottom: 10 },
  searchBar: {
    height: 40,
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  content: { paddingHorizontal: 20, paddingBottom: 34 },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: "#344054",
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: 14,
    padding: 14,
  },
});
