/**
 * mobile/app/tabs/home.tsx
 * Home screen — gestational week summary, quick actions, upcoming appointment.
 */

import { useUser } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import {
  useAppointments,
  useHydrationLogs,
  useMoodLogs,
  useProfile,
  useSleepLogs,
  useSymptomPatterns,
} from "@mamacare/api";
import {
  MedicalDetailsCard,
  shouldShowMedicalDetailsPrompt,
} from "@/components/MedicalDetailsCard";

import { colors, spacing, typography, shadows } from "@mamacare/ui";

type CareIconName = "chat" | "symptoms" | "kicks" | "water" | "mood" | "sleep";
type Feeling = "steady" | "tired" | "anxious" | "hopeful";

const FEELINGS: { key: Feeling; label: string }[] = [
  { key: "steady", label: "Steady" },
  { key: "tired", label: "Tired" },
  { key: "anxious", label: "Anxious" },
  { key: "hopeful", label: "Hopeful" },
];

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatAppointmentDate(value?: string): string {
  if (!value) return "No appointment scheduled";
  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatMood(value?: string): string {
  if (!value) return "Not checked in";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatSleep(value?: string): string {
  if (!value) return "No sleep log yet";
  return value.replace(/_/g, " ");
}

function CareIcon({
  name,
  color = colors.rose[500],
  size = 26,
}: {
  name: CareIconName;
  color?: string;
  size?: number;
}) {
  const common = {
    stroke: color,
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === "chat" && (
        <Path
          d="M5 7.5C5 5.6 6.6 4 8.5 4h7C17.4 4 19 5.6 19 7.5v4.2c0 1.9-1.6 3.5-3.5 3.5h-3.2L8 19v-3.8C6.3 15 5 13.5 5 11.7V7.5z"
          {...common}
        />
      )}
      {name === "symptoms" && (
        <>
          <Path
            d="M12 19s-6-3.9-6-8c0-2.5 2.4-4.1 6-1 3.6-3.1 6-1.5 6 1 0 4.1-6 8-6 8z"
            fill={color}
            opacity={0.16}
          />
          <Path
            d="M12 19s-6-3.9-6-8c0-2.5 2.4-4.1 6-1 3.6-3.1 6-1.5 6 1 0 4.1-6 8-6 8z"
            {...common}
          />
        </>
      )}
      {name === "kicks" && (
        <>
          <Circle cx="12" cy="12" r="7" stroke={color} strokeWidth={2.4} opacity={0.22} />
          <Path d="M9 12.5c1.1 1.5 2.2 2.2 3.4 2.1 1.2-.1 2.1-.9 2.6-2.2" {...common} />
          <Path d="M10 9.5h.1M14 9.5h.1" {...common} />
        </>
      )}
      {name === "water" && (
        <Path
          d="M12 3.8s5.2 5.8 5.2 10a5.2 5.2 0 0 1-10.4 0c0-4.2 5.2-10 5.2-10z"
          {...common}
        />
      )}
      {name === "mood" && (
        <>
          <Circle cx="12" cy="12" r="7" {...common} />
          <Path d="M8.8 10h.1M15.1 10h.1M9 14c1.7 1.5 4.3 1.5 6 0" {...common} />
        </>
      )}
      {name === "sleep" && (
        <Path d="M16.5 15.5A6.5 6.5 0 0 1 8.5 7.5 7 7 0 1 0 16.5 15.5z" {...common} />
      )}
    </Svg>
  );
}

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [medicalPromptDismissed, setMedicalPromptDismissed] = useState(false);
  const { data: profile } = useProfile();
  const { data: patterns } = useSymptomPatterns();
  const { data: hydration } = useHydrationLogs();
  const { data: mood } = useMoodLogs();
  const { data: sleep } = useSleepLogs();
  const { data: appointments } = useAppointments();

  const firstName = profile?.first_name ?? user?.firstName ?? "mama";
  const week = profile?.gestational_week;
  const hasAlerts = patterns?.has_alerts ?? false;
  const showMedicalPrompt =
    !medicalPromptDismissed && shouldShowMedicalDetailsPrompt(profile);
  const greeting = getTimeBasedGreeting();
  const todayHydration = hydration?.[0];
  const glassesCount = todayHydration?.glasses_count ?? 0;
  const targetGlasses = todayHydration?.target_glasses ?? 8;
  const hydrationProgress = Math.min(100, (glassesCount / targetGlasses) * 100);
  const nextAppointment = useMemo(
    () =>
      appointments
        ?.filter((item) => item.status === "scheduled")
        .sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime()
        )[0],
    [appointments]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={[colors.rose[50], "#FFF8F4", colors.sage[50]]}
        locations={[0, 0.62, 1]}
        style={styles.hero}
      >
        <Text style={styles.eyebrow}>Today with MamaCare</Text>
        <Text style={styles.greetingText}>
          {greeting}, {firstName}
        </Text>
        <Text style={styles.weekText}>
          {week ? `You and baby are in week ${week}` : "Your pregnancy journey belongs here"}
        </Text>
        <Text style={styles.heroCopy}>
          One gentle step at a time today. We will keep the important things close.
        </Text>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => router.push("/tabs/chat")}
          accessibilityRole="button"
          accessibilityLabel="Ask MamaCare for guidance"
        >
          <CareIcon name="chat" color={colors.white} size={24} />
          <View style={styles.primaryActionText}>
            <Text style={styles.primaryActionLabel}>Ask MamaCare</Text>
            <Text style={styles.primaryActionMeta}>For worries, questions, or reassurance</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {showMedicalPrompt && profile ? (
        <MedicalDetailsCard
          profile={profile}
          onDismiss={() => setMedicalPromptDismissed(true)}
        />
      ) : null}

      {hasAlerts && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => router.push("/tabs/symptoms")}
          accessibilityRole="button"
          accessibilityLabel="Review symptom pattern"
        >
          <Text style={styles.alertTitle}>We noticed a symptom pattern</Text>
          <Text style={styles.alertText}>Let’s review it together when you’re ready.</Text>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          {feeling ? <Text style={styles.sectionMeta}>Noted for now</Text> : null}
        </View>
        <View style={styles.feelingRow}>
          {FEELINGS.map((item) => {
            const active = feeling === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.feelingChip, active && styles.feelingChipActive]}
                onPress={() => setFeeling(item.key)}
                accessibilityRole="button"
                accessibilityLabel={`Feeling ${item.label}`}
              >
                <Text style={[styles.feelingText, active && styles.feelingTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today’s care</Text>
        <View style={styles.careGrid}>
          <View style={styles.careCard}>
            <CareIcon name="water" color={colors.sage[500]} />
            <Text style={styles.careLabel}>Hydration</Text>
            <Text style={styles.careValue}>
              {glassesCount} / {targetGlasses} glasses
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${hydrationProgress}%` as any }]} />
            </View>
          </View>
          <View style={styles.careCard}>
            <CareIcon name="mood" color={colors.rose[500]} />
            <Text style={styles.careLabel}>Mood</Text>
            <Text style={styles.careValue}>{formatMood(mood?.[0]?.mood)}</Text>
          </View>
          <View style={styles.careCard}>
            <CareIcon name="sleep" color={colors.navy[500]} />
            <Text style={styles.careLabel}>Rest</Text>
            <Text style={styles.careValue}>{formatSleep(sleep?.[0]?.duration_band)}</Text>
          </View>
          <View style={styles.careCard}>
            <CareIcon name="symptoms" color={colors.rose[500]} />
            <Text style={styles.careLabel}>Next visit</Text>
            <Text style={styles.careValue}>
              {formatAppointmentDate(nextAppointment?.scheduled_at)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/tabs/symptoms")}
            accessibilityRole="button"
          >
            <View style={styles.actionIcon}>
              <CareIcon name="symptoms" color={colors.rose[600]} />
            </View>
            <Text style={styles.actionLabel}>Log symptoms</Text>
            <Text style={styles.actionMeta}>Tell us what changed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/tabs/tracker")}
            accessibilityRole="button"
          >
            <View style={[styles.actionIcon, styles.sageIcon]}>
              <CareIcon name="kicks" color={colors.sage[600]} />
            </View>
            <Text style={styles.actionLabel}>Count kicks</Text>
            <Text style={styles.actionMeta}>Notice baby’s movement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/tabs/tracker")}
            accessibilityRole="button"
          >
            <View style={[styles.actionIcon, styles.navyIcon]}>
              <CareIcon name="water" color={colors.navy[500]} />
            </View>
            <Text style={styles.actionLabel}>Log water</Text>
            <Text style={styles.actionMeta}>Keep hydration close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.rose[50] },
  content: { padding: spacing[4], gap: spacing[5], paddingBottom: spacing[8] },
  hero: {
    borderRadius: 20,
    padding: spacing[6],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.rose[100],
    ...shadows.sm,
  },
  eyebrow: {
    color: colors.rose[600],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  greetingText: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[700],
  },
  weekText: {
    fontSize: typography.fontSize.base,
    color: colors.navy[500],
    lineHeight: typography.fontSize.base * 1.45,
  },
  heroCopy: {
    color: colors.gray[600],
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.55,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: colors.rose[500],
    borderRadius: 16,
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[2],
    padding: spacing[4],
  },
  primaryActionText: {
    flex: 1,
  },
  primaryActionLabel: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  primaryActionMeta: {
    color: colors.rose[100],
    fontSize: typography.fontSize.xs,
    marginTop: spacing[1],
  },
  alertBanner: {
    backgroundColor: colors.white,
    borderColor: colors.rose[200],
    borderLeftColor: colors.rose[500],
    borderLeftWidth: 4,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing[4],
    ...shadows.sm,
  },
  alertTitle: {
    color: colors.navy[700],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  alertText: {
    color: colors.gray[600],
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  section: {
    gap: spacing[3],
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy[700],
  },
  sectionMeta: {
    color: colors.sage[600],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  feelingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  feelingChip: {
    backgroundColor: colors.white,
    borderColor: colors.rose[100],
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  feelingChipActive: {
    backgroundColor: colors.rose[500],
    borderColor: colors.rose[500],
  },
  feelingText: {
    color: colors.gray[700],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  feelingTextActive: {
    color: colors.white,
  },
  careGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  careCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray[100],
    borderRadius: 14,
    borderWidth: 1,
    gap: spacing[2],
    minHeight: 132,
    padding: spacing[4],
    width: "47.5%",
    ...shadows.sm,
  },
  careLabel: {
    color: colors.gray[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  careValue: {
    color: colors.navy[700],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.sm * 1.35,
    textTransform: "capitalize",
  },
  progressTrack: {
    backgroundColor: colors.sage[100],
    borderRadius: 999,
    height: 6,
    marginTop: "auto",
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.sage[500],
    borderRadius: 999,
    height: "100%",
  },
  quickActions: {
    gap: spacing[3],
  },
  actionCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.gray[100],
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[4],
    ...shadows.sm,
  },
  actionIcon: {
    alignItems: "center",
    backgroundColor: colors.rose[50],
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  sageIcon: {
    backgroundColor: colors.sage[50],
  },
  navyIcon: {
    backgroundColor: colors.navy[50],
  },
  actionLabel: {
    color: colors.navy[700],
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  actionMeta: {
    color: colors.gray[500],
    flex: 1.2,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.35,
  },
});
