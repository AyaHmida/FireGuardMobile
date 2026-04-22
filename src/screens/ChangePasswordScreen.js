import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/Authcontext";
import { BASE_URL, apiCall } from "../services/api";
import { Colors } from "../theme/colors";

export const ChangePasswordScreen = ({ onBack }) => {
  const { token } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Validation locale ─────────────────────────────────────────
  const validate = () => {
    if (!currentPassword.trim())
      return "Le mot de passe actuel est obligatoire.";
    if (newPassword.length < 8)
      return "Le nouveau mot de passe doit contenir au moins 8 caractères.";
    if (!/[A-Z]/.test(newPassword))
      return "Le mot de passe doit contenir au moins une majuscule.";
    if (!/[0-9]/.test(newPassword))
      return "Le mot de passe doit contenir au moins un chiffre.";
    if (!/[\W_]/.test(newPassword))
      return "Le mot de passe doit contenir au moins un caractère spécial.";
    if (newPassword !== confirmPassword)
      return "Les mots de passe ne correspondent pas.";
    if (newPassword === currentPassword)
      return "Le nouveau mot de passe doit être différent de l'ancien.";
    return null;
  };

  // ── Soumettre ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) return setError(validationError);

    setLoading(true);
    const { data, error: apiError } = await apiCall(
      `${BASE_URL}/api/auth/change-password`,
      "PUT",
      {
        currentPassword,
        newPassword,
        confirmPassword,
      },
      token,
    );
    setLoading(false);

    if (apiError) {
      setError(apiError);
    } else {
      setSuccess("Mot de passe modifié avec succès !");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => onBack(), 2000);
    }
  };

  // ── Force du mot de passe ────────────────────────────────────
  const getStrength = (pwd) => {
    if (pwd.length === 0) return null;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[\W_]/.test(pwd)) score++;
    if (pwd.length >= 12) score++;
    if (score <= 2)
      return { label: "Faible", color: Colors.danger, width: "30%" };
    if (score === 3)
      return { label: "Moyen", color: Colors.warn, width: "60%" };
    return { label: "Fort", color: Colors.safe, width: "100%" };
  };

  const strength = getStrength(newPassword);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Changer le mot de passe</Text>
      </View>

      {/* ── Icône ────────────────────────────────────────────── */}
      <View style={styles.iconSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={36} color={Colors.fire} />
        </View>
        <Text style={styles.iconDesc}>
          Votre mot de passe doit contenir au moins 8 caractères,{"\n"}
          une majuscule, un chiffre et un caractère spécial.
        </Text>
      </View>

      {/* ── Erreur / Succès ───────────────────────────────────── */}
      {error !== "" && (
        <View style={styles.errorBox}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color={Colors.danger}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      )}
      {success !== "" && (
        <View style={styles.successBox}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons
              name="checkmark-circle-outline"
              size={14}
              color={Colors.safe}
            />
            <Text style={styles.successText}>{success}</Text>
          </View>
        </View>
      )}

      {/* ── Formulaire ───────────────────────────────────────── */}
      <View style={styles.form}>
        {/* Mot de passe actuel */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Mot de passe actuel</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={Colors.text}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Votre mot de passe actuel"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showCurrent}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
              <Ionicons
                name={showCurrent ? "eye-off" : "eye"}
                size={18}
                color={Colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nouveau mot de passe */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="key-outline"
              size={16}
              color={Colors.text}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Min. 8 car., majuscule, chiffre, spécial"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showNew}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              <Ionicons
                name={showNew ? "eye-off" : "eye"}
                size={18}
                color={Colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Barre de force */}
          {strength && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                <View
                  style={[
                    styles.strengthFill,
                    { width: strength.width, backgroundColor: strength.color },
                  ]}
                />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          {/* Règles */}
          {newPassword.length > 0 && (
            <View style={styles.rules}>
              {[
                { ok: newPassword.length >= 8, text: "Au moins 8 caractères" },
                { ok: /[A-Z]/.test(newPassword), text: "Une majuscule" },
                { ok: /[0-9]/.test(newPassword), text: "Un chiffre" },
                { ok: /[\W_]/.test(newPassword), text: "Un caractère spécial" },
              ].map((rule, i) => (
                <Text
                  key={i}
                  style={[
                    styles.rule,
                    { color: rule.ok ? Colors.safe : Colors.textMuted },
                  ]}
                >
                  {rule.ok ? "" : "○"} {rule.text}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Confirmer le nouveau mot de passe */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Confirmer le nouveau mot de passe
          </Text>
          <View
            style={[
              styles.inputWrapper,
              confirmPassword.length > 0 && {
                borderColor:
                  confirmPassword === newPassword ? Colors.safe : Colors.danger,
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={Colors.text}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Répéter le nouveau mot de passe"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons
                name={showConfirm ? "eye-off" : "eye"}
                size={18}
                color={Colors.text}
              />
            </TouchableOpacity>
          </View>
          {confirmPassword.length > 0 && (
            <Text
              style={{
                fontSize: 11,
                marginTop: 4,
                color:
                  confirmPassword === newPassword ? Colors.safe : Colors.danger,
              }}
            >
              {confirmPassword === newPassword
                ? " Les mots de passe correspondent"
                : " Les mots de passe ne correspondent pas"}
            </Text>
          )}
        </View>
      </View>

      {/* ── Bouton confirmer ───────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitBtnText}> Confirmer le changement</Text>
        )}
      </TouchableOpacity>

      {/* ── Annuler ───────────────────────────────────────────── */}
      <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
        <Text style={styles.cancelBtnText}>Annuler</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
    gap: 12,
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
  iconSection: { alignItems: "center", paddingVertical: 28, gap: 12 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.fireDim,
    alignItems: "center",
    justifyContent: "center",
  },
  iconDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 32,
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.dangerDim,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.danger + "40",
  },
  errorText: { fontSize: 13, color: Colors.danger, fontWeight: "600" },
  successBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.safeDim,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.safe + "40",
  },
  successText: { fontSize: 13, color: Colors.safe, fontWeight: "600" },
  form: { paddingHorizontal: 16, gap: 16 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputIcon: { fontSize: 16 },
  input: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 14 },
  eyeBtn: { fontSize: 18, paddingLeft: 4 },
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "700", minWidth: 40 },
  rules: { marginTop: 6, gap: 2 },
  rule: { fontSize: 11 },
  submitBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: Colors.fire,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  cancelBtn: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default ChangePasswordScreen;
