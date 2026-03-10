import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors } from '../theme/colors';
import Card from '../components/Card';
import Button from '../components/Button';
import Gauge from '../components/Gauge';
import SparkLine from '../components/SparkLine';
import PulseDot from '../components/PulseDot';
import { ALERTS, READINGS_TEMP, READINGS_GAS, READINGS_SMOKE } from '../constants/mockData';
import { getStatusColor, getStatusLabel, getTemperatureColor, getGasColor, getSmokeColor } from '../utils/helpers';

export const ZoneDetailScreen = ({ zone, onBack }) => {
  const [activeTab, setActiveTab] = useState('live');
  const zoneAlerts = ALERTS.filter((a) => a.zone === zone.name);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* ✅ Fix: TouchableOpacity avec <Text> dedans */}
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{zone.icon} {zone.name}</Text>
          <View style={styles.headerSub}>
            <PulseDot color={getStatusColor(zone.status)} size={6} />
            <Text style={styles.headerSubText}>
              {' '}{getStatusLabel(zone.status)} · {zone.online}/{zone.sensors} capteurs en ligne
            </Text>
          </View>
        </View>

        {/* ✅ Fix: Bouton STOP avec <Text> dedans */}
        {zone.status === 'danger' && (
          <Button label="STOP" variant="danger" size="sm" onPress={() => {}} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Gauges */}
        <Card>
          <Text style={styles.gaugesTitle}>VALEURS EN TEMPS RÉEL</Text>
          <View style={styles.gaugesRow}>
            <Gauge value={zone.temp}  max={60}  color={getTemperatureColor(zone.temp)}  label="Température" unit="°C"  size={90} />
            <Gauge value={zone.gas}   max={600} color={getGasColor(zone.gas)}            label="Gaz"         unit="ppm" size={90} />
            <Gauge value={zone.smoke} max={100} color={getSmokeColor(zone.smoke)}        label="Fumée"       unit="ppm" size={90} />
          </View>
        </Card>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['live', 'history'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'live' ? '📊 Graphiques' : '📜 Historique'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'live' ? (
          <>
            {[
              { label: 'Température (°C)', data: READINGS_TEMP,  color: Colors.warn },
              { label: 'Gaz (ppm)',        data: READINGS_GAS,   color: zone.gas   > 100 ? Colors.danger : Colors.safe },
              { label: 'Fumée (ppm)',      data: READINGS_SMOKE, color: zone.smoke > 30  ? Colors.danger : Colors.info },
            ].map((chart, i) => (
              <Card key={i}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartLabel}>{chart.label}</Text>
                  <Text style={[styles.chartValue, { color: chart.color }]}>
                    {chart.data[chart.data.length - 1]}
                  </Text>
                </View>
                <SparkLine data={chart.data} color={chart.color} />
                <View style={styles.chartFooter}>
                  <Text style={styles.chartTime}>-30 min</Text>
                  <Text style={styles.chartTime}>Maintenant</Text>
                </View>
              </Card>
            ))}
          </>
        ) : (
          <Card>
            {zoneAlerts.length === 0 ? (
              <View style={styles.emptyAlerts}>
                <Text style={styles.emptyText}>✅ Aucune alerte pour cette zone</Text>
              </View>
            ) : (
              zoneAlerts.map((a, i) => (
                <View key={a.id} style={[styles.historyRow, i < zoneAlerts.length - 1 && styles.historyRowBorder]}>
                  <View style={[styles.historyDot, { backgroundColor: getStatusColor(a.level) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyType}>{a.type} — {a.value}</Text>
                    <Text style={styles.historyTime}>{a.time}</Text>
                  </View>
                  <View style={[styles.historyChip, { backgroundColor: a.resolved ? Colors.safeDim : Colors.dangerDim }]}>
                    <Text style={[styles.historyChipText, { color: a.resolved ? Colors.safe : Colors.danger }]}>
                      {a.resolved ? 'Résolu' : 'Actif'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        )}

        {/* Sensors List */}
        <View>
          <Text style={styles.sensorsTitle}>Capteurs</Text>
          {[
            { name: `MQ-2 Gaz — ${zone.name}`,      id: 'ESP-001', status: 'online', battery: 87 },
            { name: `Flamme — ${zone.name}`,         id: 'ESP-002', status: 'online', battery: 62 },
            { name: `Température — ${zone.name}`,    id: 'ESP-003', status: zone.online < zone.sensors ? 'offline' : 'online', battery: 34 },
          ].slice(0, zone.sensors).map((s, i) => (
            <Card key={i} style={{ marginBottom: 8 }}>
              <View style={styles.sensorRow}>
                <View style={[styles.sensorDot, {
                  backgroundColor: s.status === 'online' ? Colors.safe : Colors.danger,
                  shadowColor:     s.status === 'online' ? Colors.safe : Colors.danger,
                }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sensorName}>{s.name}</Text>
                  <Text style={styles.sensorId}>ID: {s.id}</Text>
                </View>
                <Text style={[styles.sensorBattery, { color: s.battery < 40 ? Colors.danger : Colors.textSecondary }]}>
                  🔋 {s.battery}%
                </Text>
              </View>
            </Card>
          ))}
        </View>

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
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface, borderWidth: 1,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 18, color: Colors.text, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  headerSub: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  headerSubText: { fontSize: 11, color: Colors.textSecondary },
  content: { padding: 16, gap: 16 },
  gaugesTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 16, letterSpacing: 1 },
  gaugesRow: { flexDirection: 'row', justifyContent: 'space-around' },
  tabRow: { flexDirection: 'row', gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.card, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Colors.fire },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  chartValue: { fontSize: 18, fontWeight: '800' },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  chartTime: { fontSize: 10, color: Colors.textMuted },
  emptyAlerts: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 13, color: Colors.textSecondary },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  historyRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  historyType: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  historyTime: { fontSize: 11, color: Colors.textSecondary },
  historyChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  historyChipText: { fontSize: 10, fontWeight: '600' },
  sensorsTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  sensorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sensorDot: { width: 8, height: 8, borderRadius: 4, shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  sensorName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  sensorId: { fontSize: 11, color: Colors.textSecondary },
  sensorBattery: { fontSize: 11 },
});

export default ZoneDetailScreen;