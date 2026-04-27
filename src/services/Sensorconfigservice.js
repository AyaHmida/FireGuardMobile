import { API_ENDPOINTS } from "./api";

// ─────────────────────────────────────────────────────────────
//  GET  /api/sensor-configurations/{sensorId}
//  Retourne null si pas de config (404)
// ─────────────────────────────────────────────────────────────
export const getSensorConfig = async (sensorId, token) => {
  const response = await fetch(
    API_ENDPOINTS.SENSOR_CONFIG.GET_BY_SENSOR(sensorId),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(`getSensorConfig(${sensorId}) failed: ${response.status}`);

  return response.json();
};

// ─────────────────────────────────────────────────────────────
//  POST /api/sensor-configurations
//  dto : { sensorId, preAlertThreshold, alertThreshold, criticalThreshold }
// ─────────────────────────────────────────────────────────────
export const setSensorConfig = async (dto, token) => {
  const response = await fetch(API_ENDPOINTS.SENSOR_CONFIG.SET, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok)
    throw new Error(`setSensorConfig failed: ${response.status}`);

  return response.json();
};
