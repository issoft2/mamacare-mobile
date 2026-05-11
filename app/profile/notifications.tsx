/**
 * mobile/app/profile/notifications.tsx
 */

import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { apiRequest } from "@mamacare/api";
import { colors, spacing, typography } from "@mamacare/ui";

import { getErrorMessage } from "@/lib/errors";

const PREFERENCES = [
  { key: "kick_reminders",        label: "Kick Count Reminders",        description: "Daily reminder to count fetal movements" },
  { key: "hydration_reminders",   label: "Hydration Reminders",         description: "Reminders to drink water throughout the day" },
  { key: "appointment_reminders", label: "Appointment Reminders",       description: "Alerts before upcoming appointments" },
  { key: "weekly_updates",        label: "Weekly Pregnancy Updates",    description: "Weekly tips and information for your stage" },
  { key: "agent_action_alerts",   label: "Agent Action Alerts",         description: "Notifications when the AI triage pipeline takes action" },
  { key: "message_delivery_alerts", label: "Message Delivery Alerts",   description: "Confirmation when messages are sent to your care team" },
];

export default function NotificationsScreen() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    kick_reminders:         true,
    hydration_reminders:    true,
    appointment_reminders:  true,
    weekly_updates:         true,
    agent_action_alerts:    true,
    message_delivery_alerts: true,
  });
  const [saving, setSaving] = useState(false);

  async function handleToggle(key: string, value: boolean) {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    try {
      await apiRequest("/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err: unknown) {
      setPrefs(prefs); // revert on error
      Alert.alert("Could not save", getErrorMessage(err, "Update failed."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {saving && <ActivityIndicator size="small" color={colors.rose[500]} />}
      </View>

      {PREFERENCES.map((pref) => (
        <View key={pref.key} style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{pref.label}</Text>
            <Text style={styles.rowDescription}>{pref.description}</Text>
          </View>
          <Switch
            value={prefs[pref.key] ?? true}
            onValueChange={(val) => handleToggle(pref.key, val)}
            trackColor={{ false: colors.gray[300], true: colors.rose[300] }}
            thumbColor={prefs[pref.key] ? colors.rose[500] : colors.gray[400]}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.white },
  content:        { padding: spacing[6], maxWidth: 480, alignSelf: "center", width: "100%" },
  header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing[6] },
  title:          { fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.navy[700] },
  row:            { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  rowText:        { flex: 1, paddingRight: spacing[4] },
  rowLabel:       { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, color: colors.gray[800] },
  rowDescription: { fontSize: typography.fontSize.xs, color: colors.gray[400], marginTop: 2 },
});
