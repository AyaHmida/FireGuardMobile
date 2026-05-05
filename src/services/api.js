// export const BASE_URL = 'http://192.168.1.107:7182';
import Constants from "expo-constants";

// récupère l'IP locale actuelle (dev seulement)
const LOCAL_IP = Constants.expoConfig?.hostUri
  ? Constants.expoConfig.hostUri.split(":")[0]
  : "192.168.1.107"; // fallback si pas Expo

export const BASE_URL = `http://${LOCAL_IP}:7182`;
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `${BASE_URL}/api/auth/register`,
    LOGIN: `${BASE_URL}/api/auth/login`,
    FORGOT_PASSWORD: `${BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${BASE_URL}/api/auth/reset-password`,
  },
  FAMILY: {
    MEMBERS: `${BASE_URL}/api/family/members`,
    INVITE: `${BASE_URL}/api/family/invite`,
    VALIDATE_TOKEN: `${BASE_URL}/api/family/validate-token`,
    ACCEPT_INVITATION: `${BASE_URL}/api/family/accept-invitation`,
  },
  ZONES: {
    MY_ZONES: `${BASE_URL}/api/zones/my-zones`,
    REALTIME: (zoneId) => `${BASE_URL}/api/zones/zone/${zoneId}/realtime`,
  },
  DEVICE_CONTROL: {
    CONTROL: (deviceId) => `${BASE_URL}/api/device-control/${deviceId}`,
  },
  SYSTEM: {
    STATUS: `${BASE_URL}/api/systemstat/status`,
    TOGGLE: `${BASE_URL}/api/systemstat/toggle`,
  },
  SENSOR_CONFIG: {
    GET_BY_SENSOR: (sensorId) =>
      `${BASE_URL}/api/sensor-configurations/${sensorId}`,
    SET: `${BASE_URL}/api/sensor-configurations`,
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
  } catch {
    return {
      data: null,
      error: "Impossible de contacter le serveur. Vérifiez votre connexion.",
      status: 0,
    };
  }
};
