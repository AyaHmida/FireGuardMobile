import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/Authcontext";
import { familyService } from "../services/FamilyService";
import { Colors } from "../theme/colors";

export const FamilyScreen = ({ onBack }) => {
  const { user, token } = useAuth();

  const [activeMembers, setActiveMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const loadMembers = useCallback(async () => {
    setError("");
    const result = await familyService.getFamilyMembers(token);
    if (result.success) {
      setActiveMembers(result.data?.activeMembers ?? []);
      setPendingInvitations(result.data?.pendingInvitations ?? []);
    } else {
      setError(result.error || "Erreur lors du chargement.");
    }
    setLoading(false);
    setRefreshing(false);
  }, [token]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMembers();
  };

  const handleInvite = async () => {
    setInviteError("");
    setInviteSuccess("");

    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      setInviteError("Adresse email invalide.");
      return;
    }

    setInviteLoading(true);
    const result = await familyService.inviteMember(inviteEmail, token);
    setInviteLoading(false);

    if (result.success) {
      setInviteSuccess(result.message || "Invitation envoyée !");
      setInviteEmail("");
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess("");
        loadMembers();
      }, 1500);
    } else {
      setInviteError(result.error || "Erreur lors de l'invitation.");
    }
  };

  const handleRevoke = (member, isPending = false) => {
    const name = isPending
      ? member.email
      : `${member.firstName} ${member.lastName}`;

    const action = isPending
      ? "annuler l'invitation de"
      : "révoquer l'accès de";

    Alert.alert("Confirmation", `Voulez-vous vraiment ${action} ${name} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Confirmer",
        style: "destructive",
        onPress: async () => {
          const result = await familyService.revokeMember(member.id, token);
          if (result.success) {
            loadMembers();
          } else {
            Alert.alert("Erreur", result.error);
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ── Accès refusé ───────────────────────────────────────────────────
  if (user?.role !== "Occupant") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Famille</Text>
        </View>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={48} color={Colors.textSecondary} />
          <Text style={styles.accessDeniedText}>
            Cette section est réservée aux Occupants.
          </Text>
        </View>
      </View>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.fire} />
        <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>
          Chargement...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Ionicons
          name="people"
          size={20}
          color={Colors.text}
          style={{ marginRight: 4 }}
        />
        <Text style={styles.headerTitle}>Famille</Text>
        <TouchableOpacity
          onPress={() => {
            setShowInviteModal(true);
            setInviteError("");
            setInviteSuccess("");
          }}
          style={styles.inviteBtn}
        >
          <Ionicons name="person-add" size={14} color="#fff" />
          <Text style={styles.inviteBtnText}>Inviter</Text>
        </TouchableOpacity>
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
        {/* Erreur chargement */}
        {error !== "" && (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={14} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: Colors.safe + "40" }]}>
            <Text style={[styles.statNum, { color: Colors.safe }]}>
              {activeMembers.length}
            </Text>
            <Text style={styles.statLabel}>Membres actifs</Text>
          </View>
          <View style={[styles.statCard, { borderColor: Colors.warn + "40" }]}>
            <Text style={[styles.statNum, { color: Colors.warn }]}>
              {pendingInvitations.length}
            </Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </View>

        {/* ── Membres actifs ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MEMBRES ACTIFS</Text>

          {activeMembers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="people-outline"
                size={36}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>Aucun membre actif</Text>
              <Text style={styles.emptySubText}>
                Invitez des membres de votre famille !
              </Text>
            </View>
          ) : (
            activeMembers.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View
                  style={[styles.avatar, { backgroundColor: Colors.safeDim }]}
                >
                  <Text style={[styles.avatarText, { color: Colors.safe }]}>
                    {member.firstName?.charAt(0)}
                    {member.lastName?.charAt(0)}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>
                    {member.firstName} {member.lastName}
                  </Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                  {member.phoneNumber ? (
                    <View style={styles.inlineRow}>
                      <Ionicons
                        name="call"
                        size={11}
                        color={Colors.textMuted}
                      />
                      <Text style={styles.memberPhone}>
                        {member.phoneNumber}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.memberDate}>
                    Depuis {formatDate(member.createdAt)}
                  </Text>
                </View>

                <View style={styles.activeBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={11}
                    color={Colors.safe}
                  />
                  <Text style={styles.activeBadgeText}>Actif</Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleRevoke(member, false)}
                  style={styles.revokeBtn}
                >
                  <Ionicons name="trash" size={16} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* ── Invitations en attente ── */}
        {pendingInvitations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INVITATIONS EN ATTENTE</Text>

            {pendingInvitations.map((inv) => (
              <View
                key={inv.id}
                style={[styles.memberCard, { borderColor: Colors.warn + "40" }]}
              >
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: Colors.warnDim || "#2a2000" },
                  ]}
                >
                  <Ionicons name="mail" size={22} color={Colors.warn} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.memberEmail}>{inv.email}</Text>
                  <View style={styles.inlineRow}>
                    <Ionicons name="time" size={11} color={Colors.warn} />
                    <Text style={[styles.memberDate, { color: Colors.warn }]}>
                      Expire {formatDate(inv.expiresAt)}
                    </Text>
                  </View>
                  <Text style={styles.memberDate}>
                    Envoyée {formatDate(inv.createdAt)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.activeBadge,
                    { backgroundColor: Colors.warnDim || "#2a2000" },
                  ]}
                >
                  <Ionicons name="hourglass" size={11} color={Colors.warn} />
                  <Text
                    style={[styles.activeBadgeText, { color: Colors.warn }]}
                  >
                    En attente
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleRevoke(inv, true)}
                  style={styles.revokeBtn}
                >
                  <Ionicons name="close" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle"
            size={16}
            color={Colors.info || "#4aa3df"}
            style={{ marginTop: 1 }}
          />
          <Text style={styles.infoText}>
            Les membres invités recevront un email avec un lien valable 48h pour
            créer leur compte.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Modal Invitation ── */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.inlineRow}>
              <Ionicons name="mail" size={20} color={Colors.text} />
              <Text style={styles.modalTitle}>Inviter un membre</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Un email sera envoyé avec un lien d activation (48h).
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={Colors.textMuted}
              />
              <TextInput
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="email@exemple.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            {inviteError !== "" && (
              <View style={styles.errorBox}>
                <Ionicons name="warning" size={14} color={Colors.danger} />
                <Text style={styles.errorText}>{inviteError}</Text>
              </View>
            )}

            {inviteSuccess !== "" && (
              <View style={styles.successBox}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={Colors.safe}
                />
                <Text style={styles.successText}>{inviteSuccess}</Text>
              </View>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => {
                  setShowInviteModal(false);
                  setInviteEmail("");
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleInvite}
                disabled={inviteLoading}
                style={[styles.sendBtn, inviteLoading && { opacity: 0.7 }]}
              >
                {inviteLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={14} color="#fff" />
                    <Text style={styles.sendBtnText}>Envoyer</Text>
                  </>
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
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
    gap: 8,
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
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: Colors.text },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.fire,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inviteBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  content: { padding: 16, gap: 16 },

  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  statNum: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: "600" },

  section: { gap: 10 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },

  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { fontSize: 16, fontWeight: "800" },
  memberName: { fontSize: 14, fontWeight: "700", color: Colors.text },
  memberEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  memberPhone: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    marginLeft: 4,
  },
  memberDate: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.safeDim,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeBadgeText: { fontSize: 10, color: Colors.safe, fontWeight: "600" },
  revokeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.dangerDim,
    alignItems: "center",
    justifyContent: "center",
  },

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

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.infoDim || "#1a2a3a",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: (Colors.info || "#4aa3df") + "40",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.info || "#4aa3df",
    lineHeight: 18,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.dangerDim,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.danger + "40",
  },
  errorText: { fontSize: 12, color: Colors.danger, fontWeight: "600" },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.safeDim,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.safe + "40",
  },
  successText: { fontSize: 12, color: Colors.safe, fontWeight: "600" },

  accessDenied: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  accessDeniedText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },

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
    gap: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginLeft: 6,
  },
  modalSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: -8 },
  inputWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  input: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 14 },
  modalBtns: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: Colors.text },
  sendBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.fire,
  },
  sendBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});

export default FamilyScreen;
