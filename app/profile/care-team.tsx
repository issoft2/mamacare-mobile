/**
 * mobile/app/profile/care-team.tsx
 * Refined Care Team - Professional Contact Cards
 */

import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ImageBackground,
  Linking
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useCareTeam } from "@mamacare/api";
import type { CareTeamMember } from "@mamacare/types";

export default function CareTeamScreen() {
  const router = useRouter();
  const { data: careTeam, isLoading } = useCareTeam();

  const handleCall = (phone?: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email?: string) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  function renderMember({ item }: { item: CareTeamMember }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.roleTag}>
              <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
            </View>
            {item.is_primary && (
              <LinearGradient 
                colors={["#E8697C", "#FFA07A"]} 
                start={{x:0, y:0}} end={{x:1, y:0}} 
                style={styles.primaryTag}
              >
                <Text style={styles.primaryText}>PRIMARY</Text>
              </LinearGradient>
            )}
          </View>
          <Ionicons name="ellipsis-horizontal" size={20} color="#BDBDBD" />
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{item.full_name}</Text>
          {item.practice_name && (
            <View style={styles.practiceRow}>
              <Ionicons name="business-outline" size={14} color="#757575" />
              <Text style={styles.practiceText}>{item.practice_name}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, !item.phone && styles.disabledBtn]} 
            onPress={() => handleCall(item.phone)}
            disabled={!item.phone}
          >
            <Ionicons name="call" size={18} color={item.phone ? "#1A237E" : "#BDBDBD"} />
            <Text style={[styles.actionBtnText, !item.phone && styles.disabledText]}>Call</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={[styles.actionBtn, !item.email && styles.disabledBtn]} 
            onPress={() => handleEmail(item.email)}
            disabled={!item.email}
          >
            <Ionicons name="mail" size={18} color={item.email ? "#1A237E" : "#BDBDBD"} />
            <Text style={[styles.actionBtnText, !item.email && styles.disabledText]}>Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ImageBackground source={require("@/assets/images/mamacare-home-bg.png")} style={styles.bgImage}>
        <LinearGradient colors={["rgba(255,255,255,0.7)", "rgba(240,244,255,0.5)"]} style={styles.bgOverlay}>
          
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#1A237E" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Your Care Team</Text>
          </View>

          <FlatList
            data={careTeam ?? []}
            keyExtractor={(item) => item.id}
            renderItem={renderMember}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              isLoading ? (
                <ActivityIndicator color="#E8697C" style={{ marginTop: 40 }} />
              ) : (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="shield-checkmark" size={40} color="#6B7BB8" />
                  </View>
                  <Text style={styles.emptyText}>No care team added yet</Text>
                  <Text style={styles.emptySubtext}>
                    Add your midwife, GP, or obstetrician so MamaCare can keep your records synced.
                  </Text>
                </View>
              )
            }
          />

          <TouchableOpacity 
            style={styles.floatingAddBtn} 
            onPress={() => router.push("/profile/care-team/new" as any)}
          >
            <LinearGradient colors={["#1A237E", "#3949AB"]} style={styles.addGradient}>
              <Ionicons name="add" size={24} color="#FFF" />
              <Text style={styles.addBtnText}>Add Member</Text>
            </LinearGradient>
          </TouchableOpacity>

        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgImage: { flex: 1 },
  bgOverlay: { flex: 1 },
  headerNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', elevation: 2, marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1A237E' },
  list: { padding: 20, paddingBottom: 120 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', gap: 8 },
  roleTag: { backgroundColor: '#F0F2F8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 10, fontWeight: '800', color: '#6B7BB8', letterSpacing: 0.5 },
  primaryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  primaryText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  body: { marginBottom: 20 },
  name: { fontSize: 18, fontWeight: '700', color: '#1A237E', marginBottom: 4 },
  practiceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  practiceText: { fontSize: 14, color: '#757575' },
  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 15 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnText: { fontWeight: '700', color: '#1A237E', fontSize: 14 },
  divider: { width: 1, height: 20, backgroundColor: '#F5F5F5' },
  disabledBtn: { opacity: 0.5 },
  disabledText: { color: '#BDBDBD' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 20, elevation: 2 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#1A237E', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#757575', textAlign: 'center', lineHeight: 20 },
  floatingAddBtn: { position: 'absolute', bottom: 30, left: 20, right: 20, borderRadius: 20, overflow: 'hidden', elevation: 10 },
  addGradient: { paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  addBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});