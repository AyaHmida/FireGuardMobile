import Slider from '@react-native-community/slider';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import Toggle from '../components/Toggle';
import { useAuth } from '../context/Authcontext';
import { Colors } from '../theme/colors';

export const ProfileScreen = ({ onBack, onLogout }) => {
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
    ? `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`
    : '?';

  const fullName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`
    : 'Utilisateur';

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Card style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
        {children}
      </Card>
    </View>
  );

  const Row = ({ icon, label, right, last = false }) => (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      {right}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button
          variant="secondary"
          label="←"
          size="sm"
          onPress={onBack}
          style={styles.backBtn}
        />
        <Text style={styles.headerTitle}>Mon Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role === 'Admin' ? '🛡️ Administrateur' : '🏠 Occupant'}
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
                ? '✅ Compte actif'
                : '⏳ En attente de validation'}
            </Text>
          </View>
        </View>

        {/* Notifications */}
        <Section title="NOTIFICATIONS">
          <Row
            icon="📲"
            label="Notifications Push"
            right={<Toggle value={notifPush} onChange={setNotifPush} />}
          />
          <Row
            icon="✉️"
            label="Alertes par Email"
            right={<Toggle value={notifEmail} onChange={setNotifEmail} />}
            last
          />
        </Section>

        {/* Seuils */}
        <Section title="SEUILS DE DÉTECTION">
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
        </Section>

        {/* Accès & Urgence */}
        <Section title="ACCÈS & URGENCE">
          <Row
            icon="👨‍👩‍👧"
            label="Membres de famille"
            right={<Text style={styles.arrowText}>3 →</Text>}
          />
          <Row
            icon="🚨"
            label="Contacts d'urgence"
            right={<Text style={styles.arrowText}>2 →</Text>}
          />
          <Row
            icon="🔐"
            label="Changer le mot de passe"
            right={<Text style={styles.arrowText}>→</Text>}
            last
          />
        </Section>

        {/* ✅ Bouton Déconnexion */}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  backBtn: { width: 36, height: 36, padding: 0 },
  content: { padding: 20, gap: 20 },

  // ── Avatar ──────────────────────────────────────────────────────────
  avatarSection: { alignItems: 'center', gap: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.fireDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.fire + '40',
    shadowColor: Colors.fire,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  avatarInitials: { fontSize: 28, fontWeight: '800', color: Colors.fire },
  name: { fontSize: 18, fontWeight: '700', color: Colors.text },
  email: { fontSize: 13, color: Colors.textSecondary },
  roleBadge: {
    backgroundColor: Colors.fireDim,
    borderWidth: 1,
    borderColor: Colors.fire + '40',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  roleText: { fontSize: 12, color: Colors.fire, fontWeight: '600' },
  activeBadge: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 4 },
  activeText: { fontSize: 11, fontWeight: '600' },

  // ── Sections ────────────────────────────────────────────────────────
  section: { gap: 0 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '500' },
  arrowText: { fontSize: 13, color: Colors.textSecondary },

  // ── Sliders ─────────────────────────────────────────────────────────
  sliderBlock: { paddingHorizontal: 16, paddingVertical: 14 },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sliderLabel: { fontSize: 14, color: Colors.text },
  sliderValue: { fontSize: 14, fontWeight: '700' },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeText: { fontSize: 10, color: Colors.textMuted },

  // ── Logout ──────────────────────────────────────────────────────────
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.dangerDim,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  logoutIcon: { fontSize: 18 },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
});

export default ProfileScreen;
