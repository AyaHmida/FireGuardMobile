import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { authService } from "../services/authService";
import { Colors } from "../theme/colors";

export const ResetPasswordScreen = ({ token = "", onBack, onSuccess }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const validate = () => {
    if (!newPassword.trim()) return "Veuillez entrer un nouveau mot de passe.";
    if (newPassword.length < 8)
      return "Le mot de passe doit contenir au moins 8 caractères.";
    if (newPassword !== confirmPassword)
      return "Les mots de passe ne correspondent pas.";
    if (!token)
      return "Token manquant. Veuillez utiliser le lien reçu par email.";
    return null;
  };

  const getStrength = (pwd) => {
    if (!pwd) return { level: 0, label: "", color: Colors.border };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const map = [
      { level: 1, label: "Faible", color: "#E24B4A" },
      { level: 2, label: "Moyen", color: "#F59E0B" },
      { level: 3, label: "Bon", color: "#3B82F6" },
      { level: 4, label: "Fort", color: "#10B981" },
    ];
    return map[score - 1] ?? { level: 0, label: "", color: Colors.border };
  };

  const strength = getStrength(newPassword);

  const handleSubmit = async () => {
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    const { success, error: apiError } = await authService.resetPassword(
      token,
      newPassword,
      confirmPassword,
    );
    setIsLoading(false);

    if (!success) {
      setError(apiError || "Une erreur est survenue. Veuillez réessayer.");
      return;
    }

    setDone(true);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo ── identique à LoginScreen */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Image
              source={require("../../assets/images/fireguard-icon.png")}
              style={{ width: 60, height: 60 }}
              resizeMode="contain"
            />
          </View>
          <Text
            style={[styles.appName, { color: "#E24B4A", fontWeight: "700" }]}
          >
            FireGuard
          </Text>
          <Text
            style={[styles.appSubtitle, { color: "#a32d2d", letterSpacing: 3 }]}
          >
            SYSTÈME ANTI-INCENDIE
          </Text>
        </View>

        {/* ── Carte formulaire ── */}
        <View style={styles.formCard}>
          {/* ── État : succès ── */}
          {done ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconBox}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={44}
                  color="#10B981"
                />
              </View>
              <Text style={styles.formTitle}>Mot de passe modifié !</Text>
              <Text style={styles.successText}>
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez
                maintenant vous connecter avec votre nouveau mot de passe.
              </Text>
              <TouchableOpacity
                onPress={onSuccess ?? onBack}
                activeOpacity={0.85}
                style={styles.submitBtn}
              >
                <Ionicons
                  name="log-in-outline"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitBtnText}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── État : formulaire ── */
            <>
              <Text style={styles.formTitle}>Nouveau mot de passe</Text>
              <Text style={styles.formSubtitle}>
                Choisissez un mot de passe fort d au moins 8 caractères.
              </Text>

              {/* Alerte token absent */}
              {!token && (
                <View
                  style={[
                    styles.errorBox,
                    { backgroundColor: Colors.dangerDim },
                  ]}
                >
                  <Ionicons
                    name="link-outline"
                    size={16}
                    color="#E24B4A"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.errorText}>
                    Lien invalide. Veuillez utiliser le lien reçu par email.
                  </Text>
                </View>
              )}

              {/* Nouveau mot de passe */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NOUVEAU MOT DE PASSE</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-open-outline"
                    size={18}
                    color="#E24B4A"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                    <Ionicons
                      name={showNew ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#a32d2d"
                      style={{ paddingHorizontal: 4 }}
                    />
                  </TouchableOpacity>
                </View>

                {/* Barre de force */}
                {newPassword.length > 0 && (
                  <View style={styles.strengthRow}>
                    <View style={styles.strengthBars}>
                      {[1, 2, 3, 4].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.strengthBar,
                            {
                              backgroundColor:
                                i <= strength.level
                                  ? strength.color
                                  : Colors.border,
                            },
                          ]}
                        />
                      ))}
                    </View>
                    {strength.label !== "" && (
                      <Text
                        style={[
                          styles.strengthLabel,
                          { color: strength.color },
                        ]}
                      >
                        {strength.label}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Confirmer mot de passe */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRMER LE MOT DE PASSE</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    confirmPassword.length > 0 &&
                      confirmPassword !== newPassword && {
                        borderColor: Colors.danger + "80",
                      },
                    confirmPassword.length > 0 &&
                      confirmPassword === newPassword && {
                        borderColor: "#10B98180",
                      },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#E24B4A"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirm(!showConfirm)}
                  >
                    <Ionicons
                      name={showConfirm ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#a32d2d"
                      style={{ paddingHorizontal: 4 }}
                    />
                  </TouchableOpacity>
                  {/* Icône de correspondance */}
                  {confirmPassword.length > 0 && (
                    <Ionicons
                      name={
                        confirmPassword === newPassword
                          ? "checkmark-circle"
                          : "close-circle"
                      }
                      size={18}
                      color={
                        confirmPassword === newPassword
                          ? "#10B981"
                          : Colors.danger
                      }
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </View>

              {/* Règles de mot de passe */}
              <View style={styles.rulesBox}>
                {[
                  {
                    rule: newPassword.length >= 8,
                    label: "Au moins 8 caractères",
                  },
                  {
                    rule: /[A-Z]/.test(newPassword),
                    label: "Une lettre majuscule",
                  },
                  { rule: /[0-9]/.test(newPassword), label: "Un chiffre" },
                  {
                    rule: /[^A-Za-z0-9]/.test(newPassword),
                    label: "Un caractère spécial",
                  },
                ].map(({ rule, label }) => (
                  <View key={label} style={styles.ruleRow}>
                    <Ionicons
                      name={rule ? "checkmark-circle" : "ellipse-outline"}
                      size={13}
                      color={rule ? "#10B981" : Colors.textMuted}
                    />
                    <Text
                      style={[styles.ruleText, rule && { color: "#10B981" }]}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Erreur */}
              {error !== "" && (
                <View style={styles.errorBox}>
                  <Ionicons
                    name="warning-outline"
                    size={16}
                    color="#E24B4A"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Bouton confirmer */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading || !token}
                activeOpacity={0.85}
                style={[
                  styles.submitBtn,
                  (isLoading || !token) && { opacity: 0.6 },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={16}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.submitBtnText}>
                      Réinitialiser le mot de passe
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Retour connexion */}
        {!done && (
          <TouchableOpacity
            onPress={onBack}
            style={{ alignItems: "center", marginTop: 24 }}
          >
            <Text style={styles.backText}>
              Retour à la{" "}
              <Text style={{ color: Colors.fire, fontWeight: "600" }}>
                connexion
              </Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* Security badge */}
        <View style={styles.securityBadge}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={16}
            color="#E24B4A"
          />
          <Text style={styles.securityText}>
            Connexion sécurisée JWT • Chiffrement AES-256
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingBottom: 40 },

  logoArea: { paddingTop: 80, paddingBottom: 40, alignItems: "center", gap: 8 },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.fireDim,
    borderWidth: 2,
    borderColor: Colors.fire + "40",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.fire,
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  appSubtitle: { fontSize: 12, color: Colors.textSecondary, letterSpacing: 2 },

  formCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    gap: 14,
  },
  formTitle: { fontSize: 20, fontWeight: "700", color: Colors.text },
  formSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: -6,
    lineHeight: 20,
  },

  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
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
  inputIcon: { fontSize: 16 },
  input: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 14 },

  // ── Barre de force ──
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  strengthBars: { flexDirection: "row", gap: 4, flex: 1 },
  strengthBar: { height: 4, flex: 1, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "600" },

  // ── Règles ──
  rulesBox: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 6,
  },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ruleText: { fontSize: 12, color: Colors.textMuted },

  errorBox: {
    backgroundColor: Colors.dangerDim,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.danger + "40",
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: { fontSize: 12, color: Colors.danger, fontWeight: "600", flex: 1 },

  submitBtn: {
    backgroundColor: Colors.fire,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: Colors.fire,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // ── Succès ──
  successContainer: { alignItems: "center", gap: 12, paddingVertical: 8 },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#D1FAE5",
    borderWidth: 1.5,
    borderColor: "#10B98140",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  backText: { fontSize: 13, color: Colors.textMuted },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  securityText: { fontSize: 11, color: Colors.textMuted },
});

export default ResetPasswordScreen;
