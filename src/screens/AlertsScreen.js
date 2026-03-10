import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Card } from '../components/Card';
import { ALERTS } from '../constants/mockData';
import { getStatusColor, getStatusLabel } from '../utils/helpers';

export const AlertsScreen = ({ onBack }) => {
  const [filter, setFilter] = useState('all');

  const filtered =
    filter === 'all'
      ? ALERTS
      : filter === 'active'
      ? ALERTS.filter((a) => !a.resolved)
      : ALERTS.filter((a) => a.resolved);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* ✅ Fix: TouchableOpacity avec <Text> dedans */}
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique Alertes</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Filters */}
        <View style={styles.filterRow}>
          {['all', 'active', 'resolved'].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'Toutes' : f === 'active' ? '⚠️ Actives' : '✅ Résolues'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Bar */}
        <View style={styles.statsRow}>
          {[
            { l: 'Critiques', v: ALERTS.filter((a) => a.level === 'danger').length, c: Colors.danger },
            { l: 'Attention', v: ALERTS.filter((a) => a.level === 'warning').length, c: Colors.warn },
            { l: 'Info',      v: ALERTS.filter((a) => a.level === 'info').length,    c: Colors.info },
          ].map((s, i) => (
            <Card key={i} style={{ flex: 1 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: s.c }}>{s.v}</Text>
                <Text style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 2 }}>{s.l}</Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Alerts List */}
        {filtered.map((alert) => (
          <Card
            key={alert.id}
            style={{
              borderWidth: 1,
              borderColor: alert.resolved ? Colors.border : getStatusColor(alert.level) + '40',
              marginBottom: 8,
            }}
          >
            <View style={styles.alertRow}>
              <View style={[styles.alertIcon, { backgroundColor: alert.resolved ? Colors.surface : Colors.infoDim }]}>
                <Text style={{ fontSize: 20 }}>
                  {alert.type === 'Fumée' ? '💨' : alert.type === 'Gaz' ? '⚗️' : alert.type === 'Capteur' ? '📡' : '🌡️'}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.alertTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertType, { color: alert.resolved ? Colors.textSecondary : Colors.text }]}>
                      {alert.type} détecté
                    </Text>
                    <Text style={styles.alertZone}>
                      Zone : <Text style={{ color: Colors.text }}>{alert.zone}</Text>
                    </Text>
                  </View>
                  <View style={[styles.alertBadge, { backgroundColor: alert.resolved ? Colors.surface : Colors.infoDim }]}>
                    <Text style={[styles.alertBadgeText, { color: alert.resolved ? Colors.textSecondary : getStatusColor(alert.level) }]}>
                      {alert.resolved ? 'Résolu' : getStatusLabel(alert.level)}
                    </Text>
                  </View>
                </View>

                <View style={styles.alertBottom}>
                  <Text style={styles.alertValue}>
                    Valeur :{' '}
                    <Text style={{ color: alert.resolved ? Colors.textSecondary : getStatusColor(alert.level), fontWeight: '600' }}>
                      {alert.value}
                    </Text>
                  </Text>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                </View>
              </View>
            </View>
          </Card>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface, borderWidth: 1,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 18, color: Colors.text, fontWeight: '600' },
  content: { padding: 20, gap: 14 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 9, paddingHorizontal: 4, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center' },
  filterBtnActive: { backgroundColor: Colors.fire },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 10 },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  alertIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  alertType: { fontSize: 14, fontWeight: '700' },
  alertZone: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  alertBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  alertBadgeText: { fontSize: 10, fontWeight: '700' },
  alertBottom: { flexDirection: 'row', gap: 16, marginTop: 8 },
  alertValue: { fontSize: 11, color: Colors.textSecondary },
  alertTime: { fontSize: 11, color: Colors.textMuted },
});

export default AlertsScreen;