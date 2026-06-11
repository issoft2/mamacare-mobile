/**
 * mobile/app/history.tsx
 * Deeply Refined Pregnancy History Logs - Architectural Optimization
 */

import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { usePregnancyState } from "@/lib/pregnancyState";
import { useStartNewPregnancy } from "@safeborn/api";
import type { Pregnancy } from "@safeborn/types";
import { ctaGradientColors } from "../../components/styles/ctaButton";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";
import { resolveCurrentGestationalWeek } from "@/lib/gestationalWeek";

function formatDate(dateString?: string | null) {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PregnancyHistoryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const { activePregnancy, pregnancyHistory, isLoading, isError } = usePregnancyState();
  const startNewPregnancy = useStartNewPregnancy();

  // ✅ Single source of truth calculation for the current active week
  const dynamicCurrentWeek = useMemo(() => {
    if (!activePregnancy) return null;
    return resolveCurrentGestationalWeek(activePregnancy);
  }, [activePregnancy]);

  function handleStartNewPregnancy() {
    (async () => {
      try {
        await startNewPregnancy.mutateAsync();
        router.replace("/tabs/home");
      } catch (error) {
        Alert.alert(
          "Could not start a new pregnancy",
          error instanceof Error ? error.message : "Could not start a new pregnancy."
        );
      }
    })();
  }

  // ✅ Fixed Loop Bug: Safely pop screen from history stack instead of pushing forwards
  function handleGoBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/tabs/home");
  }

  // ✅ Fixed Shallow Mutation Bug: Deep-spread items securely to prevent component cache poisoning
  const sortedHistory = useMemo(() => {
    const history: Pregnancy[] = (pregnancyHistory ?? []).map((p) => ({ ...p }));
    const activeId = activePregnancy?.id;
    
    const targetHistory = activeId 
      ? history.filter((item) => item.id !== activeId)
      : history;

    return targetHistory.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  }, [pregnancyHistory, activePregnancy]);

  const emptyState = !isLoading && !isError && sortedHistory.length === 0 && !activePregnancy;
  const activeOnlyState = !isLoading && !isError && activePregnancy && sortedHistory.length === 0;

  return (
    <LinearGradient colors={[AUTH_UI.overlayStart, AUTH_UI.overlayEnd]} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.78}
          >
            <Ionicons name="arrow-back" size={20} color={AUTH_UI.linkBerry} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerArea}>
          <Text style={styles.screenTitle}>Pregnancy history</Text>
          <Text style={styles.screenSubtitle}>
            Track your active pregnancy and review any past journeys saved to your profile.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            {/* ✅ Color palette alignment: warm berry spinner instead of standard navy */}
            <ActivityIndicator size="large" color={AUTH_UI.linkBerry} />
          </View>
        ) : isError ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageTitle}>Something went wrong</Text>
            <Text style={styles.messageSubtitle}>We couldn’t load your pregnancy history right now.</Text>
          </View>
        ) : emptyState ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageTitle}>No pregnancy history yet</Text>
            <Text style={styles.messageSubtitle}>
              When you start a pregnancy, we’ll save your current journey here so you can look back anytime.
            </Text>
          </View>
        ) : (
          <View style={[styles.historyGrid, isWide && styles.historyGridWide]}>
            {activePregnancy && (
              <View style={[styles.historyCard, styles.activeCard]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>Current pregnancy</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{activePregnancy.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>{activePregnancy.baby_nickname ?? "Active journey"}</Text>
                <Text style={styles.cardMeta}>Due {formatDate(activePregnancy.estimated_due_date)}</Text>
                <Text style={styles.cardMeta}>Week {dynamicCurrentWeek ?? "—"}</Text>
              </View>
            )}

            {activeOnlyState && (
              <View style={styles.messageBox}>
                <Text style={styles.messageTitle}>Your current pregnancy is active</Text>
                <Text style={styles.messageSubtitle}>
                  Your active pregnancy is being tracked now. Any past pregnancies will appear here once your current journey ends or is archived.
                </Text>
              </View>
            )}

            {sortedHistory.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>
                    {item.status === "archived" 
                      ? "Archived pregnancy" 
                      : item.status === "completed" 
                      ? "Completed pregnancy" 
                      : "Pregnancy"}
                  </Text>
                  <View style={[
                    styles.statusBadge, 
                    item.status === "completed" && styles.completedBadge, 
                    item.status === "archived" && styles.archivedBadge
                  ]}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>{item.baby_nickname ?? "Milestone record"}</Text>
                <Text style={styles.cardMeta}>
                  {item.delivery_date 
                    ? `Delivered ${formatDate(item.delivery_date)}` 
                    : `Due ${formatDate(item.estimated_due_date)}`}
                </Text>
                <Text style={styles.cardMeta}>Created {formatDate(item.created_at)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.ctaSection}>
          {activePregnancy && (
            <View style={styles.messageBox}>
              <Text style={styles.messageTitle}>Complete or archive your current journey first</Text>
              <Text style={styles.messageSubtitle}>
                The "Start new journey" button will be available once you complete or archive your active pregnancy. This keeps your past data and chat history safe in your records.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.ctaButton,
              (startNewPregnancy.isPending || !!activePregnancy) && styles.ctaButtonDisabled,
            ]}
            onPress={handleStartNewPregnancy}
            activeOpacity={0.84}
            disabled={startNewPregnancy.isPending || !!activePregnancy}
          >
            <LinearGradient
              colors={ctaGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButtonGradient}
            >
              <Text style={styles.ctaLabel}>Start new journey</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_UI.cream },
  content: { paddingHorizontal: 24, paddingTop: 52, paddingBottom: 40, gap: 24 },
  contentWide: { width: "100%", maxWidth: 1120, alignSelf: "center", paddingHorizontal: 32 },
  headerArea: { gap: 10 },
  screenTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: AUTH_UI.textHeading,
    fontFamily: FONT_WARM_SERIF,
    letterSpacing: -0.6,
  },
  screenSubtitle: {
    fontSize: 16,
    color: AUTH_UI.textBlack,
    lineHeight: 24,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  loaderContainer: { minHeight: 220, alignItems: "center", justifyContent: "center" },
  messageBox: {
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: AUTH_UI.cardRadius,
    padding: 24,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: AUTH_UI.lineSoftWarm,
  },
  messageTitle: {
    color: AUTH_UI.textHeading,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: FONT_WARM_SERIF,
    marginBottom: 8,
  },
  messageSubtitle: {
    color: AUTH_UI.textBlack,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  historyGrid: { gap: 14 },
  historyGridWide: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  headerTop: { marginBottom: 12 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: AUTH_UI.borderWidth,
    borderColor: AUTH_UI.lineSoftWarm,
    backgroundColor: AUTH_UI.textWhite,
    elevation: 2,
    shadowColor: AUTH_UI.shadowRose,
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  historyCard: {
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: AUTH_UI.cardRadius,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: AUTH_UI.lineSoftWarm,
    padding: 20,
    gap: 10,
  },
  activeCard: {
    borderColor: AUTH_UI.semanticSevere,
    shadowColor: AUTH_UI.shadowRose,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: {
    color: AUTH_UI.textWarmStrong,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: FONT_FRIENDLY_SANS,
  },
  cardTitle: {
    color: AUTH_UI.textHeading,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: FONT_WARM_SERIF,
  },
  cardMeta: {
    color: AUTH_UI.textWarm,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AUTH_UI.semanticBlueSoft,
  },
  completedBadge: {
    backgroundColor: AUTH_UI.semanticNeutralSofter,
  },
  archivedBadge: {
    backgroundColor: AUTH_UI.semanticSevereBgSubtle,
  },
  statusText: {
    color: AUTH_UI.textWarmStrong,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    fontFamily: FONT_FRIENDLY_SANS,
  },
  ctaSection: { paddingVertical: 16 },
  ctaButton: {
    borderRadius: 18,
    overflow: "hidden",
    elevation: 6,
    shadowColor: AUTH_UI.shadowRose,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaButtonGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaButtonDisabled: { opacity: 0.45 },
  ctaLabel: {
    color: AUTH_UI.textWhite,
    fontSize: 16,
    fontWeight: "800",
    fontFamily: FONT_FRIENDLY_SANS,
  },
});