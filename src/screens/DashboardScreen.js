import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PulseDot } from "../components/PulseDot";
import { useAuth } from "../context/Authcontext";

import * as signalR from "@microsoft/signalr";
import { BASE_URL } from "../services/api";

import { alertService } from "../services/AlertService";
import { zoneService } from "../services/ZoneService";
import { deviceControlService } from "../services/deviceControlService";
import { getStatusColor, getStatusLabel } from "../utils/helpers";

// ── Emergency Colors ─────────────────────────────────────────────────
const C = {
  orange: "#FF5A3C",
  orangeDim: "#FF5A3C18",
  blue: "#3B82F6",
  blueDim: "#3B82F618",
  red: "#EF4444",
  redDim: "#EF444418",
  green: "#22C55E",
  greenDim: "#22C55E18",
  bg: "#F8F9FB",
  card: "#FFFFFF",
  border: "#E8EAF0",
  text: "#111827",
  textSub: "#6B7280",
  textMuted: "#9CA3AF",
};

// ── Alert level → couleur (cohérent avec AlertsScreen) ───────────────
const LEVEL_COLOR = {
  CRITICAL: C.red,
  ALERT: "#F97316",
  PRE_ALERT: "#3B82F6",
};
const getLevelColor = (level = "") =>
  LEVEL_COLOR[(level || "").toUpperCase()] ?? C.textMuted;

const LEVEL_LABEL = {
  CRITICAL: "Critique",
  ALERT: "Alerte",
  PRE_ALERT: "Pré-alerte",
};
const getLevelLabel = (level = "") =>
  LEVEL_LABEL[(level || "").toUpperCase()] ?? level;

const TYPE_LABEL = { SMOKE: "Fumée", GAS: "Gaz", TEMPERATURE: "Température" };
const getTypeLabel = (type) => TYPE_LABEL[type] ?? "Capteur";

