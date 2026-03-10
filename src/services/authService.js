// ═══════════════════════════════════════════════════════════════════
//  authService.js — Appels API Auth + persistance token
//  ✅ Les messages d'erreur viennent directement du backend .NET
// ═══════════════════════════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, apiCall } from './api';

const TOKEN_KEY = 'fireguard_token';
const USER_KEY = 'fireguard_user';

// ─── Register ────────────────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Backend retourne:
 *   201 → RegisterResponseDto
 *   409 → { message: "Email '...' is already registered." }
 */
const register = async (payload) => {
  const { data, error, status } = await apiCall(
    API_ENDPOINTS.AUTH.REGISTER,
    'POST',
    {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      phoneNumber: payload.phoneNumber?.trim() || null,
    }
  );

  if (error) {
    // ✅ Retourne le message exact du backend (ex: "Email '...' is already registered.")
    return { success: false, error };
  }

  return { success: true, data };
};

// ─── Login ───────────────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Backend retourne AuthResponseDto:
 * {
 *   success: bool,
 *   message: string,   ← message du backend qu'on affiche directement
 *   token:   string,
 *   user:    { id, firstName, lastName, email, role }
 * }
 *
 * Messages possibles du backend:
 *   ✅ "Connection successful."
 *   ❌ "Incorrect email or password."
 *   ❌ "Your account is awaiting validation by an administrator."
 *   ❌ "Your account has been suspended. Reason: ..."
 */
const login = async ({ email, password }) => {
  const { data, error, status } = await apiCall(
    API_ENDPOINTS.AUTH.LOGIN,
    'POST',
    { email: email.trim().toLowerCase(), password }
  );

  // Erreur réseau (pas de connexion, serveur éteint...)
  if (status === 0) {
    return { success: false, error };
  }

  // ✅ Backend retourne toujours AuthResponseDto même en 401
  // On utilise data.message directement (vient du backend)
  if (!data?.success) {
    return {
      success: false,
      error: data?.message || error || 'Connexion échouée.',
    };
  }

  // ✅ Connexion réussie → sauvegarder token + user
  if (data.token) {
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return { success: true, token: data.token, user: data.user };
};

// ─── Logout ──────────────────────────────────────────────────────────
const logout = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};

// ─── Persistance ─────────────────────────────────────────────────────
const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const getUser = async () => {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ─── Export ──────────────────────────────────────────────────────────
export const authService = { register, login, logout, getToken, getUser };
