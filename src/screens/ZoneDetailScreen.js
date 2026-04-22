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

  const historyRef = useRef({
    temperature: [],
    gas: [],
    humidity: [],
  });

  const connectionRef = useRef(null);

  const zoneAlerts = ALERTS.filter((a) => a.zone === zone?.name);

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
      console.log("🔥 REALTIME DATA:", data);

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

    connection
      .start()
      .then(() => {
        console.log("✅ SignalR connected");
      })
      .catch((err) => console.log("SignalR error:", err));

    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
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

        {/* HISTORY */}
        {activeTab === "history" && <Card>{renderAlerts()}</Card>}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

// ───────── STYLES ─────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },

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

  historyRow: {
    flexDirection: "row",
    paddingVertical: 10,
  },

  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },

  historyType: { fontWeight: "600" },

  historyTime: { fontSize: 11, color: "#777" },
});

export default ZoneDetailScreen;
