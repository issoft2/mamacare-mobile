/**
 * mobile/components/home/WeeklyContentCard.tsx
 * * Premium 1:1 Hero Card - 100% TypeScript Compliant
 */

import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { type WeeklyContent } from "@safeborn/api";

interface WeeklyContentCardProps {
  week?: number | null;
  content?: WeeklyContent | null;
}

const EMOTIONS = [
  { label: "Tired", iconProvider: "MaterialCommunityIcons" as const, iconName: "sleep" as const, color: "#8A7365" },
  { label: "Calm", iconProvider: "Feather" as const, iconName: "heart" as const, color: "#A3B899" },
  { label: "Anxious", iconProvider: "Feather" as const, iconName: "zap" as const, color: "#D9A05B" },
  { label: "Hopeful", iconProvider: "MaterialCommunityIcons" as const, iconName: "sparkles" as const, color: "#EAA383" },
];

export function WeeklyContentCard({ week, content }: WeeklyContentCardProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  const displayWeek = week ?? 16;
  const sizeLabel = content?.baby_size_label ?? "avocado";
  const sizeCm = content?.baby_size_cm ?? "11.6";
  
  // Universal elegant icon progression matching your native Expo glyph sets perfectly
  const babyIconName = useMemo(() => {
    if (displayWeek <= 8) return "sprout" as const;          // Early seed stages
    if (displayWeek <= 13) return "leaf" as const;           // 1st Trimester transition
    if (displayWeek <= 28) return "food-apple" as const;     // 2nd Trimester fruit milestones
    return "baby-carriage" as const;                         // 3rd Trimester nesting
  }, [displayWeek]);

  return (
    <LinearGradient
      colors={["#FFF0E6", "#FFE4D1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroCard}
    >
      <View style={styles.decorativeBlur} />

      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={styles.weekBadge}>
            <Text style={styles.weekBadgeText}>{displayWeek} Weeks</Text>
          </View>
          <Text style={styles.trimesterHeading}>
            {displayWeek <= 12 ? "1st Trimester" : displayWeek <= 26 ? "Cruising through your 2nd Trimester" : "Deep in your 3rd Trimester"}
          </Text>
        </View>
        
        <View style={styles.heroIconContainer}>
          <MaterialCommunityIcons name={babyIconName} size={28} color="#5C4333" />
        </View>
      </View>

      <View style={styles.sizeCalloutBox}>
        <Text style={styles.sizeCalloutText}>
          Your little one is the size of an <Text style={styles.boldText}>{sizeLabel} ({sizeCm} cm)</Text>. They can hear your voice now!
        </Text>
      </View>

      <View style={styles.emotionSection}>
        <Text style={styles.emotionTitle}>How is your heart feeling right now?</Text>
        <View style={styles.emotionGrid}>
          {EMOTIONS.map((item) => {
            const isSelected = selectedEmotion === item.label;
            return (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.8}
                style={[
                  styles.emotionButton,
                  isSelected && styles.emotionButtonActive,
                ]}
                onPress={() => setSelectedEmotion(item.label)}
              >
                <View style={styles.emotionButtonContent}>
                  {item.iconProvider === "Feather" ? (
                    <Feather 
                      name={item.iconName as any} 
                      size={13} 
                      color={isSelected ? "#CC7E5C" : item.color} 
                      style={styles.buttonInlineIcon}
                    />
                  ) : (
                    <MaterialCommunityIcons 
                      name={item.iconName as any} 
                      size={14} 
                      color={isSelected ? "#CC7E5C" : item.color} 
                      style={styles.buttonInlineIcon}
                    />
                  )}
                  <Text style={[styles.emotionButtonText, isSelected && styles.emotionButtonTextActive]}>
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FAD9C1",
    padding: 20,
    position: "relative",
    overflow: "hidden",
    marginBottom: 20,
  },
  decorativeBlur: {
    position: "absolute",
    right: -24,
    bottom: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFD3B4",
    opacity: 0.4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  topLeft: {
    flex: 1,
    paddingRight: 8,
  },
  weekBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAA383",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  weekBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  trimesterHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#5C4333",
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  sizeCalloutBox: {
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  sizeCalloutText: {
    fontSize: 12,
    color: "#7A6150",
    lineHeight: 17,
  },
  boldText: {
    fontWeight: "700",
    color: "#5C4333",
  },
  emotionSection: {
    borderTopWidth: 1,
    borderColor: "rgba(245, 205, 175, 0.7)",
    paddingTop: 16,
  },
  emotionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7A6150",
    textAlign: "center",
    marginBottom: 12,
  },
  emotionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  emotionButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  emotionButtonActive: {
    borderColor: "#EAA383",
    backgroundColor: "#FFFFFF",
  },
  emotionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonInlineIcon: {
    marginRight: 4,
  },
  emotionButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#5C4333",
  },
  emotionButtonTextActive: {
    color: "#CC7E5C",
  },
});