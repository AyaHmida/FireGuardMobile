import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as signalR from "@microsoft/signalr";
import { LineChart } from "react-native-chart-kit";

import Button from "../components/Button";
import Card from "../components/Card";
import Gauge from "../components/Gauge";
import PulseDot from "../components/PulseDot";
import { Colors } from "../theme/colors";

import { ALERTS } from "../constants/mockData";

import {
  getGasColor,
  getStatusColor,
  getStatusLabel,
  getTemperatureColor,
} from "../utils/helpers";

import { useAuth } from "../context/Authcontext";
import { BASE_URL } from "../services/api";
import { getSensorStats } from "../services/MeasurementService";
import { sensorService } from "../services/sensorService";

const screenWidth = Dimensions.get("window").width;

export const ZoneDetailScreen = ({ zone, onBack }) => {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState("live");
  const [realtime, setRealtime] = useState(null);
  const [loading, setLoading] = useState(true);

  const [history, setHistory] = useState({
    temperature: [],
    gas: [],
    humidity: [],
  });

  const [sensors, setSensors] = useState([]);
  const [historyStats, setHistoryStats] = useState({
    temperature: { min: 0, max: 0, avg: 0 },
    gas: { min: 0, max: 0, avg: 0 },
    humidity: { min: 0, max: 0, avg: 0 },
  });
  const [historyLoading, setHistoryLoading] = useState(false);

  const historyRef = useRef({
    temperature: [],
    gas: [],
    humidity: [],
  });

  const connectionRef = useRef(null);

  const zoneAlerts = ALERTS.filter((a) => a.zone === zone?.name);

  // ─────────────────────────────────────────────
  // FETCH SENSORS FOR ZONE
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!zone?.id || !token) return;

    const fetchSensors = async () => {
      const result = await sensorService.getByZone(zone.id, token);
      if (result.success) {
        setSensors(result.data);
      } else {
        setSensors([]);
      }
    };

    fetchSensors();
  }, [zone?.id, token]);

  // ─────────────────────────────────────────────
  // FETCH HISTORY STATS
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "history" || sensors.length === 0 || !token) return;

    const fetchHistoryStats = async () => {
      setHistoryLoading(true);

      const now = new Date();
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const end = now.toISOString();

      const stats = {
        temperature: { min: 0, max: 0, avg: 0 },
        gas: { min: 0, max: 0, avg: 0 },
        humidity: { min: 0, max: 0, avg: 0 },
      };

      for (const sensor of sensors) {
        const sensorId = sensor.id;
        const type = sensor.type?.toLowerCase();

        if (!sensorId || !["temperature", "gas", "humidity"].includes(type))
          continue;

        try {
          const sensorStats = await getSensorStats(sensorId, start, end, token);
          stats[type] = sensorStats;
        } catch (error) {
          console.error(`Failed to fetch stats for sensor ${sensorId}:`, error);
        }
      }

      setHistoryStats(stats);
      setHistoryLoading(false);
    };

    fetchHistoryStats();
  }, [activeTab, sensors, token]);

  // ─────────────────────────────────────────────
  // REAL TIME SIGNALR
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!zone?.id) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/realtime?zoneId=${zone.id}`)
      .withAutomaticReconnect()
      .build();

    connection.on("ZoneRealtimeUpdated", (data) => {
      setRealtime(data);
      setLoading(false);

      const temp = Number(data.temperature ?? 0);
      const gas = Number(data.gas ?? 0);
      const hum = Number(data.humidity ?? 0);

      const updatedHistory = {
        temperature: [...historyRef.current.temperature.slice(-9), temp],
        gas: [...historyRef.current.gas.slice(-9), gas],
        humidity: [...historyRef.current.humidity.slice(-9), hum],
      };

      historyRef.current = updatedHistory;
      setHistory(updatedHistory);
    });

    connection.start().catch((err) => console.log("SignalR error:", err));
    connectionRef.current = connection;

    return () => connection.stop();
  }, [zone?.id]);

  // ─────────────────────────────────────────────
  // ALERTS
  // ─────────────────────────────────────────────
  const renderAlerts = () => {
    if (zoneAlerts.length === 0) {
      return <Text style={{ textAlign: "center" }}>✅ Aucune alerte</Text>;
    }

    return zoneAlerts.map((a) => (
      <View key={a.id} style={styles.historyRow}>
        <View
          style={[
            styles.historyDot,
            { backgroundColor: getStatusColor(a.level) },
          ]}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.historyType}>
            {a.type} — {a.value}
          </Text>
          <Text style={styles.historyTime}>{a.time}</Text>
        </View>
      </View>
    ));
  };

  // ─────────────────────────────────────────────
  // STATS SECTION (redesigned)
  // ─────────────────────────────────────────────
  const SENSOR_CONFIG = [
    {
      key: "temperature",
      label: "Température",
      unit: "°C",
      max: 60,
      color: "#EF9F27",
      bgColor: "#FFF8EC",
      icon: "🌡️",
      stats: historyStats.temperature,
    },
    {
      key: "gas",
      label: "Gaz",
      unit: "ppm",
      max: 2000,
      color: "#E24B4A",
      bgColor: "#FFF1F1",
      icon: "💨",
      stats: historyStats.gas,
    },
    {
      key: "humidity",
      label: "Humidité",
      unit: "%",
      max: 100,
      color: "#378ADD",
      bgColor: "#EEF5FF",
      icon: "💧",
      stats: historyStats.humidity,
    },
  ];

  const getProgressWidth = (value, max) => {
    const pct = Math.min((value / max) * 100, 100);
    return `${pct}%`;
  };

  const renderStatsContent = () => {
    if (historyLoading) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Colors.fire} />
          <Text style={styles.loadingText}>Chargement de l historique...</Text>
        </View>
      );
    }

    if (sensors.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyText}>
            Aucun capteur trouvé pour cette zone
          </Text>
        </View>
      );
    }

    return (
      <View>
        {/* Section header */}
        <View style={styles.statsHeader}>
          <Text style={styles.statsSectionTitle}>STATISTIQUES</Text>
          <View style={styles.statsBadge}>
            <Text style={styles.statsBadgeText}>Dernières 24h</Text>
          </View>
        </View>

        {/* Sensor blocks */}
        {SENSOR_CONFIG.map((item, i) => {
          const avgPct = Math.min((item.stats.avg / item.max) * 100, 100);
          const minPct = Math.min((item.stats.min / item.max) * 100, 100);
          const maxPct = Math.min((item.stats.max / item.max) * 100, 100);

          return (
            <View key={i} style={styles.sensorBlock}>
              {/* Top row: icon + label + current value */}
              <View style={styles.sensorTopRow}>
                <View style={styles.sensorNameRow}>
                  <View
                    style={[styles.sensorDot, { backgroundColor: item.color }]}
                  />
                  <Text style={styles.sensorLabel}>{item.label}</Text>
                </View>
                <View
                  style={[
                    styles.sensorValuePill,
                    { backgroundColor: item.bgColor },
                  ]}
                >
                  <Text style={[styles.sensorValueText, { color: item.color }]}>
                    {item.stats.avg.toFixed(1)} {item.unit}
                  </Text>
                </View>
              </View>

              {/* Metric cards row */}
              <View style={styles.metricRow}>
                {[
                  { label: "Min", value: item.stats.min },
                  { label: "Moy", value: item.stats.avg },
                  { label: "Max", value: item.stats.max },
                ].map((m, j) => (
                  <View
                    key={j}
                    style={[
                      styles.metricCard,
                      j === 1 && { borderColor: item.color, borderWidth: 1 },
                    ]}
                  >
                    <Text style={styles.metricCardLabel}>{m.label}</Text>
                    <Text
                      style={[
                        styles.metricCardValue,
                        j === 1 && { color: item.color },
                      ]}
                    >
                      {m.value.toFixed(1)}
                    </Text>
                    <Text style={styles.metricCardUnit}>{item.unit}</Text>
                  </View>
                ))}
              </View>

              {/* Progress bar */}
              <View style={styles.progressTrack}>
                {/* Range band between min and max */}
                <View
                  style={[
                    styles.progressBand,
                    {
                      left: `${minPct}%`,
                      width: `${maxPct - minPct}%`,
                      backgroundColor: item.color + "30",
                    },
                  ]}
                />
                {/* Average marker */}
                <View
                  style={[
                    styles.progressAvgMarker,
                    {
                      left: `${avgPct}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>

              {/* Bar legend */}
              <View style={styles.progressLegend}>
                <Text style={styles.progressLegendText}>0</Text>
                <View style={styles.progressLegendCenter}>
                  <View
                    style={[styles.legendDot, { backgroundColor: item.color }]}
                  />
                  <Text
                    style={[styles.progressLegendText, { color: item.color }]}
                  >
                    moy {item.stats.avg.toFixed(1)} {item.unit}
                  </Text>
                </View>
                <Text style={styles.progressLegendText}>
                  {item.max} {item.unit}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {zone?.icon} {zone?.name}
          </Text>
          <View style={styles.headerSub}>
            <PulseDot color={getStatusColor(zone?.status)} size={6} />
            <Text style={styles.headerSubText}>
              {getStatusLabel(zone?.status)} · {zone?.online}/{zone?.sensors}{" "}
              capteurs
            </Text>
          </View>
        </View>

        {zone?.status === "danger" && (
          <Button label="STOP" variant="danger" size="sm" onPress={() => {}} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* LOADING */}
        {loading && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator size="small" color={Colors.fire} />
            <Text style={{ marginTop: 10, color: Colors.textSecondary }}>
              Connexion temps réel...
            </Text>
          </View>
        )}

        {/* GAUGES */}
        <Card>
          <Text style={styles.gaugesTitle}>VALEURS EN TEMPS RÉEL</Text>
          <View style={styles.gaugesRow}>
            <Gauge
              value={parseFloat((realtime?.temperature ?? 0).toFixed(1))}
              max={60}
              color={getTemperatureColor(realtime?.temperature ?? 0)}
              label="Température"
              unit="°C"
              size={90}
            />
            <Gauge
              value={parseFloat((realtime?.gas ?? 0).toFixed(1))}
              max={2000}
              color={getGasColor(realtime?.gas ?? 0)}
              label="Gaz"
              unit="ppm"
              size={90}
            />
            <Gauge
              value={parseFloat((realtime?.humidity ?? 0).toFixed(1))}
              max={100}
              color={Colors.info}
              label="Humidité"
              unit="%"
              size={90}
            />
          </View>
        </Card>

        {/* TABS */}
        <View style={styles.tabRow}>
          {["live", "history"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab === "live" ? "📊 Graphiques" : "📜 Historique"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIVE CHARTS */}
        {activeTab === "live" &&
          [
            {
              label: "Température (°C)",
              value: realtime?.temperature ?? 0,
              color: Colors.warn,
              data: history.temperature,
            },
            {
              label: "Gaz (ppm)",
              value: realtime?.gas ?? 0,
              color: Colors.danger,
              data: history.gas,
            },
            {
              label: "Humidité (%)",
              value: realtime?.humidity ?? 0,
              color: Colors.info,
              data: history.humidity,
            },
          ].map((chart, i) => (
            <Card key={i} style={{ marginBottom: 16 }}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartLabel}>{chart.label}</Text>
                <Text style={[styles.chartValue, { color: chart.color }]}>
                  {Number(chart.value).toFixed(1)}
                </Text>
              </View>
              <LineChart
                data={{
                  labels: [],
                  datasets: [
                    {
                      data: chart.data.length > 0 ? chart.data : [chart.value],
                    },
                  ],
                }}
                width={screenWidth - 64}
                height={90}
                withDots={false}
                withInnerLines={false}
                withOuterLines={false}
                withVerticalLabels={false}
                withHorizontalLabels={false}
                bezier
                chartConfig={{
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  color: () => chart.color,
                }}
                style={{ borderRadius: 16 }}
              />
            </Card>
          ))}

        {/* ──── HISTORY / STATS ──── */}
        {activeTab === "history" && <Card>{renderStatsContent()}</Card>}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

