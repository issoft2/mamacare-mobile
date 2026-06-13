/**
 * app/tabs/home.tsx
 * * Main Dashboard screen mirroring the exact warm organic layout style.
 */

import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { WeeklyContentCard } from "@/components/home/WeeklyContentCard";

export default function HomeScreen() {
  // Mock tracking stats aligned with your view definitions
  const currentWaterCount = 2;
  const targetWaterCount = 8;
  const hydrationProgress = (currentWaterCount / targetWaterCount) * 100;

  return (
    <LinearGradient
      colors={["#FFFDF9", "#FFF5F0"]}
      style={styles.container}
    >
      {/* Sticky Top Header Bar emulation */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerMenuBtn}>
          <Text style={styles.menuIconText}>☰</Text>
        </TouchableOpacity>
        <View style={styles.logoWrapper}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>safeborn</Text>
        </View>
        <TouchableOpacity style={styles.headerMenuBtn}>
          <Text style={styles.menuIconText}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Empathetic Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.mainGreetingTitle}>Good morning, Sarah ✨</Text>
          <Text style={styles.greetingSubtext}>
            "Take a deep breath, mama. You are doing a beautiful job growing a tiny life today."
          </Text>
        </View>

        {/* Hero Segment: Injected Refined Layout */}
        <WeeklyContentCard week={16} />

        {/* Proactive Support Multi-Links */}
        <View style={styles.supportGrid}>
          <TouchableOpacity style={[styles.supportCard, { backgroundColor: "#F4EBE1", borderColor: "#E5D7CB" }]}>
            <Text style={styles.supportEmoji}>👩‍⚕️</Text>
            <Text style={styles.supportCardTitle}>Talk to an Expert</Text>
            <Text style={styles.supportCardSub}>Instant, gentle medical & emotional guidance.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.supportCard, { backgroundColor: "#FDF0EC", borderColor: "#F5D0C5" }]}>
            <Text style={styles.supportEmoji}>🫂</Text>
            <Text style={styles.supportCardTitle}>16-Week Circle</Text>
            <Text style={styles.supportCardSub}>Connect safely with mamas at your exact stage.</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Care Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>NOURISHING YOUR BODY</Text>
          
          <View style={styles.careGrid}>
            {/* Hydration Element */}
            <View style={styles.careCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.careCardLabel}>Hydration</Text>
                <Text style={styles.careCardEmoji}>💧</Text>
              </View>
              <Text style={styles.hydrationMetricText}>
                {currentWaterCount} / {targetWaterCount} <Text style={styles.hydrationUnitText}>Glasses</Text>
              </Text>
              {/* Progress Bar slider */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${hydrationProgress}%` }]} />
              </View>
              <TouchableOpacity style={styles.hydrationActionBtn}>
                <Text style={styles.hydrationActionText}>+ Add a glass</Text>
              </TouchableOpacity>
            </View>

            {/* Rituals Element */}
            <View style={styles.careCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.careCardLabel}>Daily Rituals</Text>
                <Text style={styles.careCardEmoji}>💊</Text>
              </View>
              <Text style={styles.ritualsSubText}>Folic Acid & Minerals</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Not taken today</Text>
              </View>
              <TouchableOpacity style={styles.ritualsActionBtn}>
                <Text style={styles.ritualsActionText}>Mark as Nourished</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Nesting Space Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>PREPARING THE NEST</Text>
          <TouchableOpacity style={styles.nestingRowCard}>
            <View style={styles.nestingEmojiWrapper}>
              <Text style={styles.nestingEmoji}>🧺</Text>
            </View>
            <View style={styles.nestingTextWrapper}>
              <Text style={styles.nestingTitle}>This Week's Nesting Project</Text>
              <Text style={styles.nestingDesc}>3 gentle ways to map out your nursery storage or organize gifts by size.</Text>
            </View>
            <Text style={styles.nestingArrow}>→</Text>
          </TouchableOpacity>
        </View>
        
        {/* Extra spacing padding for custom navigation bar depth */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  headerMenuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF0E5",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconText: {
    fontSize: 16,
    color: "#9C7A66",
  },
  logoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EAA383",
    opacity: 0.8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#5C4638",
    letterSpacing: 0.5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  greetingSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  mainGreetingTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3D2E24",
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 14,
    color: "#8A7365",
    fontStyle: "italic",
    lineHeight: 20,
  },
  supportGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  supportCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  supportEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  supportCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4A3B32",
    marginBottom: 2,
  },
  supportCardSub: {
    fontSize: 10,
    color: "#8A7365",
    lineHeight: 13,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5C4333",
    letterSpacing: 1,
    marginBottom: 12,
  },
  careGrid: {
    flexDirection: "row",
    gap: 16,
  },
  careCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F5E6DC",
    padding: 16,
    justifyContent: "space-between",
    minHeight: 170,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  careCardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5C4333",
  },
  careCardEmoji: {
    fontSize: 16,
  },
  hydrationMetricText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3D2E24",
  },
  hydrationUnitText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#8A7365",
  },
  progressBarBg: {
    height: 6,
    width: "100%",
    backgroundColor: "#FFF0E5",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 4,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: "#EAA383",
    borderRadius: 3,
  },
  hydrationActionBtn: {
    marginTop: 12,
    width: "100%",
    backgroundColor: "#FFF5EE",
    borderWidth: 1,
    borderColor: "#F7DFD0",
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  hydrationActionText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#CC7E5C",
  },
  ritualsSubText: {
    fontSize: 12,
    color: "#8A7365",
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#B45309",
  },
  ritualsActionBtn: {
    marginTop: 12,
    width: "100%",
    backgroundColor: "#EAA383",
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
    shadowColor: "#EAA383",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  ritualsActionText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  nestingRowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F5E6DC",
    padding: 16,
  },
  nestingEmojiWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FCF5F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  nestingEmoji: {
    fontSize: 20,
  },
  nestingTextWrapper: {
    flex: 1,
  },
  nestingTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4A3B32",
    marginBottom: 2,
  },
  nestingDesc: {
    fontSize: 11,
    color: "#8A7365",
    lineHeight: 14,
  },
  nestingArrow: {
    fontSize: 14,
    color: "#CC7E5C",
    fontWeight: "700",
    marginLeft: 8,
  },
});