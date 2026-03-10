// ═══════════════════════════════════════════════════════════════════
//  RegisterScreen.js — Inscription connectée à l'API .NET
//  Utilise AuthContext → authService → POST /api/auth/register
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../context/Authcontext';
import { Colors } from '../theme/colors';

export const RegisterScreen = ({ onRegister, onBack }) => {
  const { register, isLoading } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ── Validation locale avant envoi API ──────────────────────────────
  const validate = () => {
    if (!firstName.trim() || !lastName.trim())
      return 'Veuillez entrer votre nom et prénom.';
    if (!email.trim() || !email.includes('@')) return 'Adresse email invalide.';
    if (password.length < 6)
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    if (password !== confirmPass)
      return 'Les mots de passe ne correspondent pas.';
    return null;
  };

  // ── Appel API register ─────────────────────────────────────────────
  const handleRegister = async () => {
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // register() dans AuthContext appelle authService.register()
    // qui fait POST /api/auth/register avec le body RegisterRequestDto
    const result = await register({
      firstName,
      lastName,
      email,
      password,
      phoneNumber: phone || null,
    });

    if (result.success) {
      setSuccess(true);
      // Compte créé → rediriger vers Login après 2s
      // (le compte Occupant attend validation admin avant d'être actif)
      setTimeout(() => onRegister && onRegister(), 2000);
    } else {
      // Affiche l'erreur retournée par le backend
      // ex: "Cet email est déjà utilisé." (409 Conflict)
      setError(result.error || "Erreur lors de l'inscription.");
    }
  };

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
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {right}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header retour */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
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
          <Text style={styles.formTitle}>Inscription</Text>
          <Text style={styles.formSubtitle}>
            Remplissez les informations ci-dessous
          </Text>

          {/* Prénom + Nom */}
          <View style={styles.rowFields}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>PRÉNOM</Text>
              <InputField
                icon="👤"
                placeholder="Ahmed"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>NOM</Text>
              <InputField
                icon="👤"
                placeholder="Benali"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <InputField
              icon="✉️"
              placeholder="ahmed@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          {/* Téléphone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TÉLÉPHONE (optionnel)</Text>
            <InputField
              icon="📞"
              placeholder="+216 XX XXX XXX"
              value={phone}
              onChangeText={setPhone}
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
              secureTextEntry={!showPass}
              right={
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Text style={{ fontSize: 16, paddingHorizontal: 4 }}>
                    {showPass ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              }
            />
          </View>

          {/* Confirmer mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONFIRMER MOT DE PASSE</Text>
            <InputField
              icon="🔒"
              placeholder="••••••••"
              value={confirmPass}
              onChangeText={setConfirmPass}
              secureTextEntry={!showPass}
            />
          </View>

          {/* Info validation */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ℹ️ Votre compte sera activé après validation par un
              administrateur.
            </Text>
          </View>

          {/* Erreur API ou validation */}
          {error !== '' && (
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
            onPress={handleRegister}
            disabled={isLoading || success}
            activeOpacity={0.85}
            style={[
              styles.submitBtn,
              (isLoading || success) && { opacity: 0.7 },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Créer mon compte</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Lien login */}
        <TouchableOpacity
          onPress={onBack}
          style={{ alignItems: 'center', marginTop: 20 }}
        >
          <Text style={styles.loginText}>
            Déjà un compte ?{' '}
            <Text style={{ color: Colors.fire, fontWeight: '600' }}>
              Se connecter
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 18, color: Colors.text, fontWeight: '600' },
  logoArea: { paddingTop: 24, paddingBottom: 28, alignItems: 'center', gap: 8 },
  logoBox: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: Colors.fireDim,
    borderWidth: 2,
    borderColor: Colors.fire + '40',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.fire,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  appSubtitle: { fontSize: 11, color: Colors.textSecondary, letterSpacing: 2 },
  formCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    gap: 14,
  },
  formTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  formSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: -6 },
  rowFields: { flexDirection: 'row' },
  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  inputIcon: { fontSize: 15 },
  input: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 12 },
  infoBox: {
    backgroundColor: Colors.infoDim || '#1a2a3a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: (Colors.info || '#4aa3df') + '40',
  },
  infoText: { fontSize: 11, color: Colors.info || '#4aa3df', lineHeight: 16 },
  errorBox: {
    backgroundColor: Colors.dangerDim,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.danger + '40',
  },
  errorText: { fontSize: 12, color: Colors.danger, fontWeight: '600' },
  successBox: {
    backgroundColor: Colors.safeDim || '#1a3a2a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: (Colors.safe || '#2ecc71') + '40',
  },
  successText: {
    fontSize: 12,
    color: Colors.safe || '#2ecc71',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: Colors.fire,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: Colors.fire,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  loginText: { fontSize: 13, color: Colors.textMuted },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  securityText: { fontSize: 11, color: Colors.textMuted },
});

export default RegisterScreen;
