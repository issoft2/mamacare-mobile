/**
 * mobile/app/profile/appointments.tsx
 */

import { useRouter } from "expo-router";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppointments } from "@mamacare/api";
import { colors, spacing, typography, shadows } from "@mamacare/ui";
import type { Appointment } from "@mamacare/types";

export default function AppointmentsScreen() {
  const { data: appointments, isLoading } = useAppointments();

  function renderAppointment({ item }: { item: Appointment }) {
    const date = new Date(item.scheduled_at);
    const isPast = date < new Date();
    return (
      <View style={[styles.card, isPast && styles.cardPast]}>
        <View style={styles.cardLeft}>
          <Text style={styles.dateDay}>{date.getDate()}</Text>
          <Text style={styles.dateMonth}>{date.toLocaleString("en-GB", { month: "short" })}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.appointmentType}>{item.appointment_type}</Text>
          <Text style={styles.appointmentTime}>
            {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </Text>
          {item.location && <Text style={styles.location}>📍 {item.location}</Text>}
          <View style={[styles.statusBadge, item.status === "completed" && styles.statusCompleted]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointment}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Appointments</Text>}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No appointments scheduled.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.gray[50] },
  list:        { padding: spacing[4], gap: spacing[3] },
  title:       { fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.navy[700], marginBottom: spacing[4] },
  card:        { backgroundColor: colors.white, borderRadius: 16, padding: spacing[4], flexDirection: "row", gap: spacing[4], ...shadows.sm },
  cardPast:    { opacity: 0.6 },
  cardLeft:    { alignItems: "center", justifyContent: "center", width: 48 },
  dateDay:     { fontSize: typography.fontSize["2xl"], fontWeight: typography.fontWeight.bold, color: colors.rose[500] },
  dateMonth:   { fontSize: typography.fontSize.xs, color: colors.gray[500], textTransform: "uppercase" },
  cardRight:   { flex: 1, gap: spacing[1] },
  appointmentType: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.gray[900] },
  appointmentTime: { fontSize: typography.fontSize.sm, color: colors.gray[500] },
  location:    { fontSize: typography.fontSize.sm, color: colors.gray[500] },
  statusBadge: { alignSelf: "flex-start", backgroundColor: colors.gray[100], borderRadius: 6, paddingHorizontal: spacing[2], paddingVertical: 2, marginTop: spacing[1] },
  statusCompleted: { backgroundColor: colors.sage[100] },
  statusText:  { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.gray[600] },
  emptyText:   { textAlign: "center", color: colors.gray[400], marginTop: spacing[12] },
});
