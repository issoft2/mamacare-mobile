/**
 * mobile/app/profile/appointments.tsx
 */

import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useAppointments } from "@safeborn/api";
import { colors, spacing, shadows } from "@safeborn/ui";
import type { Appointment } from "@safeborn/types";
import { AUTH_UI, FONT_FRIENDLY_SANS, FONT_WARM_SERIF } from "@/lib/authUiTokens";

export default function AppointmentsScreen() {
  const router = useRouter();
  const { data: appointments, isLoading } = useAppointments();

  const upcomingAppointments = (appointments ?? [])
    .filter((item) => item.status === "scheduled")
    .filter((item) => new Date(item.scheduled_at) >= new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  function renderAppointment({ item }: { item: Appointment }) {
    const date = new Date(item.scheduled_at);
    return (
      <View style={styles.card}>
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
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 16, marginBottom: 4 }}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.replace('/tabs/home');
            } else {
              router.replace('/tabs/home');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ padding: 4, marginRight: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={AUTH_UI.linkBerry} />
        </TouchableOpacity>
        <Text style={styles.title}>Appointments</Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Upcoming visits</Text>
        <Text style={styles.heroSub}>Only future appointments are shown here, nearest first.</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/profile/appointments/new")}
          accessibilityRole="button"
          accessibilityLabel="Add appointment"
          activeOpacity={0.88}
        >
          <Ionicons name="add-circle-outline" size={16} color={AUTH_UI.textWhite} />
          <Text style={styles.addBtnText}>Add appointment</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.rose[400]} />
        </View>
      )}

      <FlatList
        data={upcomingAppointments}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointment}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No upcoming appointments yet.</Text>
            <Text style={styles.emptySub}>Set your next visit to keep your care plan on track.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: AUTH_UI.warmBackground },
  list:        { padding: spacing[4], gap: spacing[3] },
  title:       { fontSize: 30, fontWeight: "800", color: AUTH_UI.textHeading, marginBottom: spacing[4], fontFamily: FONT_WARM_SERIF, letterSpacing: -0.4 },
  heroCard:    {
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
    backgroundColor: AUTH_UI.textWhite,
    borderRadius: AUTH_UI.inputRadius,
    borderWidth: AUTH_UI.borderWidth,
    borderColor: colors.rose[200],
    padding: spacing[4],
    gap: spacing[2],
  },
  heroTitle:   { fontSize: 22, fontWeight: "800", color: AUTH_UI.textHeading, fontFamily: FONT_WARM_SERIF },
  heroSub:     { fontSize: 15, color: AUTH_UI.textBlack, lineHeight: 22, fontFamily: FONT_FRIENDLY_SANS },
  addBtn: {
    marginTop: spacing[1],
    alignSelf: "flex-start",
    backgroundColor: colors.rose[500],
    borderRadius: 999,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  addBtnText: { color: AUTH_UI.textWhite, fontWeight: "800", fontSize: 15, fontFamily: FONT_FRIENDLY_SANS },
  loadingWrap: { paddingVertical: spacing[3] },
  card:        { backgroundColor: colors.white, borderRadius: AUTH_UI.inputRadius, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200], padding: spacing[4], flexDirection: "row", gap: spacing[4], ...shadows.sm },
  cardLeft:    { alignItems: "center", justifyContent: "center", width: 48 },
  dateDay:     { fontSize: 28, fontWeight: "800", color: colors.rose[500], fontFamily: FONT_WARM_SERIF },
  dateMonth:   { fontSize: 12, color: AUTH_UI.textBlack, textTransform: "uppercase", fontFamily: FONT_FRIENDLY_SANS },
  cardRight:   { flex: 1, gap: spacing[1] },
  appointmentType: { fontSize: 17, fontWeight: "700", color: AUTH_UI.textHeading, fontFamily: FONT_FRIENDLY_SANS, textTransform: "capitalize" },
  appointmentTime: { fontSize: 14, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  location:    { fontSize: 14, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS },
  statusBadge: { alignSelf: "flex-start", backgroundColor: colors.gray[100], borderRadius: 8, paddingHorizontal: spacing[2], paddingVertical: 2, marginTop: spacing[1], borderWidth: 1, borderColor: AUTH_UI.semanticNeutralLine },
  statusCompleted: { backgroundColor: colors.sage[100] },
  statusText:  { fontSize: 12, fontWeight: "700", color: AUTH_UI.textBlack, textTransform: "capitalize", fontFamily: FONT_FRIENDLY_SANS },
  emptyWrap: { alignItems: "center", marginTop: spacing[12], paddingHorizontal: spacing[5] },
  emptyText:   { textAlign: "center", color: AUTH_UI.textBlack, fontWeight: "700", fontFamily: FONT_FRIENDLY_SANS },
  emptySub: { textAlign: "center", color: AUTH_UI.textBlack, marginTop: spacing[1], fontFamily: FONT_FRIENDLY_SANS },
});
