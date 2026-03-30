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

export const ForgotPasswordScreen = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false); // ✅ email envoyé avec succès

  // ── Validation locale ─────────────────────────────────────────────
  const validate = () => {
    if (!email.trim()) return "Veuillez entrer votre email.";
    if (!email.includes("@")) return "Adresse email invalide.";
    return null;
  };

  // ── Appel API ─────────────────────────────────────────────────────
  // POST /api/auth/forgot-password
  // Body : { email }
  // Backend répond toujours 200 (sécurité : ne révèle pas si l'email existe)
  const handleSubmit = async () => {
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    const { success, error: apiError } = await authService.forgotPassword(
      email.trim(),
    );
    setIsLoading(false);

    if (!success) {
      setError(apiError || "Une erreur est survenue. Veuillez réessayer.");
      return;
    }

    setSent(true);
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
          {sent ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconBox}>
                <Ionicons name="mail-open-outline" size={40} color="#E24B4A" />
              </View>
              <Text style={styles.formTitle}>Email envoyé !</Text>
              <Text style={styles.successText}>
                Si l adresse{" "}
                <Text style={{ color: Colors.fire, fontWeight: "600" }}>
                  {email}
                </Text>{" "}
                est enregistrée, vous allez recevoir un lien de
                réinitialisation.
              </Text>
              <Text style={styles.successHint}>
                Vérifiez aussi vos spams. Le lien est valable{" "}
                <Text style={{ fontWeight: "600" }}>1 heure</Text>.
              </Text>

              <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.85}
                style={styles.submitBtn}
              >
                <Text style={styles.submitBtnText}>Retour à la connexion</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── État : formulaire ── */
            <>
              <Text style={styles.formTitle}>Mot de passe oublié</Text>
              <Text style={styles.formSubtitle}>
                Entrez votre email et nous vous enverrons un lien de
                réinitialisation.
              </Text>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="#E24B4A"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="ahmed@email.com"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />
                </View>
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

              {/* Bouton envoyer */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.85}
                style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="send-outline"
                      size={16}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.submitBtnText}>Envoyer le lien</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Retour connexion */}
        {!sent && (
          <TouchableOpacity
            onPress={onBack}
            style={{ alignItems: "center", marginTop: 24 }}
          >
            <Text style={styles.backText}>
              <Ionicons
                name="arrow-back-outline"
                size={13}
                color={Colors.textMuted}
              />{" "}
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
    backgroundColor: Colors.fireDim,
    borderWidth: 1.5,
    borderColor: Colors.fire + "40",
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
  successHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
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

export default ForgotPasswordScreen;
