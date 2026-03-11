import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { familyService } from "../services/FamilyService";
import { Colors } from "../theme/colors";

export const AcceptInvitationScreen = ({
  token,
  onInvitationAccepted,
  onCancel,
}) => {
  // ── États ─────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(true);
  const [success, setSuccess] = useState(false);

  // ── Formulaire ────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Valider le token au chargement ────────────────────────────────
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Token manquant. Lien invalide.");
        setValidating(false);
        return;
      }

      try {
        const result = await familyService.validateInvitationToken(token);
        if (result.valid) {
          setEmail(result.email);
          setError("");
        } else {
          setError(
            "Lien invalide ou expiré. Demandez une nouvelle invitation.",
          );
        }
      } catch (err) {
        setError("Erreur lors de la validation du lien.");
        console.error(err);
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // ── Gestion de la soumission ──────────────────────────────────────
  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    // Validations simples
    if (!firstName.trim() || !lastName.trim()) {
      setError("Le prénom et le nom sont requis.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("Token manquant.");
      setLoading(false);
      return;
    }

    try {
      const result = await familyService.acceptInvitation({
        token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || "",
        password: password,
      });

      if (result.success) {
        // ✅ Succès
        setSuccess(true);
        setTimeout(() => {
          if (onInvitationAccepted) {
            onInvitationAccepted();
          }
        }, 1500);
      } else {
        setError(result.error || "Une erreur est survenue");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Affichage: Validation du token ────────────────────────────────
  if (validating) {
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
          <View style={styles.logoArea}>
            <View style={styles.logoBox}>
              <Text style={{ fontSize: 38 }}>🔄</Text>
            </View>
            <Text style={styles.appName}>Vérification...</Text>
            <Text style={styles.appSubtitle}>Veuillez patienter</Text>
          </View>
          <View style={styles.formCard}>
            <ActivityIndicator size="large" color={Colors.fire} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Composant champ input réutilisable ─────────────────────────────
  const InputField = ({
    icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType,
    right,
  }) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || "default"}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {right}
    </View>
  );

  // ── Affichage: Lien invalide ──────────────────────────────────────
  if (
    !email ||
    error === "Lien invalide ou expiré. Demandez une nouvelle invitation."
  ) {
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
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logoArea}>
            <View style={styles.logoBox}>
              <Text style={{ fontSize: 38 }}>❌</Text>
            </View>
            <Text style={styles.appName}>Lien Invalide</Text>
            <Text style={styles.appSubtitle}>ACCÈS REFUSÉ</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Invitation Expirée</Text>
            <Text style={styles.formSubtitle}>
              Le lien d'accès a expiré ou est invalide.
            </Text>

            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {error || "Le lien d'invitation est invalide ou a expiré."}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.85}
              style={styles.submitBtn}
            >
              <Text style={styles.submitBtnText}>Retourner à la connexion</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Affichage: Formulaire d'acceptation ───────────────────────────
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
        {/* Header retour */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Text style={{ fontSize: 38 }}>🔥</Text>
          </View>
          <Text style={styles.appName}>FireGuard</Text>
          <Text style={styles.appSubtitle}>CRÉER UN COMPTE</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Accepter l'invitation</Text>
          <Text style={styles.formSubtitle}>
            Complétez votre profil pour accéder au système
          </Text>

          {/* Email (lecture seule) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <View style={[styles.inputWrapper, styles.disabledInput]}>
              <Text style={styles.inputIcon}>✉️</Text>
              <Text style={[styles.input, { color: Colors.text2 }]}>
                {email}
              </Text>
            </View>
          </View>

          {/* Prénom + Nom */}
          <View style={styles.rowFields}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>PRÉNOM</Text>
              <InputField
                icon="👤"
                placeholder="Jean"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>NOM</Text>
              <InputField
                icon="👤"
                placeholder="Martin"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* Téléphone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TÉLÉPHONE (optionnel)</Text>
            <InputField
              icon="📞"
              placeholder="+33 6 12 34 56 78"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          {/* Mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>MOT DE PASSE</Text>
            <InputField
              icon="🔒"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              right={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={{ fontSize: 16, paddingHorizontal: 4 }}>
                    {showPassword ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
              }
            />
            <Text style={styles.inputHint}>Minimum 6 caractères</Text>
          </View>

          {/* Confirmer mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONFIRMER MOT DE PASSE</Text>
            <InputField
              icon="🔒"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              right={
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={{ fontSize: 16, paddingHorizontal: 4 }}>
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
              }
            />
          </View>

          {/* Info validation */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ℹ️ Après validation, votre compte sera activé automatiquement.
              Vous pourrez accéder à tous les systèmes.
            </Text>
          </View>

          {/* Erreur API ou validation */}
          {error !== "" && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Succès */}
          {success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                ✅ Compte créé avec succès ! Redirection...
              </Text>
            </View>
          )}

          {/* Bouton soumettre */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || success}
            activeOpacity={0.85}
            style={[styles.submitBtn, (loading || success) && { opacity: 0.7 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>✅ Créer mon compte</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Lien retour */}
        <TouchableOpacity
          onPress={onCancel}
          style={{ alignItems: "center", marginTop: 20 }}
        >
          <Text style={styles.loginText}>
            Pas d'invitation ?{" "}
            <Text style={{ color: Colors.fire, fontWeight: "600" }}>
              Contacter l'administrateur
            </Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.securityBadge}>
          <Text>🛡️</Text>
          <Text style={styles.securityText}>
            Connexion sécurisée JWT • Chiffrement AES-256
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingBottom: 24 },
  header: { paddingHorizontal: 20, paddingTop: 16 },
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
  backBtnText: { fontSize: 18, color: Colors.text, fontWeight: "600" },

  logoArea: {
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: "center",
    gap: 8,
  },
  logoBox: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.fire,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },
  appSubtitle: {
    fontSize: 11,
    color: Colors.text2,
    letterSpacing: 1,
    fontWeight: "600",
  },

  formCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 22,
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: Colors.text2,
    marginBottom: 20,
    lineHeight: 18,
  },

  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  disabledInput: {
    backgroundColor: Colors.border + "40",
    opacity: 0.8,
  },
  inputIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
  },
  inputHint: {
    fontSize: 11,
    color: Colors.text3,
    marginTop: 6,
  },

  rowFields: {
    flexDirection: "row",
  },

  infoBox: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: Colors.text2,
    lineHeight: 16,
  },

  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    lineHeight: 16,
  },

  successBox: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 12,
    color: "#22c55e",
    lineHeight: 16,
  },

  submitBtn: {
    backgroundColor: Colors.fire,
    borderRadius: 10,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  loginText: {
    fontSize: 12,
    color: Colors.text2,
    fontWeight: "500",
  },

  securityBadge: {
    marginTop: 20,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  securityText: {
    fontSize: 11,
    color: Colors.text2,
    fontWeight: "500",
  },
});

export default AcceptInvitationScreen;
