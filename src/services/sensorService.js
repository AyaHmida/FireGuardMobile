import { BASE_URL, apiCall } from "./api";

const SENSOR_ENDPOINTS = {
  GET_BY_ID: (id) => `${BASE_URL}/api/sensors/${id}`,
  GET_BY_ZONE: (zoneId) => `${BASE_URL}/api/sensors/by-zone/${zoneId}`,
};

// GET /api/sensors/{id}
const getById = async (id, token) => {
  const { data, error } = await apiCall(
    SENSOR_ENDPOINTS.GET_BY_ID(id),
    "GET",
    null,
    token,
  );
  if (error) return { success: false, error, data: null };
  return { success: true, data };
};

// GET /api/sensors/by-zone/{zoneId}
// Retourne [{ id, label, type, status, zoneId, ... }]
const getByZone = async (zoneId, token) => {
  const { data, error } = await apiCall(
    SENSOR_ENDPOINTS.GET_BY_ZONE(zoneId),
    "GET",
    null,
    token,
  );
  if (error) return { success: false, error, data: [] };
  return { success: true, data: data ?? [] };
};

export const sensorService = { getById, getByZone };
