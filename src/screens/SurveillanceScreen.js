import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/Authcontext";
import { PulseDot } from "../components/PulseDot";
import { systemStateService } from "../services/SystemStateService";
import { Colors } from "../theme/colors";

const STATUS_LABELS = {
  ENABLED: "Système actif",
  DISABLED: "Système inactif",
};

const getStatusLabel = (status, isActive) =>
  STATUS_LABELS[status] || (isActive ? "Système actif" : "Système inactif");

const getStatusTextColor = (isActive) =>
  isActive ? Colors.safe : Colors.textMuted;

export const SurveillanceScreen = ({ onBack }) => {
  const { user, token } = useAuth();

  const [systemState, setSystemState] = useState({ isActive: false, status: "DISABLED" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [offReason, setOffReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const switchAnim = useRef(new Animated.Value(1)).current;

  const loadSystemState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await systemStateService.getStatus(token);
      if (result.success && result.data) {
        setSystemState(result.data);
      } else {
        setError(result.error || "Impossible de charger l'état du système.");
      }
    } catch (err) {
      setError("Impossible de charger l'état du système.");
      console.error("loadSystemState error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSystemState();
  }, [loadSystemState]);

  const refreshState = async () => {
    setRefreshing(true);
    await loadSystemState();
    setRefreshing(false);
  };

  const animateSwitch = () => {
    Animated.sequence([
      Animated.timing(switchAnim, {
        toValue: 0.95,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(switchAnim, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTogglePress = () => {
    if (loading || saving) return;
    if (systemState.isActive) {
      setConfirmVisible(true);
      setReasonError("");
      setOffReason("");
    } else {
      animateSwitch();
      submitToggle(true);
    }
  };

  const submitToggle = async (activate, reason = null) => {
    setSaving(true);
    setError(null);
    setFeedback(null);

    const payload = {
      isActive: activate,
      actionBy: user?.email || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "mobile",
    };
    if (reason) {
      payload.reason = reason;
    }

    try {
      const result = await systemStateService.toggleState(payload, token);
      if (!result.success) {
        throw new Error(result.error || "Erreur lors de la mise à jour du système.");
      }

      const nextState = result.data ?? { isActive: activate, status: activate ? "ENABLED" : "DISABLED" };
      setSystemState(nextState);
      setFeedback(activate ? "Surveillance globale activée." : "Surveillance globale désactivée.");
      setConfirmVisible(false);
      setOffReason("");
    } catch (err) {
      const message = err?.message || "Impossible de mettre à jour le système.";
      setError(message);
      Alert.alert("Erreur", message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDisable = () => {
    if (!offReason.trim()) {
      setReasonError("Une raison est requise pour désactiver la surveillance.");
      return;
    }
    animateSwitch();
    submitToggle(false, offReason.trim());
  };

  const statusLabel = getStatusLabel(systemState.status, systemState.isActive);
  const statusColor = getStatusTextColor(systemState.isActive);
  const toggleLabel = systemState.isActive ? "Désactiver" : "Activer";

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshState}
            tintColor={Colors.fire}
          />
        }
      >
        <View style={styles.header}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color={Colors.text} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.headerText}>
            <Text style={styles.title}>Surveillance Globale</Text>
            <Text style={styles.subtitle}>
              Commandez le système et suivez l'état en direct.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Statut du système</Text>
              <View style={styles.statusRow}>
                {systemState.isActive ? (
                  <PulseDot color={Colors.safe} size={8} />
                ) : (
                  <Ionicons name="pause-circle-outline" size={14} color={Colors.textMuted} />
                )}
                <Text style={[styles.statusText, { color: statusColor }]}> {statusLabel}</Text>
              </View>
              <Text style={styles.description}>
                {loading
                  ? "Chargement du statut…"
                  : "Le système surveille actuellement votre installation."}
              </Text>
            </View>
            <Animated.View style={{ transform: [{ scale: switchAnim }] }}>
              <TouchableOpacity
                onPress={handleTogglePress}
                activeOpacity={0.85}
                style={[
                  styles.toggle,
                  {
                    backgroundColor: systemState.isActive
                      ? Colors.fire
                      : Colors.border,
                  },
                ]}
                disabled={loading || saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Animated.View
                    style={[
                      styles.toggleThumb,
                      {
                        left: systemState.isActive ? 26 : 3,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {feedback ? <Text style={styles.successText}>{feedback}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {!loading && !error ? (
            <Text style={styles.ctaText}>
              Appuyez sur le bouton pour {toggleLabel.toLowerCase()} la surveillance.
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmer la désactivation</Text>
            <Text style={styles.modalSubtitle}>
              Cette action arrêtera la surveillance globale. Précisez la raison.
            </Text>
            <TextInput
              placeholder="Raison de l'arrêt"
              placeholderTextColor={Colors.textMuted}
              value={offReason}
              onChangeText={(text) => {
                setOffReason(text);
                if (reasonError) setReasonError("");
              }}
              multiline
              numberOfLines={3}
              style={styles.textInput}
              editable={!saving}
            />
            {reasonError ? (
              <Text style={styles.errorText}>{reasonError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setConfirmVisible(false)}
                style={[styles.modalButton, styles.cancelButton]}
                disabled={saving}
              >
                <Text style={styles.cancelLabel}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDisable}
                style={[styles.modalButton, styles.confirmButton]}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmLabel}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },
  subtitle: {
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  card: {
    borderRadius: 20,
    backgroundColor: Colors.card,
    padding: 20,
    shadowColor: Colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardInfo: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
  },
  description: {
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  toggle: {
    width: 52,
    height: 28,
    borderRadius: 16,
    justifyContent: "center",
    shadowColor: Colors.text,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    position: "absolute",
    left: 3,
    top: 3,
  },
  ctaText: {
    marginTop: 18,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  successText: {
    marginTop: 18,
    color: Colors.safe,
    fontWeight: "600",
  },
  errorText: {
    marginTop: 18,
    color: Colors.danger,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.bg,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.text,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  textInput: {
    minHeight: 90,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    backgroundColor: Colors.surface,
    color: Colors.text,
    textAlignVertical: "top",
  },
  modalActions: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: Colors.fire,
  },
  cancelLabel: {
    color: Colors.textSecondary,
    fontWeight: "700",
  },
  confirmLabel: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default SurveillanceScreen;
