import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Card from "../components/Card";
import { useAuth } from "../context/Authcontext";
import { emergencyService } from "../services/Emergencyservice";
import { Colors } from "../theme/colors";

// ─── Relationship options ──────────────────────────────────────────────────
const RELATIONSHIPS = [
  "Famille",
  "Ami(e)",
  "Collègue",
  "Médecin",
  "Voisin(e)",
  "Autre",
];

// ─── Contact card component ────────────────────────────────────────────────
const ContactCard = ({ contact, onDelete, deleting }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleDelete = () => {
    Alert.alert(
      "Supprimer le contact",
      `Voulez-vous supprimer ${contact.name} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start(() => onDelete(contact.id));
          },
        },
      ],
    );
  };

  const relationshipColor =
    {
      Famille: Colors.fire,
      "Ami(e)": Colors.safe,
      Collègue: "#6C63FF",
      Médecin: Colors.warn,
      "Voisin(e)": "#17A8C2",
      Autre: Colors.textSecondary,
    }[contact.relationship] ?? Colors.textSecondary;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Card style={styles.contactCard}>
        {/* Avatar */}
        <View
          style={[
            styles.contactAvatar,
            {
              backgroundColor: relationshipColor + "20",
              borderColor: relationshipColor + "40",
            },
          ]}
        >
          <Text style={[styles.contactInitial, { color: relationshipColor }]}>
            {contact.name?.charAt(0)?.toUpperCase() ?? "?"}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {contact.name}
          </Text>
          <View style={styles.contactMeta}>
            <Ionicons
              name="call-outline"
              size={12}
              color={Colors.textSecondary}
            />
            <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
          </View>
          <View
            style={[
              styles.relBadge,
              {
                backgroundColor: relationshipColor + "15",
                borderColor: relationshipColor + "30",
              },
            ]}
          >
            <Text style={[styles.relText, { color: relationshipColor }]}>
              {contact.relationship}
            </Text>
          </View>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.7}
          style={styles.deleteBtn}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={Colors.danger} />
          ) : (
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          )}
        </TouchableOpacity>
      </Card>
    </Animated.View>
  );
};

// ─── Add contact modal ─────────────────────────────────────────────────────
const AddContactModal = ({ visible, onClose, onSubmit, loading }) => {
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    relationship: "Famille",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Le nom est requis";
    if (!form.phoneNumber.trim()) e.phoneNumber = "Le numéro est requis";
    else if (!/^\+?[\d\s\-()]{7,}$/.test(form.phoneNumber.trim()))
      e.phoneNumber = "Numéro invalide";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    onSubmit({
      name: form.name.trim(),
      phoneNumber: form.phoneNumber.trim(),
      relationship: form.relationship,
    });
  };

  const handleClose = () => {
    setForm({ name: "", phoneNumber: "", relationship: "Famille" });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouveau contact</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Nom complet</Text>
            <View style={[styles.inputWrap, errors.name && styles.inputError]}>
              <Ionicons
                name="person-outline"
                size={16}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ex. Mohamed Ali"
                placeholderTextColor={Colors.textMuted}
                value={form.name}
                onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
              />
            </View>
            {errors.name && (
              <Text style={styles.fieldError}>{errors.name}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Numéro de téléphone</Text>
            <View
              style={[
                styles.inputWrap,
                errors.phoneNumber && styles.inputError,
              ]}
            >
              <Ionicons
                name="call-outline"
                size={16}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="+216 XX XXX XXX"
                placeholderTextColor={Colors.textMuted}
                value={form.phoneNumber}
                onChangeText={(v) => setForm((p) => ({ ...p, phoneNumber: v }))}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phoneNumber && (
              <Text style={styles.fieldError}>{errors.phoneNumber}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Relation</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipRow}
            >
              {RELATIONSHIPS.map((rel) => (
                <TouchableOpacity
                  key={rel}
                  onPress={() => setForm((p) => ({ ...p, relationship: rel }))}
                  style={[
                    styles.chip,
                    form.relationship === rel && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      form.relationship === rel && styles.chipTextActive,
                    ]}
                  >
                    {rel}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.85}
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add" size={18} color="#fff" />
                <Text style={styles.submitText}>Ajouter le contact</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Simulate call banner ──────────────────────────────────────────────────
const SimulateBanner = ({ onSimulate, simulating, simResult }) => (
  <View style={styles.simulateBanner}>
    <View style={styles.simulateInfo}>
      <View style={styles.simulatePulse}>
        <Ionicons name="call" size={18} color={Colors.danger} />
      </View>
      <View>
        <Text style={styles.simulateTitle}>Simulation d appel Twilio</Text>
        <Text style={styles.simulateSubtitle}>
          Teste l alerte vers tous les contacts
        </Text>
      </View>
    </View>
    <TouchableOpacity
      onPress={onSimulate}
      activeOpacity={0.8}
      style={[styles.simulateBtn, simulating && styles.simulateBtnDisabled]}
      disabled={simulating}
    >
      {simulating ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.simulateBtnText}>Simuler</Text>
      )}
    </TouchableOpacity>
    {!!simResult && (
      <View style={styles.simResultBanner}>
        <Ionicons name="checkmark-circle" size={14} color={Colors.safe} />
        <Text style={styles.simResultText}>{simResult}</Text>
      </View>
    )}
  </View>
);

// ─── Main screen ────────────────────────────────────────────────────────────
export const EmergencyContactsScreen = ({ onBack }) => {
  const { token } = useAuth();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [adding, setAdding] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { success, data, error } = await emergencyService.getContacts(token);
    if (success) setContacts(data);
    else setFetchError(error ?? "Erreur de chargement");
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // ── Add ────────────────────────────────────────────────────────────────
  const handleAdd = async (dto) => {
    setAdding(true);
    const { success, error } = await emergencyService.addContact(dto, token);
    setAdding(false);
    if (success) {
      setModalVisible(false);
      fetchContacts();
    } else {
      Alert.alert("Erreur", error ?? "Impossible d'ajouter le contact.");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeletingId(id);
    const { success, error } = await emergencyService.deleteContact(id, token);
    setDeletingId(null);
    if (success) setContacts((prev) => prev.filter((c) => c.id !== id));
    else Alert.alert("Erreur", error ?? "Impossible de supprimer.");
  };

  // ── Simulate call ──────────────────────────────────────────────────────
  const handleSimulate = async () => {
    if (contacts.length === 0) {
      Alert.alert("Aucun contact", "Ajoutez d'abord un contact d'urgence.");
      return;
    }
    setSimulating(true);
    setSimResult(null);
    const { success, message, error } =
      await emergencyService.simulateCall(token);
    setSimulating(false);
    if (success) {
      setSimResult(message);
      setTimeout(() => setSimResult(null), 5000);
    } else {
      Alert.alert("Erreur", error ?? "Simulation échouée.");
    }
  };

  // ── Empty state ────────────────────────────────────────────────────────
  const EmptyState = () => (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIcon}>
        <Ionicons name="people-outline" size={32} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Aucun contact d urgence</Text>
      <Text style={styles.emptySubtitle}>
        Ajoutez des contacts pour être alerté en cas d urgence
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Contacts d urgence</Text>
          {!loading && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{contacts.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Body ── */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Simulate banner */}
        <SimulateBanner
          onSimulate={handleSimulate}
          simulating={simulating}
          simResult={simResult}
        />

        {/* List section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>MES CONTACTS</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.fire} />
              <Text style={styles.loadingText}>Chargement des contacts…</Text>
            </View>
          ) : fetchError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorBoxText}>{fetchError}</Text>
              <TouchableOpacity onPress={fetchContacts} style={styles.retryBtn}>
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : contacts.length === 0 ? (
            <EmptyState />
          ) : (
            contacts.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                onDelete={handleDelete}
                deleting={deletingId === c.id}
              />
            ))
          )}
        </View>

        {/* Info note */}
        <View style={styles.infoNote}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={Colors.textMuted}
          />
          <Text style={styles.infoNoteText}>
            En cas d alarme critique, tous ces contacts seront notifiés
            automatiquement.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Add modal ── */}
      <AddContactModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAdd}
        loading={adding}
      />
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  countBadge: {
    backgroundColor: Colors.fireDim,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.fire + "40",
  },
  countText: { fontSize: 12, fontWeight: "700", color: Colors.fire },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.fire,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.fire,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  // Content
  content: { padding: 20, gap: 20 },

  // Simulate banner
  simulateBanner: {
    backgroundColor: Colors.dangerDim,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.danger + "30",
    gap: 12,
  },
  simulateInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  simulatePulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.danger + "20",
    borderWidth: 1,
    borderColor: Colors.danger + "40",
    alignItems: "center",
    justifyContent: "center",
  },
  simulateTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  simulateSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  simulateBtn: {
    backgroundColor: Colors.danger,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    shadowColor: Colors.danger,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  simulateBtnDisabled: { opacity: 0.7 },
  simulateBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  simResultBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.safeDim,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.safe + "30",
  },
  simResultText: { fontSize: 12, color: Colors.safe, flex: 1 },

  // Section
  sectionWrap: { gap: 10 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },

  // Contact card
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitial: { fontSize: 18, fontWeight: "800" },
  contactInfo: { flex: 1, gap: 4 },
  contactName: { fontSize: 15, fontWeight: "700", color: Colors.text },
  contactMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  contactPhone: { fontSize: 12, color: Colors.textSecondary },
  relBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  relText: { fontSize: 11, fontWeight: "600" },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dangerDim,
    borderWidth: 1,
    borderColor: Colors.danger + "30",
    alignItems: "center",
    justifyContent: "center",
  },

  // Loading / error / empty
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
  errorBox: {
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dangerDim,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.danger + "30",
  },
  errorBoxText: { fontSize: 13, color: Colors.danger, textAlign: "center" },
  retryBtn: {
    backgroundColor: Colors.danger,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  emptyBox: { alignItems: "center", gap: 10, paddingVertical: 32 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },

  // Info note
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  // Form
  formGroup: { marginBottom: 16, gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  inputError: { borderColor: Colors.danger },
  inputIcon: { width: 20 },
  input: { flex: 1, fontSize: 14, color: Colors.text },
  fieldError: { fontSize: 11, color: Colors.danger, marginTop: 2 },

  // Chips
  chipRow: { flexDirection: "row", marginTop: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.fireDim,
    borderColor: Colors.fire + "60",
  },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: "500" },
  chipTextActive: { color: Colors.fire, fontWeight: "700" },

  // Submit
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.fire,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: Colors.fire,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  submitText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

export default EmergencyContactsScreen;
