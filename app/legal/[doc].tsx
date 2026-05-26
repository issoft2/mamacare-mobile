import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { getActiveLegalContent, getActiveLegalDocument } from "@/lib/legal";

export default function LegalDocumentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ doc?: string; region?: string }>();

  const rawDocType = params.doc === "terms" ? "terms" : "privacy";
  const region = params.region === "uk" ? "uk" : "ng";

  const active = getActiveLegalDocument(rawDocType, region);
  const content = getActiveLegalContent(rawDocType, region);

  const title = rawDocType === "terms" ? "Terms of Service" : "Privacy Policy";

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.86}>
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {content.split("\n\n").map((block, idx) => (
          <Text key={`${idx}-${block.slice(0, 12)}`} style={styles.paragraph}>
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
