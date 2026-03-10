import { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../components/Button';
import { Card } from '../components/Card';
import { PulseDot } from '../components/PulseDot';
import { ALERTS, ZONES } from '../constants/mockData';
import { useAuth } from '../context/Authcontext';
import { Colors } from '../theme/colors';
import { getStatusColor, getStatusLabel } from '../utils/helpers';

export const DashboardScreen = ({ onZone, onAlert }) => {
  const { user } = useAuth(); // ✅ user authentifié
  const [armed, setArmed] = useState(true);
  const [tick, setTick] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const criticalZones = ZONES.filter((z) => z.status === 'danger');
  const activeAlerts = ALERTS.filter((a) => !a.resolved);

  const handleToggle = () => {
    if (armed) setShowConfirm(true);
    else setArmed(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.username}>
            {user ? `${user.firstName} ${user.lastName}` : '...'}
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => onAlert()} style={styles.iconBtn}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {activeAlerts.length > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
          <View
            style={[
              styles.iconBtn,
              {
                backgroundColor: Colors.fireDim,
                borderColor: Colors.fire + '40',
              },
            ]}
          >
            <Text style={{ fontSize: 20 }}>👤</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Critical Alert Banner */}
        {criticalZones.length > 0 && (
          <View style={styles.criticalBanner}>
            <Text style={{ fontSize: 28 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.criticalTitle}>
                ALERTE CRITIQUE — {criticalZones.map((z) => z.name).join(', ')}
              </Text>
              <Text style={styles.criticalSub}>
                {activeAlerts.length} alertes actives · Intervention requise
              </Text>
            </View>
            {/* ✅ Fix: TouchableOpacity vide → Button avec label */}
            <Button
              label="VOIR"
              variant="danger"
              size="sm"
              onPress={() => onAlert()}
            />
          </View>
        )}

        {/* System Toggle */}
        <Card>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Surveillance Globale</Text>
              <View style={styles.toggleStatus}>
                {armed ? (
                  <>
                    <PulseDot color={Colors.safe} size={7} />
                    <Text
                      style={[styles.toggleStatusText, { color: Colors.safe }]}
                    >
                      {' '}
                      Système actif
                    </Text>
                  </>
                ) : (
                  <Text style={styles.toggleStatusText}>⏸ Désactivé</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={handleToggle}
              activeOpacity={0.8}
              style={[
                styles.toggleSwitch,
                { backgroundColor: armed ? Colors.fire : Colors.border },
              ]}
            >
              <View style={[styles.toggleThumb, { left: armed ? 26 : 3 }]} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            {
              label: 'Zones',
              value: ZONES.length,
              sub: 'actives',
              icon: '🏠',
              color: Colors.info,
            },
            {
              label: 'Alertes',
              value: activeAlerts.length,
              sub: 'en cours',
              icon: '⚠️',
              color: activeAlerts.length > 0 ? Colors.danger : Colors.safe,
            },
            {
              label: 'Capteurs',
              value: '16/17',
              sub: 'en ligne',
              icon: '📡',
              color: Colors.safe,
            },
          ].map((s, i) => (
            <Card key={i} style={{ flex: 1 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</Text>
                <Text
                  style={{ fontSize: 20, fontWeight: '800', color: s.color }}
                >
                  {s.value}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: Colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {s.sub}
                </Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Zones Grid */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes Zones</Text>
            <Text style={styles.sectionLink}>Tout voir →</Text>
          </View>
          <View style={styles.zonesGrid}>
            {ZONES.map((zone) => (
              <Card
                key={zone.id}
                interactive
                status={zone.status}
                onPress={() => onZone(zone)}
                style={styles.zoneCard}
              >
                <View style={styles.zoneCardTop}>
                  <Text style={{ fontSize: 24 }}>{zone.icon}</Text>
                  <View style={styles.statusBadge}>
                    <PulseDot color={getStatusColor(zone.status)} size={6} />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: getStatusColor(zone.status) },
                      ]}
                    >
                      {' '}
                      {getStatusLabel(zone.status)}
                    </Text>
                  </View>
                </View>
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.zoneName}>{zone.name}</Text>
                  <Text style={styles.zoneInfo}>
                    {zone.temp}°C · {zone.sensors} capteurs
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Recent Alerts */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alertes Récentes</Text>
            <TouchableOpacity onPress={() => onAlert()}>
              <Text style={styles.sectionLink}>Historique →</Text>
            </TouchableOpacity>
          </View>
          {ALERTS.slice(0, 3).map((alert) => (
            <Card key={alert.id} style={{ marginBottom: 8 }}>
              <View style={styles.recentAlertRow}>
                <View style={styles.recentAlertIcon}>
                  <Text style={{ fontSize: 18 }}>
                    {alert.type === 'Fumée'
                      ? '💨'
                      : alert.type === 'Gaz'
                        ? '⚗️'
                        : '🌡️'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentAlertTitle}>
                    {alert.type} — {alert.zone}
                  </Text>
                  <Text style={styles.recentAlertSub}>
                    {alert.value} · {alert.time}
                  </Text>
                </View>
                <View style={styles.recentAlertBadge}>
                  <Text
                    style={[
                      styles.recentAlertBadgeText,
                      { color: getStatusColor(alert.level) },
                    ]}
                  >
                    {getStatusLabel(alert.level)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Confirm Modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 22, marginBottom: 8 }}>⚠️</Text>
            <Text style={styles.modalTitle}>Désactiver la surveillance ?</Text>
            <Text style={styles.modalDesc}>
              Toutes les alertes seront suspendues. Confirmer l action.
            </Text>
            <View style={styles.modalButtons}>
              {/* ✅ Fix: TouchableOpacity vides → Button avec label */}
              <Button
                variant="secondary"
                label="Annuler"
                onPress={() => setShowConfirm(false)}
                size="lg"
                style={{ flex: 1 }}
              />
              <Button
                variant="danger"
                label="Désactiver"
                onPress={() => {
                  setArmed(false);
                  setShowConfirm(false);
                }}
                size="lg"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  greeting: { fontSize: 12, color: Colors.textSecondary },
  username: { fontSize: 18, fontWeight: '700', color: Colors.text },
  headerIcons: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  content: { padding: 16, gap: 16 },
  criticalBanner: {
    backgroundColor: Colors.dangerDim,
    borderWidth: 1,
    borderColor: Colors.danger + '50',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  criticalTitle: { fontSize: 13, fontWeight: '700', color: Colors.danger },
  criticalSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  toggleTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  toggleStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  toggleStatusText: { fontSize: 12, color: Colors.textSecondary },
  toggleSwitch: {
    width: 52,
    height: 28,
    borderRadius: 14,
    position: 'relative',
    justifyContent: 'center',
  },
  toggleThumb: {
    position: 'absolute',
    top: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  sectionLink: { fontSize: 12, color: Colors.fire, fontWeight: '600' },
  zonesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  zoneCard: { width: '47%' },
  zoneCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoDim,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusBadgeText: { fontSize: 9, fontWeight: '700' },
  zoneName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  zoneInfo: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  recentAlertRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentAlertIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.infoDim,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recentAlertTitle: { fontSize: 13, fontWeight: '600', color: Colors.text },
  recentAlertSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  recentAlertBadge: {
    backgroundColor: Colors.infoDim,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recentAlertBadgeText: { fontSize: 10, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  modalDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
});

export default DashboardScreen;
