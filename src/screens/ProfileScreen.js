import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Card from "../components/Card";
import Toggle from "../components/Toggle";
import { useAuth } from "../context/Authcontext";
import {
  getSensorConfig,
  setSensorConfig,
} from "../services/Sensorconfigservice";
import { sensorService } from "../services/sensorService";
import { zoneService } from "../services/ZoneService";
import { Colors } from "../theme/colors";

const DEFAULTS = {
  TEMPERATURE: { preAlert: 40, alert: 50, critical: 60 },
  GAS: { preAlert: 800, alert: 1500, critical: 2500 },
};

const RANGES = {
  TEMPERATURE: { min: 25, max: 80, unit: "°C", step: 1 },
  GAS: { min: 100, max: 3000, unit: " ppm", step: 50 },
};

const SLIDER_ROWS = [
  { key: "preAlert", label: "Pré-alerte", color: "#F39C12" },
  { key: "alert", label: "Alerte", color: "#E67E22" },
  { key: "critical", label: "Critique", color: "#E74C3C" },
];

// ─────────────────────────────────────────────────────────────────────────────
export const ProfileScreen = ({ onBack, onLogout, onChangePassword }) => {
  const { user, logout, token } = useAuth();

  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);

  const [sensors, setSensors] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);

  const [thresholds, setThresholds] = useState({
    TEMPERATURE: { ...DEFAULTS.TEMPERATURE },
    GAS: { ...DEFAULTS.GAS },
  });

  const [saving, setSaving] = useState({ TEMPERATURE: false, GAS: false });
  const [errors, setErrors] = useState({ TEMPERATURE: null, GAS: null });

  // ── Charger zones → pour chaque zone, fetch ses capteurs ─────────────────
  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setLoadingZones(true);
      try {
        // 1. Récupère les zones de l'utilisateur
        const { success, data: zones } = await zoneService.getMyZones(token);
        if (!success || !zones?.length) return;

        // 2. Pour chaque zone, récupère ses capteurs via /api/sensors/by-zone/{id}
        const results = await Promise.all(
          zones.map((zone) => sensorService.getByZone(zone.id, token)),
        );

        const allSensors = results.flatMap((r) => (r.success ? r.data : []));
        console.log("Capteurs chargés :", JSON.stringify(allSensors, null, 2));
        setSensors(allSensors);

        // 3. Charge les configs existantes (un capteur par type)
        const byType = {};
        allSensors.forEach((s) => {
          const t = s.type?.toUpperCase();
          if (t && !byType[t]) byType[t] = s.id;
        });

        const updates = {};
        await Promise.all(
          Object.entries(byType).map(async ([type, sensorId]) => {
            try {
              const config = await getSensorConfig(sensorId, token);
              if (config) {
                updates[type] = {
                  preAlert: config.preAlertThreshold,
                  alert: config.alertThreshold,
                  critical: config.criticalThreshold,
                };
              }
            } catch (_) {}
          }),
        );

        if (Object.keys(updates).length) {
          setThresholds((prev) => ({ ...prev, ...updates }));
        }
      } catch (e) {
        console.log("Erreur chargement capteurs:", e);
      } finally {
        setLoadingZones(false);
      }
    };

    load();
  }, [token]);

  // ── Mise à jour locale pendant le glissement ──────────────────────────────
  const handleChange = (type, key, value) => {
    setThresholds((prev) => ({
      ...prev,
      [type]: { ...prev[type], [key]: Math.round(value) },
    }));
  };

  // ── Auto-save au relâchement → POST /api/sensor-configurations ───────────
  const handleSlidingComplete = async (type, key, value) => {
    const updated = { ...thresholds[type], [key]: Math.round(value) };

    if (updated.preAlert > updated.alert || updated.alert > updated.critical) {
      setErrors((prev) => ({
        ...prev,
        [type]: "Ordre invalide : pré-alerte ≤ alerte ≤ critique",
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, [type]: null }));

    const sensor = sensors.find((s) => s.type?.toUpperCase() === type);
    if (!sensor) return;

    setSaving((prev) => ({ ...prev, [type]: true }));
    try {
      await setSensorConfig(
        {
          sensorId: sensor.id,
          preAlertThreshold: updated.preAlert,
          alertThreshold: updated.alert,
          criticalThreshold: updated.critical,
        },
        token,
      );
      setThresholds((prev) => ({ ...prev, [type]: updated }));
      console.log(`✅ Seuils ${type} sauvegardés`);
    } catch (e) {
      setErrors((prev) => ({ ...prev, [type]: "Erreur de sauvegarde." }));
    } finally {
      setSaving((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  const initials = user
    ? `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`
    : "?";
  const fullName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "Utilisateur";

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
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
            <Ionicons
              name={user?.role === "Admin" ? "shield-checkmark" : "home"}
              size={13}
              color={Colors.fire}
            />
            <Text style={styles.roleText}>
              {user?.role === "Admin" ? "Administrateur" : "Occupant"}
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
            <Ionicons
              name={user?.isActive ? "checkmark-circle" : "time"}
              size={12}
              color={user?.isActive ? Colors.safe : Colors.danger}
            />
            <Text
              style={[
                styles.activeText,
                {
                  color: user?.isActive ? Colors.safe : Colors.danger,
                },
              ]}
            >
              {user?.isActive ? "Compte actif" : "En attente de validation"}
            </Text>
          </View>
        </View>

        {/* ── Notifications ── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <Card style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
            <View style={[styles.row, styles.rowBorder]}>
              <Ionicons
                name="notifications"
                size={18}
                color={Colors.textSecondary}
                style={styles.rowIcon}
              />
              <Text style={styles.rowLabel}>Notifications Push</Text>
              <Toggle value={notifPush} onChange={setNotifPush} />
            </View>
            <View style={styles.row}>
              <Ionicons
                name="mail"
                size={18}
                color={Colors.textSecondary}
                style={styles.rowIcon}
              />
              <Text style={styles.rowLabel}>Alertes par Email</Text>
              <Toggle value={notifEmail} onChange={setNotifEmail} />
            </View>
          </Card>
        </View>

        {/* ── Seuils ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>SEUILS DE DÉTECTION</Text>
            {loadingZones && (
              <ActivityIndicator size="small" color={Colors.fire} />
            )}
          </View>

          {loadingZones ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.fire} />
              <Text style={styles.loadingText}>Chargement des capteurs…</Text>
            </View>
          ) : sensors.length === 0 ? (
            <View style={styles.noSensorBanner}>
              <Ionicons
                name="information-circle"
                size={15}
                color={Colors.textMuted}
              />
              <Text style={styles.noSensorText}>
                Aucun capteur trouvé dans vos zones.
              </Text>
            </View>
          ) : (
            ["TEMPERATURE", "GAS"].map((type) => {
              const hasSensor = sensors.some(
                (s) => s.type?.toUpperCase() === type,
              );
              if (!hasSensor) return null;
              const meta = {
                TEMPERATURE: {
                  icon: "thermometer",
                  label: "Température",
                  color: Colors.warn,
                },
                GAS: { icon: "flask", label: "Gaz", color: Colors.danger },
              }[type];
              return (
                <ThresholdCard
                  key={type}
                  icon={meta.icon}
                  label={meta.label}
                  color={meta.color}
                  thresholds={thresholds[type]}
                  range={RANGES[type]}
                  saving={saving[type]}
                  error={errors[type]}
                  onChange={(k, v) => handleChange(type, k, v)}
                  onSlidingComplete={(k, v) =>
                    handleSlidingComplete(type, k, v)
                  }
                />
              );
            })
          )}
        </View>

        {/* ── Accès & Urgence ── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>ACCÈS & URGENCE</Text>
          <View style={styles.linkSection}>
            <TouchableOpacity
              onPress={() => {}}
              activeOpacity={0.6}
              style={[styles.linkRow, styles.rowBorder]}
            >
              <Ionicons
                name="alert-circle"
                size={18}
                color={Colors.danger}
                style={styles.rowIcon}
              />
              <Text style={styles.rowLabel}>Contacts d'urgence</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onChangePassword}
              activeOpacity={0.6}
              style={styles.linkRow}
            >
              <Ionicons
                name="lock-closed"
                size={18}
                color={Colors.textSecondary}
                style={styles.rowIcon}
              />
              <Text style={styles.rowLabel}>Changer le mot de passe</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Déconnexion ── */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.85}
          style={styles.logoutBtn}
        >
          <Ionicons name="log-out" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const ThresholdCard = ({
  icon,
  label,
  color,
  thresholds,
  range,
  saving,
  error,
  onChange,
  onSlidingComplete,
}) => (
  <Card style={styles.thresholdCard}>
    <View style={styles.thresholdHeader}>
      <View style={styles.sliderLabelRow}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={[styles.thresholdTitle, { color }]}>{label}</Text>
      </View>
      {saving ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Text style={styles.autoSaveHint}>Sauvegarde auto</Text>
      )}
    </View>

    {error && (
      <View style={styles.errorBanner}>
        <Ionicons name="warning" size={13} color={Colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )}

    {SLIDER_ROWS.map(({ key, label: rowLabel, color: rowColor }) => (
      <View key={key} style={styles.sliderBlock}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{rowLabel}</Text>
          <Text style={[styles.sliderValue, { color: rowColor }]}>
            {thresholds[key]}
            {range.unit}
          </Text>
        </View>
        <Slider
          minimumValue={range.min}
          maximumValue={range.max}
          step={range.step}
          value={thresholds[key]}
          onValueChange={(v) => onChange(key, v)}
          onSlidingComplete={(v) => onSlidingComplete(key, v)}
          minimumTrackTintColor={rowColor}
          maximumTrackTintColor={Colors.border}
          thumbTintColor={rowColor}
        />
        <View style={styles.sliderRange}>
          <Text style={styles.rangeText}>
            {range.min}
            {range.unit}
          </Text>
          <Text style={styles.rangeText}>
            {range.max}
            {range.unit}
          </Text>
        </View>
      </View>
    ))}
    <Text style={styles.orderHintText}>Pré-alerte ≤ Alerte ≤ Critique</Text>
  </Card>
);

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
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
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  content: { padding: 20, gap: 20 },

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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.fireDim,
    borderWidth: 1,
    borderColor: Colors.fire + "40",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  roleText: { fontSize: 12, color: Colors.fire, fontWeight: "600" },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  activeText: { fontSize: 11, fontWeight: "600" },

  sectionWrap: { gap: 10 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: { width: 24, alignItems: "center" },
  rowLabel: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: "500" },

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

  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingText: { fontSize: 13, color: Colors.textSecondary },
  noSensorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noSensorText: { fontSize: 12, color: Colors.textMuted, flex: 1 },

  thresholdCard: { paddingHorizontal: 0, paddingVertical: 0, marginBottom: 10 },
  thresholdHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  thresholdTitle: { fontSize: 14, fontWeight: "700", marginLeft: 6 },
  autoSaveHint: { fontSize: 10, color: Colors.textMuted, fontStyle: "italic" },
  sliderLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.dangerDim,
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  errorText: { fontSize: 11, color: Colors.danger, flex: 1 },
  sliderBlock: { paddingHorizontal: 16, paddingVertical: 8 },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sliderLabel: { fontSize: 13, color: Colors.textSecondary },
  sliderValue: { fontSize: 13, fontWeight: "700" },
  sliderRange: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  rangeText: { fontSize: 10, color: Colors.textMuted },
  orderHintText: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
    paddingBottom: 12,
  },

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
  logoutText: { fontSize: 15, fontWeight: "700", color: Colors.danger },
});

export default ProfileScreen;
