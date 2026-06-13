/**
 * mobile/components/home/WeeklyContentCard.tsx
 * * Exact 1:1 match of the premium HTML Hero Card specification.
 */

import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { type WeeklyContent } from "@safeborn/api";

interface WeeklyContentCardProps {
  week?: number | null;
  content?: WeeklyContent | null;
}

const EMOTIONS = [
  { label: "Tired", emoji: "🥺" },
  { label: "Calm", emoji: "🤍" },
  { label: "Anxious", emoji: "⚡" },
  { label: "Hopeful", emoji: "✨" },
];

export function WeeklyContentCard({ week, content }: WeeklyContentCardProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const router = useRouter();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  const displayWeek = week ?? 16;
  const sizeLabel = content?.baby_size_label ?? "avocado";
  const sizeCm = content?.baby_size_cm ?? "11.6";
  
  const trimesterText = useMemo(() => {
    if (displayWeek <= 12) return "1st Trimester";
    if (displayWeek <= 26) return "Cruising through your 2nd Trimester";
    return "Deep in your 3rd Trimester";
  }, [displayWeek]);

  return (
    <View style={styles.heroCard}>
      {/* Decorative background blur shape */}
      <View style={styles.decorativeBlur} />

      {/* Top Details Row */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={styles.weekBadge}>
            <Text style={styles.weekBadgeText}>{displayWeek} Weeks</Text>
          </View>
          <Text style={styles.trimesterHeading}>{trimesterText}</Text>
        </View>
        <Text style={styles.heroEmoji}>🥑</Text>
      </View>

      {/* Integrated Size Callout Box */}
      <View style={styles.sizeCalloutBox}>
        <Text style={styles.sizeCalloutText}>
          Your little one is the size of an <Text style={styles.boldText}>{sizeLabel} ({sizeCm} cm)</Text>. They can hear your voice now!
        </Text>
      </View>

      {/* Emotion Companionship Matrix */}
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
                <Text style={styles.emotionButtonText}>
                  {item.emoji} {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FAD9C1",
    backgroundColor: "#FFF0E6",
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
    fontFamily: "System", 
    fontSize: 18,
    fontWeight: "700",
    color: "#5C4333",
  },
  heroEmoji: {
    fontSize: 36,
  },
  sizeCalloutBox: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  sizeCalloutText: {
    fontSize: 12,
    color: "#7A6150",
    lineHeight: 16,
  },
  boldText: {
    fontWeight: "700",
  },
  emotionSection: {
    borderTopWidth: 1,
    borderColor: "#F5CDAF",
    paddingTop: 16,
  },
  emotionTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7A6150",
    textAlign: "center",
    marginBottom: 10,
  },
  emotionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  emotionButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    shadowColor: "#3D2E24",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emotionButtonActive: {
    borderColor: "#EAA383",
    backgroundColor: "#FFFFFF",
  },
  emotionButtonText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#5C4333",
  },
});