// ── Emergency Control Card ────────────────────────────────────────────
const EmergencyControlCard = ({ zone, token, deviceId }) => {
  // false = encore actif (système l'a déclenché), true = désactivé par l'opérateur
  const [buzzerDisabled, setBuzzerDisabled] = useState(false);
  const [pumpDisabled, setPumpDisabled] = useState(false);
  const [buzzerLoading, setBuzzerLoading] = useState(false);
  const [pumpLoading, setPumpLoading] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleDisableBuzzer = async () => {
    if (buzzerDisabled) return; // déjà désactivé, rien à faire
    setBuzzerLoading(true);
    const result = await deviceControlService.sendCommand(
      deviceId,
      "DISABLE_BUZZER",
      token,
    );
    if (result.success) setBuzzerDisabled(true);
    setBuzzerLoading(false);
  };

  const handleDisablePump = async () => {
    if (pumpDisabled) return; // déjà arrêtée, rien à faire
    setPumpLoading(true);
    const result = await deviceControlService.sendCommand(
      deviceId,
      "DISABLE_PUMP",
      token,
    );
    if (result.success) setPumpDisabled(true);
    setPumpLoading(false);
  };

  return (
    <Animated.View
      style={[styles.emergencyCard, { transform: [{ scale: pulseAnim }] }]}
    >
      <View style={styles.emergencyHeader}>
        <View style={styles.emergencyIconWrapper}>
          <Ionicons name="warning" size={18} color={C.red} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.emergencyTitle}>Contrôle d urgence</Text>
          <Text style={styles.emergencySubtitle}>
            {zone?.name
              ? `Zone critique — ${zone.name}`
              : "Fuite de gaz critique détectée"}
          </Text>
        </View>
        <View style={styles.criticalPill}>
          <View style={styles.criticalPillDot} />
          <Text style={styles.criticalPillText}>CRITIQUE</Text>
        </View>
      </View>

      <View style={styles.emergencyDivider} />

      <View style={styles.emergencyActions}>
        {/* ── Buzzer : désactiver uniquement ── */}
        <TouchableOpacity
          onPress={handleDisableBuzzer}
          activeOpacity={buzzerDisabled ? 1 : 0.85}
          disabled={buzzerDisabled}
          style={[
            styles.emergencyBtn,
            buzzerDisabled
              ? { backgroundColor: C.bg, borderColor: C.border }
              : { backgroundColor: C.red, borderColor: C.red + "50" },
          ]}
        >
          {buzzerLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name="notifications-off-outline"
              size={22}
              color={buzzerDisabled ? C.textMuted : "#fff"}
            />
          )}
          <Text
            style={[
              styles.emergencyBtnLabel,
              { color: buzzerDisabled ? C.textMuted : "#fff" },
            ]}
          >
            {buzzerDisabled ? "Buzzer coupé" : "Couper le buzzer"}
          </Text>
          <View
            style={[
              styles.emergencyBtnBadge,
              {
                backgroundColor: buzzerDisabled
                  ? C.border
                  : "rgba(255,255,255,0.25)",
              },
            ]}
          >
            <Text
              style={[
                styles.emergencyBtnBadgeText,
                { color: buzzerDisabled ? C.textMuted : "#fff" },
              ]}
            >
              {buzzerDisabled ? "OFF" : "ON"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* ── Pompe : arrêter uniquement ── */}
        <TouchableOpacity
          onPress={handleDisablePump}
          activeOpacity={pumpDisabled ? 1 : 0.85}
          disabled={pumpDisabled}
          style={[
            styles.emergencyBtn,
            pumpDisabled
              ? { backgroundColor: C.bg, borderColor: C.border }
              : { backgroundColor: C.blue, borderColor: C.blue + "50" },
          ]}
        >
          {pumpLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name="water-outline"
              size={22}
              color={pumpDisabled ? C.textMuted : "#fff"}
            />
          )}
          <Text
            style={[
              styles.emergencyBtnLabel,
              { color: pumpDisabled ? C.textMuted : "#fff" },
            ]}
          >
            {pumpDisabled ? "Pompe arrêtée" : "Arrêter la pompe"}
          </Text>
          <View
            style={[
              styles.emergencyBtnBadge,
              {
                backgroundColor: pumpDisabled
                  ? C.border
                  : "rgba(255,255,255,0.25)",
              },
            ]}
          >
            <Text
              style={[
                styles.emergencyBtnBadgeText,
                { color: pumpDisabled ? C.textMuted : "#fff" },
              ]}
            >
              {pumpDisabled ? "OFF" : "ON"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.emergencyFooter}>
        <Ionicons
          name="information-circle-outline"
          size={13}
          color={C.textMuted}
        />
        <Text style={styles.emergencyFooterText}>
          {buzzerDisabled && pumpDisabled
            ? "Appareils désactivés — intervention des secours requise"
            : "Appuyez pour désactiver — action irréversible depuis cette interface"}
        </Text>
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────
// DashboardScreen
// ─────────────────────────────────────────────────────────────────────
export const DashboardScreen = ({ onZone, onAlert }) => {
  const { user, token } = useAuth();

  const [armed, setArmed] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // ── Recent alerts (last 3, all zones combined) ────────────────────
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const switchAnim = useRef(new Animated.Value(1)).current;

  // ── Helper: keep only the 3 most recent alerts, sorted desc ───────
  const mergeAndTrim = (existing, incoming) => {
    const map = new Map(existing.map((a) => [a.id, a]));
    incoming.forEach((a) => map.set(a.id, a));
    return [...map.values()]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  };

  // ── Load zones ────────────────────────────────────────────────────
  const loadZones = useCallback(async () => {
    if (!token) return;
    setZonesError("");
    const result = await zoneService.getMyZones(token);
    if (result.success) {
      setZones(result.data);
      return result.data; // return for chaining
    } else {
      setZonesError(result.error || "Erreur lors du chargement des zones.");
      return [];
    }
  }, [token]);

  // ── Load recent alerts across all zones (same logic as AlertsScreen)
  const loadRecentAlerts = useCallback(
    async (zoneList) => {
      if (!token || !zoneList?.length) return;
      setAlertsLoading(true);
      try {
        // Fetch alerts for every zone in parallel, exactly like AlertsScreen
        const results = await Promise.all(
          zoneList.map((z) => alertService.getAlertsByZone(z.id, token)),
        );

        // Flatten, attach zone name, sort desc, keep 3
        const allAlerts = results.flatMap((res, i) =>
          (res.data ?? []).map((a) => ({
            ...a,
            zoneName: zoneList[i]?.name ?? `Zone ${a.zoneId}`,
          })),
        );

        setRecentAlerts(
          allAlerts
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3),
        );
      } catch (err) {
        console.error("loadRecentAlerts error:", err);
      } finally {
        setAlertsLoading(false);
      }
    },
    [token],
  );

  // ── Initial load: zones then alerts ──────────────────────────────
  useEffect(() => {
    (async () => {
      setZonesLoading(true);
      const zoneList = await loadZones();
      setZonesLoading(false);
      await loadRecentAlerts(zoneList);
    })();
  }, [loadZones, loadRecentAlerts]);

  // ── Pull-to-refresh ───────────────────────────────────────────────
  const onRefresh = async () => {
    setRefreshing(true);
    const zoneList = await loadZones();
    await loadRecentAlerts(zoneList);
    setRefreshing(false);
  };

  // ── SignalR: zones status + real-time alert feed ──────────────────
  useEffect(() => {
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/alerts`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Zone status update
    connection.on("ZoneUpdated", (updatedZone) => {
      setZones((prev) => {
        const idx = prev.findIndex((z) => z.id === updatedZone.id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          ...updatedZone,
          name: next[idx].name, // never overwrite the name
          sensorCount: updatedZone.sensorCount ?? next[idx].sensorCount,
        };
        return next;
      });
    });

    // New alert received in real-time — update zones status AND recentAlerts
    connection.on("AlertReceived", (alert) => {
      // 1. Update zone status (same as before)
      if (alert.zoneId) {
        setZones((prev) => {
          const idx = prev.findIndex((z) => z.id === alert.zoneId);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = { ...next[idx], status: alert.level };

          // 2. Prepend to recentAlerts with the resolved zone name
          const zoneName = next[idx].name ?? `Zone ${alert.zoneId}`;
          setRecentAlerts((prevAlerts) =>
            mergeAndTrim(prevAlerts, [{ ...alert, zoneName }]),
          );

          return next;
        });
      }
    });

    connection
      .start()
      .then(() => console.log("SignalR Dashboard connected"))
      .catch((err) => console.error("SignalR error:", err));

    return () => connection.stop();
  }, [token]);

  // ── Derived values ────────────────────────────────────────────────
  const criticalZones = zones.filter((z) => {
    const s = (z.status || "").toUpperCase();
    return s === "ALERT" || s === "CRITICAL";
  });
  const activeAlertsCount = criticalZones.length;
  const showEmergency = activeAlertsCount > 0;
  const totalSensors = zones.reduce((acc, z) => acc + (z.sensorCount ?? 0), 0);

  const handleToggle = () => {
    if (armed) {
      setShowConfirm(true);
    } else {
      Animated.sequence([
        Animated.timing(switchAnim, {
          toValue: 0.95,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(switchAnim, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();
      setArmed(true);
    }
  };

  const getZoneStatus = (zone) => zone.status ?? "normal";

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Bonjour</Text>
          <Text style={styles.username}>
            {user ? `${user.firstName} ${user.lastName}` : "Utilisateur"}
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => onAlert(zones[0]?.id, zones[0]?.name)}
            style={styles.iconBtn}
          >
            <Ionicons name="notifications-outline" size={20} color={C.text} />
            {activeAlertsCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
          <View style={[styles.iconBtn, styles.avatarBtn]}>
            <Ionicons name="person-outline" size={20} color={C.orange} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.orange}
          />
        }
      >
        {/* ── Emergency Control ─────────────────────────────── */}
        {showEmergency && (
          <EmergencyControlCard
            zone={criticalZones[0]}
            token={token}
            deviceId={criticalZones[0]?.id}
          />
        )}

        {/* ── Critical Banner ────────────────────────────────── */}
        {criticalZones.length > 0 && (
          <View style={styles.criticalBanner}>
            <View style={styles.criticalBannerIcon}>
              <Ionicons name="flame" size={20} color={C.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.criticalTitle}>
                ALERTE — {criticalZones.map((z) => z.name).join(", ")}
              </Text>
              <Text style={styles.criticalSub}>
                {criticalZones.length} zone(s) critique(s) · Intervention
                requise
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                onAlert(criticalZones[0]?.id, criticalZones[0]?.name)
              }
              style={styles.criticalViewBtn}
            >
              <Text style={styles.criticalViewText}>VOIR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Surveillance Toggle ───────────────────────────── */}
        <View style={styles.surveillanceCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.surveillanceTitle}>Surveillance Globale</Text>
            <View style={styles.surveillanceStatus}>
              {armed ? (
                <>
                  <PulseDot color={C.green} size={7} />
                  <Text
                    style={[styles.surveillanceStatusText, { color: C.green }]}
                  >
                    {" "}
                    Système actif
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="pause-circle-outline"
                    size={14}
                    color={C.textSub}
                  />
                  <Text style={styles.surveillanceStatusText}> Désactivé</Text>
                </>
              )}
            </View>
          </View>
          <Animated.View style={{ transform: [{ scale: switchAnim }] }}>
            <TouchableOpacity
              onPress={handleToggle}
              activeOpacity={0.85}
              style={[
                styles.toggle,
                { backgroundColor: armed ? C.orange : C.border },
              ]}
            >
              <Animated.View
                style={[styles.toggleThumb, { left: armed ? 26 : 3 }]}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── Stats ─────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard
            icon="home-outline"
            iconColor={C.blue}
            value={zonesLoading ? "—" : zones.length}
            label="Zones"
            sub="actives"
          />
          <StatCard
            icon="alert-circle-outline"
            iconColor={activeAlertsCount > 0 ? C.red : C.green}
            value={activeAlertsCount}
            label="Alertes"
            sub="en cours"
            valueColor={activeAlertsCount > 0 ? C.red : C.green}
          />
          <StatCard
            icon="radio-outline"
            iconColor={C.orange}
            value={zonesLoading ? "—" : totalSensors}
            label="Capteurs"
            sub="enregistrés"
          />
        </View>

        {/* ── Mes Zones ────────────────────────────────────── */}
        <View>
          <SectionHeader
            title="Mes Zones"
            action="Tout voir"
            onAction={() => {}}
          />

          {zonesLoading && (
            <View style={styles.centeredBox}>
              <ActivityIndicator size="small" color={C.orange} />
              <Text style={styles.loadingText}>Chargement des zones...</Text>
            </View>
          )}

          {!zonesLoading && zonesError !== "" && (
            <View style={styles.errorBox}>
              <Ionicons name="warning-outline" size={14} color={C.red} />
              <Text style={styles.errorText}>{zonesError}</Text>
              <TouchableOpacity
                onPress={() => onRefresh()}
                style={{ marginTop: 8 }}
              >
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )}

          {!zonesLoading && zonesError === "" && zones.length === 0 && (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="home-outline" size={28} color={C.textMuted} />
              </View>
              <Text style={styles.emptyText}>Aucune zone configurée</Text>
              <Text style={styles.emptySubText}>
                Contactez votre administrateur pour ajouter des zones.
              </Text>
            </View>
          )}

          {!zonesLoading && zones.length > 0 && (
            <View style={styles.zonesGrid}>
              {zones.map((zone) => {
                const status = getZoneStatus(zone);
                const isDanger = ["PRE_ALERT", "ALERT", "CRITICAL"].includes(
                  status,
                );
                return (
                  <TouchableOpacity
                    key={zone.id}
                    onPress={() => onZone(zone)}
                    activeOpacity={0.8}
                    style={[styles.zoneCard, isDanger && styles.zoneCardDanger]}
                  >
                    <View style={styles.zoneCardTop}>
                      <View
                        style={[
                          styles.zoneIconWrap,
                          {
                            backgroundColor: isDanger ? C.redDim : C.orangeDim,
                          },
                        ]}
                      >
                        <Ionicons
                          name={getZoneIcon(zone.name)}
                          size={20}
                          color={isDanger ? C.red : C.orange}
                        />
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor: getStatusColor(status) + "18",
                            borderColor: getStatusColor(status) + "40",
                          },
                        ]}
                      >
                        <PulseDot color={getStatusColor(status)} size={5} />
                        <Text
                          style={[
                            styles.statusPillText,
                            { color: getStatusColor(status) },
                          ]}
                        >
                          {" "}
                          {getStatusLabel(status).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.zoneName}>{zone.name}</Text>
                    <Text style={styles.zoneInfo}>
                      <Ionicons
                        name="radio-outline"
                        size={10}
                        color={C.textMuted}
                      />{" "}
                      {zone.sensorCount ?? 0} capteur
                      {(zone.sensorCount ?? 0) !== 1 ? "s" : ""}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Alertes Récentes (3 dernières, temps réel) ──────── */}
        <View>
          <SectionHeader
            title="Alertes Récentes"
            action="Historique"
            onAction={() => onAlert(zones[0]?.id, zones[0]?.name)}
          />

          {/* Chargement initial */}
          {alertsLoading && (
            <View style={styles.centeredBox}>
              <ActivityIndicator size="small" color={C.orange} />
              <Text style={styles.loadingText}>Chargement des alertes...</Text>
            </View>
          )}

          {/* Aucune alerte */}
          {!alertsLoading && recentAlerts.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons
                name="checkmark-circle-outline"
                size={28}
                color={C.green}
              />
              <Text style={styles.emptyText}>Aucune alerte récente</Text>
            </View>
          )}

          {/* Liste des 3 dernières alertes */}
          {recentAlerts.map((alert) => {
            const levelColor = getLevelColor(alert.level);
            return (
              <TouchableOpacity
                key={alert.id}
                onPress={() => onAlert(alert.zoneId, alert.zoneName)}
                activeOpacity={0.8}
                style={[
                  styles.alertRow,
                  { borderLeftColor: levelColor, borderLeftWidth: 3 },
                ]}
              >
                {/* Icône niveau */}
                <View
                  style={[
                    styles.alertIconWrap,
                    { backgroundColor: levelColor + "15" },
                  ]}
                >
                  <Ionicons
                    name={
                      alert.level === "CRITICAL"
                        ? "flame-outline"
                        : alert.level === "ALERT"
                          ? "warning-outline"
                          : "information-circle-outline"
                    }
                    size={18}
                    color={levelColor}
                  />
                </View>

                {/* Corps */}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.alertRowTitle} numberOfLines={1}>
                    {alert.message}
                  </Text>
                  <Text style={styles.alertRowSub}>
                    {alert.zoneName} · {getTypeLabel(alert.type)} · Valeur :{" "}
                    <Text style={{ color: levelColor, fontWeight: "700" }}>
                      {Number(alert.value).toFixed(1)}
                    </Text>
                  </Text>
                  <Text style={styles.alertRowTime}>
                    {new Date(alert.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>

                {/* Badge niveau */}
                <View
                  style={[
                    styles.alertBadge,
                    {
                      backgroundColor: levelColor + "15",
                      borderColor: levelColor + "30",
                    },
                  ]}
                >
                  <Text style={[styles.alertBadgeText, { color: levelColor }]}>
                    {getLevelLabel(alert.level).toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Modal désactivation ───────────────────────────── */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalIconWrap}>
              <Ionicons name="shield-outline" size={32} color={C.red} />
            </View>
            <Text style={styles.modalTitle}>Désactiver la surveillance ?</Text>
            <Text style={styles.modalDesc}>
              Toutes les alertes seront suspendues. Cette action nécessite votre
              confirmation.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowConfirm(false)}
                style={[styles.modalBtn, styles.modalBtnSecondary]}
              >
                <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setArmed(false);
                  setShowConfirm(false);
                }}
                style={[styles.modalBtn, styles.modalBtnDanger]}
              >
                <Text style={styles.modalBtnDangerText}>Désactiver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── Sub-components ────────────────────────────────────────────────────

const StatCard = ({ icon, iconColor, value, label, sub, valueColor }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: iconColor + "15" }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <Text style={[styles.statValue, { color: valueColor ?? C.text }]}>
      {value}
    </Text>
    <Text style={styles.statSub}>{sub}</Text>
  </View>
);

const SectionHeader = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity onPress={onAction} style={styles.sectionAction}>
      <Text style={styles.sectionActionText}>{action}</Text>
      <Ionicons name="arrow-forward-outline" size={13} color={C.orange} />
    </TouchableOpacity>
  </View>
);

const getZoneIcon = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("salon") || n.includes("living")) return "tv-outline";
  if (n.includes("cuisine") || n.includes("kitchen"))
    return "restaurant-outline";
  if (n.includes("chambre") || n.includes("bedroom")) return "bed-outline";
  if (n.includes("bureau") || n.includes("office")) return "desktop-outline";
  if (n.includes("garage")) return "car-outline";
  if (n.includes("jardin") || n.includes("garden")) return "leaf-outline";
  if (n.includes("entree") || n.includes("entrée") || n.includes("hall"))
    return "door-open-outline";
  if (n.includes("salle de bain") || n.includes("bathroom"))
    return "water-outline";
  return "home-outline";
};

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerLeft: { gap: 2 },
  greeting: { fontSize: 12, color: C.textSub, fontWeight: "500" },
  username: {
    fontSize: 19,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.3,
  },
  headerIcons: { flexDirection: "row", gap: 10 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarBtn: { backgroundColor: C.orange + "15", borderColor: C.orange + "30" },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
    borderWidth: 2,
    borderColor: C.card,
  },

  content: { padding: 16, gap: 14 },

  // Emergency Card
  emergencyCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.red + "40",
    overflow: "hidden",
  },
  emergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: C.red + "08",
  },
  emergencyIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.red + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.2,
  },
  emergencySubtitle: {
    fontSize: 12,
    color: C.red,
    fontWeight: "600",
    marginTop: 1,
  },
  criticalPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.red + "18",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
    borderWidth: 1,
    borderColor: C.red + "30",
  },
  criticalPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.red,
  },
  criticalPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: C.red,
    letterSpacing: 0.5,
  },
  emergencyDivider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 14,
  },
  emergencyActions: { flexDirection: "row", gap: 10, padding: 14 },
  emergencyBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 90,
  },
  emergencyBtnLabel: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.1,
  },
  emergencyBtnBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  emergencyBtnBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  emergencyFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  emergencyFooterText: { fontSize: 10, color: C.textMuted, flex: 1 },

  // Critical Banner
  criticalBanner: {
    backgroundColor: C.red + "0D",
    borderWidth: 1,
    borderColor: C.red + "30",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  criticalBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.red + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  criticalTitle: { fontSize: 13, fontWeight: "700", color: C.red },
  criticalSub: { fontSize: 11, color: C.textSub, marginTop: 2 },
  criticalViewBtn: {
    backgroundColor: C.red,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  criticalViewText: { fontSize: 11, fontWeight: "800", color: "#fff" },

  // Surveillance
  surveillanceCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  surveillanceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.2,
  },
  surveillanceStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  surveillanceStatusText: { fontSize: 12, color: C.textSub, fontWeight: "500" },
  toggle: {
    width: 54,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    position: "relative",
  },
  toggleThumb: {
    position: "absolute",
    top: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },

  // Stats
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.5,
  },
  statSub: { fontSize: 10, color: C.textMuted, fontWeight: "500" },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.3,
  },
  sectionAction: { flexDirection: "row", alignItems: "center", gap: 3 },
  sectionActionText: { fontSize: 12, color: C.orange, fontWeight: "600" },

  // Zones Grid
  zonesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  zoneCard: {
    width: "47%",
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 4,
  },
  zoneCardDanger: { borderColor: C.red + "40", backgroundColor: C.red + "05" },
  zoneCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  zoneIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
  },
  statusPillText: { fontSize: 8, fontWeight: "800", letterSpacing: 0.3 },
  zoneName: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.1,
  },
  zoneInfo: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  // Alert Row — style amélioré pour les vraies alertes
  alertRow: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  alertIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  alertRowTitle: { fontSize: 13, fontWeight: "600", color: C.text },
  alertRowSub: { fontSize: 11, color: C.textSub },
  alertRowTime: { fontSize: 10, color: C.textMuted, marginTop: 1 },
  alertBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  alertBadgeText: { fontSize: 9, fontWeight: "800" },

  // Empty / Error / Loading
  centeredBox: { alignItems: "center", padding: 30, gap: 8 },
  loadingText: { color: C.textSub, fontSize: 12 },
  emptyBox: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 30,
    alignItems: "center",
    gap: 8,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyText: { fontSize: 14, fontWeight: "600", color: C.textSub },
  emptySubText: { fontSize: 12, color: C.textMuted, textAlign: "center" },
  errorBox: {
    backgroundColor: C.red + "0D",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.red + "30",
    alignItems: "center",
    gap: 4,
  },
  errorText: { fontSize: 12, color: C.red, fontWeight: "600" },
  retryText: { fontSize: 12, color: C.orange, fontWeight: "700" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    marginBottom: 20,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: C.red + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 13,
    color: C.textSub,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  modalButtons: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnSecondary: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalBtnSecondaryText: { fontSize: 14, fontWeight: "600", color: C.textSub },
  modalBtnDanger: { backgroundColor: C.red },
  modalBtnDangerText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});

export default DashboardScreen;
