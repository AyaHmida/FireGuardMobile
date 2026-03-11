// export const BASE_URL = 'http://192.168.1.107:7182';
import { Platform } from "react-native";

export const BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:7182" // ✅ navigateur
    : "http://192.168.1.107:7182"; // ✅ mobile (ton PC sur WiFi)
// ─── Endpoints ───────────────────────────────────────────────────────
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `${BASE_URL}/api/auth/register`,
    LOGIN: `${BASE_URL}/api/auth/login`,
  },
  FAMILY: {
    MEMBERS: `${BASE_URL}/api/family/members`,
    INVITE: `${BASE_URL}/api/family/invite`,
    VALIDATE_TOKEN: `${BASE_URL}/api/family/validate-token`,
    ACCEPT_INVITATION: `${BASE_URL}/api/family/accept-invitation`,
  },
};

// ─── Helper fetch générique ──────────────────────────────────────────
/**
 * @param {string}                       url
 * @param {'GET'|'POST'|'PUT'|'DELETE'}  method
 * @param {object|null}                  body
 * @param {string|null}                  token   JWT optionnel
 * @returns {Promise<{ data, error, status }>}
 */
export const apiCall = async (
  url,
  method = "GET",
  body = null,
  token = null,
) => {
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      // .NET retourne { message } dans les erreurs
      const errorMsg = data?.message || `Erreur serveur (${response.status})`;
      return { data: null, error: errorMsg, status: response.status };
    }

    return { data, error: null, status: response.status };
  } catch (err) {
    return {
      data: null,
      error: "Impossible de contacter le serveur. Vérifiez votre connexion.",
      status: 0,
    };
  }
};
