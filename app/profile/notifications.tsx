/**
 * mobile/app/profile/notifications.tsx
 *
 * Notification preferences screen.
 *
 * Designed with emotional UX principles for pregnant users:
 *  - Soft cream background reduces visual stress
 *  - Conversational, warm copy (not tech-speak)
 *  - Grouped into 3 clear sections: Daily care / Your care team / From your assistant
 *  - "Pause all" master toggle gives the user control on hard days
 *  - Inline status banners (no jarring native alerts)
 *  - Auto-save on toggle with revert on error
 *  - Fetches existing preferences so the screen reflects reality
 */

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { apiRequest } from "@mumcare/api";
import { colors, spacing, typography } from "@mumcare/ui";
import { getErrorMessage } from "@/lib/errors";

// ── Types ────────────────────────────────────────────────────────────────────

type PrefKey =
  | "kick_reminders"
  | "hydration_reminders"
  | "appointment_reminders"
  | "weekly_updates"
  | "agent_action_alerts"
  | "message_delivery_alerts";

type Preferences = Record<PrefKey, boolean>;

interface PrefItem {
  key: PrefKey;
  label: string;
  description: string;
}

interface PrefGroup {
  title: string;
  intro: string;
  items: PrefItem[];
}

// ── Configuration ────────────────────────────────────────────────────────────

const GROUPS: PrefGroup[] = [
  {
    title: "Daily care",
    intro: "Gentle reminders to help your day.",
    items: [
      {
        key: "kick_reminders",
        label: "Baby movement check-ins",
        description:
          "A daily nudge to count kicks, when your baby is most active.",
      },
      {
        key: "hydration_reminders",
        label: "Sips of water",
        description: "Small reminders to drink throughout the day.",
      },
    ],
  },
  {
    title: "Your care team",
    intro: "Updates about appointments and the people supporting you.",
    items: [
      {
        key: "appointment_reminders",
        label: "Upcoming appointments",
        description: "A heads-up before each visit, so nothing sneaks up.",
      },
      {
        key: "message_delivery_alerts",
        label: "When we reach your care team",
        description:
          "Quiet confirmation when a message is sent on your behalf.",
      },
    ],
  },
  {
    title: "From your assistant",
    intro: "Updates and check-ins from mumcare itself.",
    items: [
      {
        key: "weekly_updates",
        label: "Weekly pregnancy notes",
        description:
          "What's happening this week, written in plain language.",
      },
      {
        key: "agent_action_alerts",
        label: "When we step in to help",
        description:
          "If mumcare takes an action for you, we'll let you know.",
      },
    ],
  },
];

const ALL_KEYS: PrefKey[] = GROUPS.flatMap((g) => g.items.map((i) => i.key));

const DEFAULT_PREFS: Preferences = {
  kick_reminders: true,
  hydration_reminders: true,
  appointment_reminders: true,
  weekly_updates: true,
  agent_action_alerts: true,
  message_delivery_alerts: true,
};

const CREAM = "#FFF8F4";

