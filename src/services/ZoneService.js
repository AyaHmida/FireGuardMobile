import { BASE_URL, apiCall } from "./api";

// ─── Endpoints ────────────────────────────────────────────────────────
const ZONE_ENDPOINTS = {
  MY_ZONES: `${BASE_URL}/api/zones/my-zones`, // Occupant + FamilyMember
};

// ─── GET /api/zones/my-zones ──────────────────────────────────────────
/**
 * Retourne les zones de l'utilisateur authentifié :
 * - Occupant     → ses propres zones
 * - FamilyMember → zones de son occupant parent
 *
 * @param {string} token - JWT token
 * @returns {{ success, data: ZoneResponseDto[], error }}
 */
const getMyZones = async (token) => {
  const { data, error } = await apiCall(
    ZONE_ENDPOINTS.MY_ZONES,
    "GET",
    null,
    token,
  );

  if (error) return { success: false, error, data: [] };
  return { success: true, data: Array.isArray(data) ? data : [], error: null };
};

// ─── GET /api/zones/{id}/sensor-count ────────────────────────────────
/**
 * Retourne le nombre de capteurs d'une zone
 *
 * @param {number} zoneId
 * @param {string} token
 */
const getZoneSensorCount = async (zoneId, token) => {
  const { data, error } = await apiCall(
    `${BASE_URL}/api/zones/${zoneId}/sensor-count`,
    "GET",
    null,
    token,
  );

  if (error) return { success: false, error, count: 0 };
  return { success: true, count: data?.sensorCount ?? 0 };
};

export const zoneService = {
  getMyZones,
  getZoneSensorCount,
};
