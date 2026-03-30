import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS, apiCall } from "./api";

const TOKEN_KEY = "fireguard_token";
const USER_KEY = "fireguard_user";

const register = async (payload) => {
  const { data, error, status } = await apiCall(
    API_ENDPOINTS.AUTH.REGISTER,
    "POST",
    {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      phoneNumber: payload.phoneNumber?.trim() || null,
    },
  );

  if (error) {
    return { success: false, error };
  }

  return { success: true, data };
};

const login = async ({ email, password }) => {
  const { data, error, status } = await apiCall(
    API_ENDPOINTS.AUTH.LOGIN,
    "POST",
    { email: email.trim().toLowerCase(), password },
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
      error: data?.message || error || "Connexion échouée.",
    };
  }

  // ✅ Connexion réussie → sauvegarder token + user
  if (data.token) {
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return { success: true, token: data.token, user: data.user };
};
const forgotPassword = async (email) => {
  const { data, error } = await apiCall(
    API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
    "POST",
    { email: email.trim().toLowerCase() },
  );

  if (error) {
    return { success: false, error };
  }

  return { success: true, data };
};
const resetPassword = async (token, newPassword, confirmPassword) => {
  const { data, error } = await apiCall(
    API_ENDPOINTS.AUTH.RESET_PASSWORD,
    "POST",
    { token, newPassword, confirmPassword },
  );

  if (error) {
    return { success: false, error };
  }

  return { success: true, data };
};
const logout = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};

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

export const authService = {
  register,
  login,
  forgotPassword,
  resetPassword,
  logout,
  getToken,
  getUser,
};
