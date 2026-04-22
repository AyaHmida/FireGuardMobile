import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../components/Button";
import { Card } from "../components/Card";
import { PulseDot } from "../components/PulseDot";
import { ALERTS } from "../constants/mockData";
import { useAuth } from "../context/Authcontext";
import { zoneService } from "../services/ZoneService";
import { Colors } from "../theme/colors";
import { getStatusColor, getStatusLabel } from "../utils/helpers";

export const DashboardScreen = ({ onZone, onAlert }) => {
  const { user, token } = useAuth();

  const [armed, setArmed] = useState(true);
  const [tick, setTick] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const activeAlerts = ALERTS.filter((a) => !a.resolved);

  const loadZones = useCallback(async () => {
    if (!token) return;
    setZonesError("");
    const result = await zoneService.getMyZones(token);
    if (result.success) {
      setZones(result.data);
    } else {
      setZonesError(result.error || "Erreur lors du chargement des zones.");
    }
    setZonesLoading(false);
    setRefreshing(false);
  }, [token]);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadZones();
  };

  const criticalZones = zones.filter((z) => z.status === "danger");

  const handleToggle = () => {
    if (armed) setShowConfirm(true);
    else setArmed(true);
  };

  const getZoneStatus = (zone) => zone.status ?? "normal";

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.username}>
            {user ? `${user.firstName} ${user.lastName}` : "..."}
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => onAlert()} style={styles.iconBtn}>
            <Ionicons name="notifications" size={20} color={Colors.text} />
            {activeAlerts.length > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
          <View
            style={[
              styles.iconBtn,
              {
                backgroundColor: Colors.fireDim,
                borderColor: Colors.fire + "40",
              },
            ]}
          >
            <Ionicons name="person" size={20} color={Colors.fire} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.fire}
          />
        }
      >
        {/* ── Alerte critique ──────────────────────────────── */}
        {criticalZones.length > 0 && (
          <View style={styles.criticalBanner}>
            <Ionicons name="warning" size={28} color={Colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={styles.criticalTitle}>
                ALERTE CRITIQUE — {criticalZones.map((z) => z.name).join(", ")}
              </Text>
              <Text style={styles.criticalSub}>
                {activeAlerts.length} alertes actives · Intervention requise
              </Text>
            </View>
            <Button
              label="VOIR"
              variant="danger"
              size="sm"
              onPress={() => onAlert()}
            />
          </View>
        )}

        {/* ── Toggle surveillance ───────────────────────────── */}
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
                      {" "}
                      Système actif
                    </Text>
                  </>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons
                      name="pause-circle"
                      size={14}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.toggleStatusText}> Désactivé</Text>
                  </View>
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

        {/* ── Stats ────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {[
            {
              label: "Zones",
              value: zonesLoading ? "..." : zones.length,
              sub: "actives",
              icon: <Ionicons name="home" size={22} color={Colors.info} />,
              color: Colors.info,
            },
            {
              label: "Alertes",
              value: activeAlerts.length,
              sub: "en cours",
              icon: (
                <Ionicons
                  name="alert-circle"
                  size={22}
                  color={activeAlerts.length > 0 ? Colors.danger : Colors.safe}
                />
              ),
              color: activeAlerts.length > 0 ? Colors.danger : Colors.safe,
            },
            {
              label: "Capteurs",
              value: zonesLoading
                ? "..."
                : zones.reduce((acc, z) => acc + (z.sensorCount ?? 0), 0),
              sub: "enregistrés",
              icon: <Ionicons name="radio" size={22} color={Colors.safe} />,
              color: Colors.safe,
            },
          ].map((s, i) => (
            <Card key={i} style={{ flex: 1 }}>
              <View style={{ alignItems: "center" }}>
                <View style={{ marginBottom: 4 }}>{s.icon}</View>
                <Text
                  style={{ fontSize: 20, fontWeight: "800", color: s.color }}
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

        {/* ── Mes Zones ────────────────────────────────────── */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes Zones</Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text style={styles.sectionLink}>Tout voir</Text>
              <Ionicons name="arrow-forward" size={13} color={Colors.fire} />
            </View>
          </View>

          {/* Chargement */}
          {zonesLoading && (
            <View style={{ alignItems: "center", padding: 30 }}>
              <ActivityIndicator size="small" color={Colors.fire} />
              <Text
                style={{
                  color: Colors.textSecondary,
                  marginTop: 8,
                  fontSize: 12,
                }}
              >
                Chargement des zones...
              </Text>
            </View>
          )}

          {/* Erreur */}
          {!zonesLoading && zonesError !== "" && (
            <View style={styles.errorBox}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons name="warning" size={14} color={Colors.danger} />
                <Text style={styles.errorText}>{zonesError}</Text>
              </View>
              <TouchableOpacity onPress={loadZones} style={{ marginTop: 8 }}>
                <Text
                  style={{
                    color: Colors.fire,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Réessayer
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Vide */}
          {!zonesLoading && zonesError === "" && zones.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons
                name="home-outline"
                size={36}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>Aucune zone configurée</Text>
              <Text style={styles.emptySubText}>
                Contactez votre administrateur pour ajouter des zones.
              </Text>
            </View>
          )}

          {/* Grille zones */}
          {!zonesLoading && zones.length > 0 && (
            <View style={styles.zonesGrid}>
              {zones.map((zone) => {
                const status = getZoneStatus(zone);
                return (
                  <Card
                    key={zone.id}
                    interactive
                    status={status}
                    onPress={() => onZone(zone)}
                    style={styles.zoneCard}
                  >
                    <View style={styles.zoneCardTop}>
                      <Ionicons
                        name={getZoneIcon(zone.name)}
                        size={24}
                        color={Colors.fire}
                      />
                      <View style={styles.statusBadge}>
                        <PulseDot color={getStatusColor(status)} size={6} />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: getStatusColor(status) },
                          ]}
                        >
                          {" "}
                          {getStatusLabel(status)}
                        </Text>
                      </View>
                    </View>
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.zoneName}>{zone.name}</Text>
                      <Text style={styles.zoneInfo}>
                        {zone.sensorCount ?? 0} capteur
                        {(zone.sensorCount ?? 0) > 1 ? "s" : ""}
                      </Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Alertes récentes ─────────────────────────────── */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alertes Récentes</Text>
            <TouchableOpacity
              onPress={() => onAlert()}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text style={styles.sectionLink}>Historique</Text>
              <Ionicons name="arrow-forward" size={13} color={Colors.fire} />
            </TouchableOpacity>
          </View>
          {ALERTS.slice(0, 3).map((alert) => (
            <Card key={alert.id} style={{ marginBottom: 8 }}>
              <View style={styles.recentAlertRow}>
                <View style={styles.recentAlertIcon}>
                  <Ionicons
                    name={getAlertIcon(alert.type)}
                    size={18}
                    color={getAlertIconColor(alert.type)}
                  />
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

      {/* ── Modal confirmation désactivation ─────────────── */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name="warning"
              size={28}
              color={Colors.danger}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.modalTitle}>Désactiver la surveillance ?</Text>
            <Text style={styles.modalDesc}>
              Toutes les alertes seront suspendues. Confirmer l action.
            </Text>
            <View style={styles.modalButtons}>
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

// ── Helper : icône Ionicons par nom de zone ───────────────────────────
const getZoneIcon = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("salon") || n.includes("living")) return "tv-outline";
  if (n.includes("cuisine") || n.includes("kitchen"))
    return "restaurant-outline";
  if (n.includes("chambre") || n.includes("bedroom")) return "bed-outline";
  if (n.includes("bureau") || n.includes("office")) return "desktop-outline";
  if (n.includes("garage")) return "car-outline";
  if (n.includes("jardin") || n.includes("garden")) return "leaf-outline";
  if (n.includes("entrée") || n.includes("hall")) return "door-open-outline";
  if (n.includes("salle de bain") || n.includes("bathroom"))
    return "water-outline";
  return "home-outline";
};

// ── Helper : icône Ionicons par type d'alerte ─────────────────────────
const getAlertIcon = (type = "") => {
  if (type === "Fumée") return "cloud-outline";
  if (type === "Gaz") return "flask-outline";
  if (type === "Température") return "thermometer-outline";
  return "alert-circle-outline";
};

// ── Helper : couleur icône par type d'alerte ──────────────────────────
const getAlertIconColor = (type = "") => {
  if (type === "Fumée") return "#94A3B8";
  if (type === "Gaz") return "#A78BFA";
  if (type === "Température") return "#FB923C";
  return Colors?.danger ?? "#EF4444";
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  greeting: { fontSize: 12, color: Colors.textSecondary },
  username: { fontSize: 18, fontWeight: "700", color: Colors.text },
  headerIcons: { flexDirection: "row", gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifDot: {
    position: "absolute",
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
    borderColor: Colors.danger + "50",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  criticalTitle: { fontSize: 13, fontWeight: "700", color: Colors.danger },
  criticalSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  toggleTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  toggleStatus: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  toggleStatusText: { fontSize: 12, color: Colors.textSecondary },
  toggleSwitch: {
    width: 52,
    height: 28,
    borderRadius: 14,
    position: "relative",
    justifyContent: "center",
  },
  toggleThumb: {
    position: "absolute",
    top: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  statsRow: { flexDirection: "row", gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  sectionLink: { fontSize: 12, color: Colors.fire, fontWeight: "600" },
  zonesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  zoneCard: { width: "47%" },
  zoneCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.infoDim,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusBadgeText: { fontSize: 9, fontWeight: "700" },
  zoneName: { fontSize: 13, fontWeight: "700", color: Colors.text },
  zoneInfo: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  emptyBox: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 30,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  emptySubText: { fontSize: 12, color: Colors.textMuted, textAlign: "center" },
  errorBox: {
    backgroundColor: Colors.dangerDim,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.danger + "40",
    alignItems: "center",
  },
  errorText: { fontSize: 12, color: Colors.danger, fontWeight: "600" },
  recentAlertRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  recentAlertIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.infoDim,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  recentAlertTitle: { fontSize: 13, fontWeight: "600", color: Colors.text },
  recentAlertSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  recentAlertBadge: {
    backgroundColor: Colors.infoDim,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recentAlertBadgeText: { fontSize: 10, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
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
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  modalDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  modalButtons: { flexDirection: "row", gap: 12 },
});

export default DashboardScreen;