// ── Component ────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();

  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Load existing preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest<Partial<Preferences>>(
          "/notifications/preferences",
          { method: "GET" }
        );
        // Merge with defaults so any new key is on by default
        setPrefs({ ...DEFAULT_PREFS, ...data });
      } catch (err) {
        // If the user has never set preferences, the API may 404.
        // Just keep defaults — first toggle will create them.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allMuted = ALL_KEYS.every((k) => !prefs[k]);

  async function persistChange(updates: Partial<Preferences>) {
    setError("");
    try {
      await apiRequest("/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Couldn't save right now."));
      return false;
    }
  }

  async function handleToggle(key: PrefKey, next: boolean) {
    const prev = prefs[key];
    const optimistic = { ...prefs, [key]: next };
    setPrefs(optimistic);
    setSavingKey(key);

    const ok = await persistChange({ [key]: next });

    setSavingKey(null);

    if (ok) {
      setSavedKey(key);
      setTimeout(() => {
        setSavedKey((current) => (current === key ? null : current));
      }, 1800);
    } else {
      // Revert the toggle on error
      setPrefs((cur) => ({ ...cur, [key]: prev }));
    }
  }

  async function handlePauseAll(pauseAll: boolean) {
    const next: Preferences = ALL_KEYS.reduce((acc, k) => {
      acc[k] = !pauseAll;
      return acc;
    }, {} as Preferences);

    const prev = prefs;
    setPrefs(next);
    setSavingKey("__all__");

    const ok = await persistChange(next);
    setSavingKey(null);

    if (ok) {
      setSavedKey("__all__");
      setTimeout(() => {
        setSavedKey((current) =>
          current === "__all__" ? null : current
        );
      }, 1800);
    } else {
      setPrefs(prev);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.rose[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/tabs/profile")}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.navy[700]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>How should we reach you?</Text>
        <Text style={styles.subtitle}>
          Turn things on or off any time. Your changes save as you go.
        </Text>

        {/* ── Status banners ── */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle"
              size={18}
              color="#A32D2D"
              style={{ marginRight: spacing[2] }}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {savingKey && !error ? (
          <View style={styles.savingBanner}>
            <ActivityIndicator
              size="small"
              color={colors.navy[500]}
              style={{ marginRight: spacing[2] }}
            />
            <Text style={styles.savingText}>Saving your preference…</Text>
          </View>
        ) : null}

        {savedKey && !savingKey && !error ? (
          <View style={styles.successBanner}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#1E7E34"
              style={{ marginRight: spacing[2] }}
            />
            <Text style={styles.successText}>Saved</Text>
          </View>
        ) : null}

        {/* ── Pause-all card ── */}
        <View style={styles.pauseCard}>
          <View style={styles.pauseRow}>
            <View style={{ flex: 1, paddingRight: spacing[3] }}>
              <Text style={styles.pauseTitle}>
                {allMuted ? "Everything's paused" : "Pause everything"}
              </Text>
              <Text style={styles.pauseHint}>
                {allMuted
                  ? "Turn this back off when you're ready."
                  : "Quiet all notifications for now. You can resume any time."}
              </Text>
            </View>
            <Switch
              value={allMuted}
              onValueChange={(v) => handlePauseAll(v)}
              trackColor={{ false: colors.rose[100], true: colors.rose[400] }}
              thumbColor={allMuted ? colors.rose[500] : colors.white}
              ios_backgroundColor={colors.rose[100]}
            />
          </View>
        </View>

        {/* ── Preference groups ── */}
        {GROUPS.map((group) => (
          <View key={group.title} style={styles.section}>
            <Text style={styles.sectionLabel}>{group.title}</Text>
            <Text style={styles.sectionHint}>{group.intro}</Text>

            <View style={styles.groupCard}>
              {group.items.map((item, idx) => (
                <View
                  key={item.key}
                  style={[
                    styles.row,
                    idx < group.items.length - 1 && styles.rowDivider,
                  ]}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={styles.rowDescription}>
                      {item.description}
                    </Text>
                  </View>
                  <Switch
                    value={prefs[item.key] ?? true}
                    onValueChange={(v) => handleToggle(item.key, v)}
                    trackColor={{
                      false: colors.rose[100],
                      true: colors.rose[400],
                    }}
                    thumbColor={
                      prefs[item.key] ? colors.rose[500] : colors.white
                    }
                    ios_backgroundColor={colors.rose[100]}
                    disabled={savingKey === item.key}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CREAM,
  },

  // Header
  header: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[2],
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
  },

  // Content
  content: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },

  // Titles
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.navy[700],
    marginBottom: spacing[2],
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.navy[500],
    marginBottom: spacing[5],
    lineHeight: typography.fontSize.base * 1.5,
  },

  // Banners (reused pattern from medical screen)
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCEBEB",
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  errorText: {
    flex: 1,
    color: "#A32D2D",
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  savingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.rose[100],
  },
  savingText: {
    color: colors.navy[600],
    fontSize: typography.fontSize.sm,
    fontStyle: "italic",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F4EA",
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  successText: {
    color: "#1E7E34",
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },

  // Pause-all card
  pauseCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rose[100],
    borderRadius: 16,
    padding: spacing[4],
    marginBottom: spacing[6],
  },
  pauseRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pauseTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy[700],
    marginBottom: 2,
  },
  pauseHint: {
    fontSize: typography.fontSize.xs,
    color: colors.navy[400],
    lineHeight: typography.fontSize.xs * 1.5,
  },

  // Sections
  section: {
    marginBottom: spacing[8],
  },
  sectionLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy[700],
    marginBottom: spacing[1],
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: typography.fontSize.sm,
    color: colors.navy[400],
    marginBottom: spacing[3],
    fontStyle: "italic",
    lineHeight: typography.fontSize.sm * 1.5,
  },

  // Group card
  groupCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rose[100],
    borderRadius: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.rose[50],
  },
  rowText: {
    flex: 1,
    paddingRight: spacing[4],
  },
  rowLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.navy[700],
    marginBottom: 2,
  },
  rowDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.navy[400],
    lineHeight: typography.fontSize.xs * 1.5,
  },
});
