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
import { useAuth } from "../context/Authcontext";
import { Colors } from "../theme/colors";

export const LoginScreen = ({ onLogin, onRegister, onForgotPassword }) => {
  // ← prop ajoutée
  // ── Récupère login + état depuis AuthContext ──────────────────────
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  // ── Validation locale ─────────────────────────────────────────────
  const validate = () => {
    if (!email.trim()) return "Veuillez entrer votre email.";
    if (!email.includes("@")) return "Adresse email invalide.";
    if (!password.trim()) return "Veuillez entrer votre mot de passe.";
    return null;
  };

  const handleLogin = async () => {
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const result = await login(email.trim(), password);

    if (result.success) {
      onLogin && onLogin();
    } else {
      setError(result.error || "Échec de la connexion.");
    }
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
        {/* Logo */}
        <View style={styles.logoArea}>
          <View
            style={[
              styles.logoBox,
              {
                background: undefined,
                backgroundColor: undefined,
                borderRadius: 18,
                width: 80,
                height: 80,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#E24B4A",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 8,
              },
            ]}
          >
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

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Connexion</Text>
          <Text style={styles.formSubtitle}>
            Accédez à votre espace sécurisé
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
              />
            </View>
          </View>

          {/* Mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>MOT DE PASSE</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#E24B4A"
                style={styles.inputIcon}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons
                  name={showPass ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#a32d2d"
                  style={{ paddingHorizontal: 4 }}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Mot de passe oublié ── onForgotPassword branché ici */}
          <TouchableOpacity
            style={{ alignSelf: "flex-end" }}
            onPress={onForgotPassword}
          >
            <Text style={styles.forgotPass}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Erreur (vient du backend) */}
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

          {/* Bouton connexion */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
            style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Se connecter</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Lien Register */}
        <TouchableOpacity
          onPress={onRegister}
          style={{ alignItems: "center", marginTop: 24 }}
        >
          <Text style={styles.registerText}>
            Pas encore de compte ?{" "}
            <Text style={{ color: Colors.fire, fontWeight: "600" }}>
              S inscrire
            </Text>
          </Text>
        </TouchableOpacity>

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
  logoArea: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: "center",
    gap: 8,
  },
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
  formSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: -6 },
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
  forgotPass: { fontSize: 13, color: Colors.fire, fontWeight: "600" },
  errorBox: {
    backgroundColor: Colors.dangerDim,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.danger + "40",
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: { fontSize: 12, color: Colors.danger, fontWeight: "600" },
  submitBtn: {
    backgroundColor: Colors.fire,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.fire,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  registerText: { fontSize: 13, color: Colors.textMuted },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  securityText: { fontSize: 11, color: Colors.textMuted },
});

export default LoginScreen;
