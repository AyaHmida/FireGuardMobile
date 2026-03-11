import Slider from "@react-native-community/slider";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Card from "../components/Card";
import Toggle from "../components/Toggle";
import { useAuth } from "../context/Authcontext";
import { Colors } from "../theme/colors";

export const ProfileScreen = ({ onBack, onLogout, onFamily }) => {
  const { user, logout } = useAuth();

  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [tempThresh, setTempThresh] = useState(40);
  const [gasThresh, setGasThresh] = useState(300);

  const handleLogout = async () => {
    await logout();
    onLogout && onLogout();
  };

  const initials = user
    ? `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`
    : "?";

  const fullName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "Utilisateur";

  // ✅ Vérifie role sans case-sensitive
  const isOccupant = user?.role?.toLowerCase() === "occupant";

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.emailText}>{user?.email ?? ""}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role === "Admin" ? "🛡️ Administrateur" : "🏠 Occupant"}
            </Text>
          </View>
          <View
            style={[
              styles.activeBadge,
              {
                backgroundColor: user?.isActive
                  ? Colors.safeDim
                  : Colors.dangerDim,
              },
            ]}
          >
            <Text
              style={[
                styles.activeText,
                { color: user?.isActive ? Colors.safe : Colors.danger },
              ]}
            >
              {user?.isActive
                ? "✅ Compte actif"
                : "⏳ En attente de validation"}
            </Text>
          </View>
        </View>

        {/* ── Notifications ── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <Card style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
            {/* Toggle dans View = ok, pas de TouchableOpacity imbriqué */}
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowIcon}>📲</Text>
              <Text style={styles.rowLabel}>Notifications Push</Text>
              <Toggle value={notifPush} onChange={setNotifPush} />
            </View>
            <View style={styles.row}>
              <Text style={styles.rowIcon}>✉️</Text>
              <Text style={styles.rowLabel}>Alertes par Email</Text>
              <Toggle value={notifEmail} onChange={setNotifEmail} />
            </View>
          </Card>
        </View>

        {/* ── Seuils ── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>SEUILS DE DÉTECTION</Text>
          <Card style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
            <View style={[styles.sliderBlock, styles.rowBorder]}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>🌡️ Température</Text>
                <Text style={[styles.sliderValue, { color: Colors.warn }]}>
                  {tempThresh}°C
                </Text>
              </View>
              <Slider
                minimumValue={25}
                maximumValue={60}
                value={tempThresh}
                onValueChange={(v) => setTempThresh(Math.round(v))}
                minimumTrackTintColor={Colors.warn}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.warn}
              />
              <View style={styles.sliderRange}>
                <Text style={styles.rangeText}>25°C</Text>
                <Text style={styles.rangeText}>60°C</Text>
              </View>
            </View>
            <View style={styles.sliderBlock}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>⚗️ Gaz (ppm)</Text>
                <Text style={[styles.sliderValue, { color: Colors.danger }]}>
                  {gasThresh} ppm
                </Text>
              </View>
              <Slider
                minimumValue={100}
                maximumValue={600}
                step={10}
                value={gasThresh}
                onValueChange={(v) => setGasThresh(Math.round(v))}
                minimumTrackTintColor={Colors.danger}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.danger}
              />
              <View style={styles.sliderRange}>
                <Text style={styles.rangeText}>100 ppm</Text>
                <Text style={styles.rangeText}>600 ppm</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* ── Accès & Urgence ──────────────────────────────────────────
            ✅ FIX: PAS de Card ici — les TouchableOpacity fonctionnent
            directement sans être imbriqués dans un autre composant   */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>ACCÈS & URGENCE</Text>
          <View style={styles.linkSection}>
            {/* Membres de famille — visible uniquement Occupant */}
            {isOccupant && (
              <TouchableOpacity
                onPress={() => {
                  if (onFamily) {
                    onFamily();
                  }
                }}
                activeOpacity={0.6}
                style={[styles.linkRow, styles.rowBorder]}
              >
                <Text style={styles.rowIcon}>👨‍👩‍👧</Text>
                <Text style={styles.rowLabel}>Membres de famille</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Gérer</Text>
                </View>
                <Text style={styles.arrowText}>→</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {}}
              activeOpacity={0.6}
              style={[styles.linkRow, styles.rowBorder]}
            >
              <Text style={styles.rowIcon}>🚨</Text>
              <Text style={styles.rowLabel}>Contacts d urgence</Text>
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {}}
              activeOpacity={0.6}
              style={styles.linkRow}
            >
              <Text style={styles.rowIcon}>🔐</Text>
              <Text style={styles.rowLabel}>Changer le mot de passe</Text>
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Déconnexion ── */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.85}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // ── Header ──────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { fontSize: 18, color: Colors.text, fontWeight: "600" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },

  content: { padding: 20, gap: 20 },

  // ── Avatar ──────────────────────────────────────────────────────────
  avatarSection: { alignItems: "center", gap: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.fireDim,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.fire + "40",
    shadowColor: Colors.fire,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  avatarInitials: { fontSize: 28, fontWeight: "800", color: Colors.fire },
  name: { fontSize: 18, fontWeight: "700", color: Colors.text },
  emailText: { fontSize: 13, color: Colors.textSecondary },
  roleBadge: {
    backgroundColor: Colors.fireDim,
    borderWidth: 1,
    borderColor: Colors.fire + "40",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  roleText: { fontSize: 12, color: Colors.fire, fontWeight: "600" },
  activeBadge: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 4 },
  activeText: { fontSize: 11, fontWeight: "600" },

  // ── Sections ────────────────────────────────────────────────────────
  sectionWrap: { gap: 10 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },

  // Rows dans Card (non-cliquables)
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: { fontSize: 18, width: 24, textAlign: "center" },
  rowLabel: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: "500" },

  // ✅ Section ACCÈS — View avec bordure, pas de Card
  linkSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.card,
  },
  badge: {
    backgroundColor: Colors.fireDim,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
  },
  badgeText: { fontSize: 10, color: Colors.fire, fontWeight: "700" },
  arrowText: { fontSize: 16, color: Colors.textSecondary },

  // ── Sliders ─────────────────────────────────────────────────────────
  sliderBlock: { paddingHorizontal: 16, paddingVertical: 14 },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sliderLabel: { fontSize: 14, color: Colors.text },
  sliderValue: { fontSize: 14, fontWeight: "700" },
  sliderRange: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  rangeText: { fontSize: 10, color: Colors.textMuted },

  // ── Logout ──────────────────────────────────────────────────────────
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.dangerDim,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.danger + "30",
  },
  logoutIcon: { fontSize: 18 },
  logoutText: { fontSize: 15, fontWeight: "700", color: Colors.danger },
});

export default ProfileScreen;