// ───────── STYLES ─────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: { flexDirection: "row", padding: 16, alignItems: "center" },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnText: { fontSize: 18 },
  headerTitle: { fontSize: 16, fontWeight: "bold" },
  headerSub: { flexDirection: "row", alignItems: "center" },
  headerSubText: { fontSize: 12, color: Colors.textSecondary },

  content: { padding: 16 },

  gaugesTitle: { fontWeight: "bold", marginBottom: 10 },
  gaugesRow: { flexDirection: "row", justifyContent: "space-around" },

  tabRow: { flexDirection: "row", marginVertical: 10 },
  tabBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: "#eee",
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: { backgroundColor: Colors.fire },
  tabText: { fontSize: 13 },
  tabTextActive: { color: "#fff" },

  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  chartLabel: { fontWeight: "600" },
  chartValue: { fontSize: 18, fontWeight: "bold" },

  historyRow: { flexDirection: "row", paddingVertical: 10 },
  historyDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  historyType: { fontWeight: "600" },
  historyTime: { fontSize: 11, color: "#777" },

  // ── Loading / Empty ──
  loadingWrap: { padding: 24, alignItems: "center" },
  loadingText: { marginTop: 10, color: Colors.textSecondary, fontSize: 13 },
  emptyWrap: { padding: 24, alignItems: "center" },
  emptyIcon: { fontSize: 28, marginBottom: 8 },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: "center" },

  // ── Stats header ──
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  statsSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#999",
  },
  statsBadge: {
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statsBadgeText: {
    fontSize: 11,
    color: "#777",
    fontWeight: "500",
  },

  // ── Sensor block card ──
  sensorBlock: {
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#E5E5E5",
    padding: 14,
    marginBottom: 12,
  },

  // ── Top row ──
  sensorTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sensorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sensorDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  sensorLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  sensorValuePill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  sensorValueText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // ── Metric cards ──
  metricRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "#E5E5E5",
    padding: 10,
    alignItems: "center",
  },
  metricCardLabel: {
    fontSize: 10,
    color: "#AAA",
    fontWeight: "500",
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  metricCardValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    lineHeight: 20,
  },
  metricCardUnit: {
    fontSize: 10,
    color: "#AAA",
    marginTop: 2,
  },

  // ── Progress bar ──
  progressTrack: {
    height: 6,
    backgroundColor: "#ECECEC",
    borderRadius: 99,
    overflow: "hidden",
    position: "relative",
    marginBottom: 6,
  },
  progressBand: {
    position: "absolute",
    top: 0,
    height: 6,
    borderRadius: 99,
  },
  progressAvgMarker: {
    position: "absolute",
    top: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    borderWidth: 2,
    borderColor: "#fff",
  },

  // ── Bar legend ──
  progressLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLegendCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressLegendText: {
    fontSize: 10,
    color: "#AAA",
  },
});

export default ZoneDetailScreen;
