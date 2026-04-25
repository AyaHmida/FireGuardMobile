import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as signalR from "@microsoft/signalr";

import Card from "../components/Card";
import { Colors } from "../theme/colors";
import { getStatusColor, getStatusLabel } from "../utils/helpers";

import { useAuth } from "../context/Authcontext";
import { alertService } from "../services/AlertService";
import { BASE_URL } from "../services/api";

// Maps alert.type to a short professional label (no emojis)
const TYPE_LABEL = {
  SMOKE: "Fumée",
  GAS: "Gaz",
  TEMPERATURE: "Température",
};

const getTypeLabel = (type) => TYPE_LABEL[type] ?? "Capteur";

// ─────────────────────────────────────────────────────────────
// AlertsScreen
// Props:
//   onBack    – callback to go back
//   zoneId    – ID of the zone to filter alerts
//   zoneName  – human-readable zone name to display (optional)
// ─────────────────────────────────────────────────────────────
export const AlertsScreen = ({ onBack, zoneId, zoneName }) => {
  const { token } = useAuth();

  const [filter, setFilter] = useState("all");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // Keep a stable ref to alerts for use inside SignalR callback
  const alertsRef = useRef(alerts);
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  // ─────────────────────────────
  // LOAD ALERTS (initial fetch)
  // ─────────────────────────────
  const loadAlerts = useCallback(async () => {
    if (!zoneId) return;

    setLoading(true);
    try {
      const res = await alertService.getAlertsByZone(zoneId, token);
      setAlerts(res.data ?? []);
    } catch (err) {
      console.error("loadAlerts error:", err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [zoneId, token]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // ─────────────────────────────
  // SIGNALR — REALTIME ALERTS
  // Fix: pass JWT token via withAccessTokenFactory
  // Fix: use functional setState so the callback always reads
  //      the latest state without needing alerts in the dep array
  // ─────────────────────────────
  useEffect(() => {
    if (!zoneId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/alerts`, {
        // Provide the auth token so the hub accepts the connection
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.onreconnecting(() => setConnected(false));
    connection.onreconnected(() => setConnected(true));
    connection.onclose(() => setConnected(false));

    connection.on("AlertReceived", (alert) => {
      // Ignore alerts from other zones
      if (alert.zoneId && alert.zoneId !== zoneId) return;

      // Functional update — no stale-closure issue
      setAlerts((prev) => {
        // Avoid duplicates if the server re-sends
        if (prev.some((a) => a.id === alert.id)) return prev;
        return [alert, ...prev];
      });

      if (alert.level === "CRITICAL") {
        Alert.alert(
          "Alerte critique",
          `${alert.message}\nValeur relevée : ${Number(alert.value).toFixed(1)}`,
          [{ text: "Fermer" }],
        );
      }
    });

    connection
      .start()
      .then(() => {
        setConnected(true);
        console.log("SignalR connected");
      })
      .catch((err) => console.error("SignalR start error:", err));

    return () => {
      connection.stop();
      setConnected(false);
    };
  }, [zoneId, token]); // re-connect only when zone or token changes

  // ─────────────────────────────
  // MARK AS READ
  // ─────────────────────────────
  const handleMarkAsRead = async (alertId) => {
    try {
      await alertService.markAsRead(alertId, token);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)),
      );
    } catch (err) {
      console.error("markAsRead error:", err);
    }
  };

  // ─────────────────────────────
  // FILTERING
  // ─────────────────────────────
  const filtered =
    filter === "all"
      ? alerts
      : filter === "active"
        ? alerts.filter((a) => !a.isRead)
        : alerts.filter((a) => a.isRead);

  // ─────────────────────────────
  // STATS
  // ─────────────────────────────
  const stats = [
    {
      label: "Critiques",
      value: alerts.filter((a) => a.level === "CRITICAL").length,
      color: Colors.danger,
    },
    {
      label: "Alertes",
      value: alerts.filter((a) => a.level === "ALERT").length,
      color: Colors.warn,
    },
    {
      label: "Pré-alertes",
      value: alerts.filter((a) => a.level === "PRE_ALERT").length,
      color: Colors.info,
    },
  ];

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{"<"}</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Historique des alertes</Text>
          {zoneName ? (
            <Text style={styles.headerSubtitle}>{zoneName}</Text>
          ) : null}
        </View>

        {/* Real-time connection indicator */}
        <View style={styles.connectionBadge}>
          <View
            style={[
              styles.connectionDot,
              {
                backgroundColor: connected
                  ? (Colors.success ?? "#22c55e")
                  : Colors.danger,
              },
            ]}
          />
          <Text style={styles.connectionText}>
            {connected ? "Temps réel" : "Hors ligne"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ── NO ZONE WARNING ── */}
        {!zoneId && (
          <View style={styles.warningBox}>
            <Text style={styles.warningLabel}>Zone non sélectionnée</Text>
            <Text style={styles.warningText}>
              Retournez au tableau de bord et naviguez depuis une zone pour
              consulter ses alertes.
            </Text>
          </View>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>Chargement des alertes…</Text>
          </View>
        )}

        {/* ── STATS ── */}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <Card key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>
                {s.value}
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* ── FILTER TABS ── */}
        <View style={styles.filterRow}>
          {[
            { key: "all", label: "Toutes" },
            { key: "active", label: "Actives" },
            { key: "resolved", label: "Résolues" },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterBtn,
                filter === f.key && styles.filterBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f.key && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── EMPTY STATE ── */}
        {!loading && zoneId && filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Aucune alerte</Text>
            <Text style={styles.emptyText}>
              {filter === "active"
                ? "Aucune alerte active pour cette zone."
                : filter === "resolved"
                  ? "Aucune alerte résolue pour cette zone."
                  : "Aucune alerte enregistrée pour cette zone."}
            </Text>
          </View>
        )}

        {/* ── ALERT LIST ── */}
        {filtered.map((alert) => {
          const levelColor = getStatusColor(alert.level);
          return (
            <TouchableOpacity
              key={alert.id}
              activeOpacity={0.85}
              onPress={() => !alert.isRead && handleMarkAsRead(alert.id)}
            >
              <Card
                style={[
                  styles.alertCard,
                  !alert.isRead && {
                    borderLeftColor: levelColor,
                    borderLeftWidth: 3,
                  },
                ]}
              >
                {/* Top row: type + badge */}
                <View style={styles.alertHeader}>
                  <View style={styles.alertTypeContainer}>
                    <View
                      style={[
                        styles.alertTypePill,
                        { backgroundColor: levelColor + "18" },
                      ]}
                    >
                      <Text
                        style={[styles.alertTypeText, { color: levelColor }]}
                      >
                        {getTypeLabel(alert.type)}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: alert.isRead
                          ? Colors.surface
                          : levelColor + "18",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color: alert.isRead
                            ? Colors.textSecondary
                            : levelColor,
                        },
                      ]}
                    >
                      {alert.isRead ? "Résolu" : getStatusLabel(alert.level)}
                    </Text>
                  </View>
                </View>

                {/* Message */}
                <Text style={styles.alertMessage}>{alert.message}</Text>

                {/* Zone name (not ID) + value */}
                <View style={styles.alertMeta}>
                  <Text style={styles.alertMetaText}>
                    Zone :{" "}
                    <Text style={styles.alertMetaBold}>
                      {/* Use zoneName prop if it matches, otherwise show alert's zone or fallback */}
                      {alert.zoneName ?? zoneName ?? `Zone ${alert.zoneId}`}
                    </Text>
                  </Text>

                  <Text style={styles.alertMetaText}>
                    Valeur :{" "}
                    <Text style={[styles.alertMetaBold, { color: levelColor }]}>
                      {Number(alert.value).toFixed(1)}
                    </Text>
                  </Text>
                </View>

                {/* Timestamp + unread indicator */}
                <View style={styles.alertFooter}>
                  <Text style={styles.alertTime}>
                    {new Date(alert.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>

                  {!alert.isRead && (
                    <Text style={[styles.unreadHint, { color: levelColor }]}>
                      Appuyer pour marquer comme résolu
                    </Text>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // ── Header ──
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "700",
  },

  // ── Connection indicator ──
  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  connectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  // ── Content ──
  content: { padding: 16, gap: 12 },

  // ── Warning ──
  warningBox: {
    backgroundColor: Colors.warnDim ?? "#FFF8E7",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.warn + "40",
    gap: 4,
  },
  warningLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.warn ?? "#92400e",
  },
  warningText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // ── Loading ──
  loadingBox: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // ── Stats ──
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 10 },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },

  // ── Filters ──
  filterRow: { flexDirection: "row", gap: 6 },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.fire,
    borderColor: Colors.fire,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  filterTextActive: { color: "#fff" },

  // ── Empty ──
  emptyBox: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 30,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  // ── Alert card ──
  alertCard: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertTypeContainer: { flexDirection: "row" },
  alertTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  alertTypeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },
  alertMessage: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 18,
  },
  alertMeta: {
    flexDirection: "row",
    gap: 16,
  },
  alertMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  alertMetaBold: {
    fontWeight: "700",
    color: Colors.text,
  },
  alertFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  alertTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  unreadHint: {
    fontSize: 10,
    fontWeight: "600",
  },
});

export default AlertsScreen;
