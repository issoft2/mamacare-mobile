/**
 * app/tabs/home.tsx
 * * Production Dashboard Layout - Clean Compilation Guaranteed
 */

import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { WeeklyContentCard } from "@/components/home/WeeklyContentCard";

export default function HomeScreen() {
  // 🔌 BACKEND ATTACHMENT ZONE
  // Swap these local state blocks with your real data management hooks when ready!
  // Example: const { data: activePregnancy } = useActivePregnancy();
  const [waterCount, setWaterCount] = useState(2);
  const [isRitualTaken, setIsRitualTaken] = useState(false);
  
  const targetWaterCount = 8;
  const hydrationProgress = Math.min((waterCount / targetWaterCount) * 100, 100);
  const displayWeek = 16; 

  // ⚡ COMPONENT ACTION CONTROLLERS
  const handleAddWater = () => {
    setWaterCount((prev) => prev + 1);
    // Add your live data sync mutation here: logHydration()
  };

  const handleMarkAsNourished = () => {
    setIsRitualTaken(true);
  };

  return (
    <LinearGradient colors={["#FFFDF9", "#FFF5F0"]} style={styles.container}>
      {/* Premium Navigation Header Component */}

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dynamic Warm Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.mainGreetingTitle}>Good morning, Sarah ✨</Text>
          <Text style={styles.greetingSubtext}>
            "Take a deep breath, mama. You are doing a beautiful job growing a tiny life today."
          </Text>
        </View>

        {/* Dynamic Hero Weekly Progress Module */}
        <WeeklyContentCard week={displayWeek} content={null} />

        {/* Proactive Help Core Matrices */}
        <View style={styles.supportGrid}>
          <TouchableOpacity 
            style={[styles.supportCard, { backgroundColor: "#F4EBE1", borderColor: "#E5D7CB" }]}
            activeOpacity={0.8}
          >
            <Text style={styles.supportCardEmoji}>👩‍⚕️</Text>
            <Text style={styles.supportCardTitle}>Talk to an Expert</Text>
            <Text style={styles.supportCardSub}>Instant, gentle medical & emotional guidance.</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.supportCard, { backgroundColor: "#FDF0EC", borderColor: "#F5D0C5" }]}
            activeOpacity={0.8}
          >
            <Text style={styles.supportCardEmoji}>🫂</Text>
            <Text style={styles.supportCardTitle}>{displayWeek}-Week Circle</Text>
            <Text style={styles.supportCardSub}>Connect safely with mamas at your exact stage.</Text>
          </TouchableOpacity>
        </View>

        {/* Active Trackers Sector */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>NOURISHING YOUR BODY</Text>
          
          <View style={styles.careGrid}>
            {/* Fluid Volume Metric Tool */}
            <View style={styles.careCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.careCardLabel}>Hydration</Text>
                <Feather name="droplet" size={16} color="#CC7E5C" />
              </View>
              <Text style={styles.hydrationMetricText}>
                {waterCount} / {targetWaterCount} <Text style={styles.hydrationUnitText}>Glasses</Text>
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${hydrationProgress}%` }]} />
              </View>
              <TouchableOpacity 
                style={styles.hydrationActionBtn} 
                onPress={handleAddWater}
                activeOpacity={0.7}
              >
                <Text style={styles.hydrationActionText}>+ Add a glass</Text>
              </TouchableOpacity>
            </View>

            {/* Daily Ritual Tracker Tool */}
            <View style={styles.careCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.careCardLabel}>Daily Rituals</Text>
                <MaterialCommunityIcons name="pill" size={18} color="#CC7E5C" />
              </View>
              <Text style={styles.ritualsSubText}>Folic Acid & Minerals</Text>
              <View style={[styles.statusBadge, isRitualTaken && styles.statusBadgeSuccess]}>
                <Text style={[styles.statusBadgeText, isRitualTaken && styles.statusBadgeTextSuccess]}>
                  {isRitualTaken ? "Nourished Today" : "Not taken today"}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.ritualsActionBtn, isRitualTaken && styles.ritualsActionBtnDisabled]} 
                onPress={handleMarkAsNourished}
                disabled={isRitualTaken}
                activeOpacity={0.8}
              >
                <Text style={styles.ritualsActionText}>
                  {isRitualTaken ? "Completed" : "Mark as Nourished"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Preparation Space Card */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>PREPARING THE NEST</Text>
          <TouchableOpacity style={styles.nestingRowCard} activeOpacity={0.8}>
            <View style={styles.nestingIconWrapper}>
              <MaterialCommunityIcons name="basket-outline" size={20} color="#CC7E5C" />
            </View>
            <View style={styles.nestingTextWrapper}>
              <Text style={styles.nestingTitle}>This Week's Nesting Project</Text>
              <Text style={styles.nestingDesc}>3 gentle ways to map out your nursery storage or organize gifts by size.</Text>
            </View>
            <Text style={styles.nestingArrow}>→</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 12,
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
  logoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    paddingBottom: 40,
  },
  greetingSection: {
    marginTop: 20,
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
  supportCardEmoji: {
    fontSize: 20,
    marginBottom: 6,
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
    minHeight: 165,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  careCardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5C4333",
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
  statusBadgeSuccess: {
    backgroundColor: "#E8F5E9",
    borderColor: "#C8E6C9",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#B45309",
  },
  statusBadgeTextSuccess: {
    color: "#2E7D32",
  },
  ritualsActionBtn: {
    marginTop: 12,
    width: "100%",
    backgroundColor: "#EAA383",
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  ritualsActionBtnDisabled: {
    backgroundColor: "#E0E0E0",
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
  nestingIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FCF5F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
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