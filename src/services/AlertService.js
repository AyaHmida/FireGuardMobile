import { BASE_URL, apiCall } from "./api";

const ALERT_ENDPOINTS = {
  ALL: `${BASE_URL}/api/alerts`,
  BY_ZONE: (zoneId) => `${BASE_URL}/api/alerts/zone/${zoneId}`,
  MARK_AS_READ: (id) => `${BASE_URL}/api/alerts/${id}/read`,
};

const getAllAlerts = async (token) => {
  const { data, error } = await apiCall(
    ALERT_ENDPOINTS.ALL,
    "GET",
    null,
    token,
  );

  if (error) {
    return { success: false, data: [] };
  }

  // 🔥 NE PAS transformer ici
  return { success: true, data: data };
};

const getAlertsByZone = async (zoneId, token) => {
  const { data, error } = await apiCall(
    ALERT_ENDPOINTS.BY_ZONE(zoneId),
    "GET",
    null,
    token,
  );

  if (error) {
    console.log("Alert API error:", error);
    return { success: false, data: [] };
  }

  return { success: true, data: data?.items ?? [] };
};

const markAsRead = async (id, token) => {
  await apiCall(ALERT_ENDPOINTS.MARK_AS_READ(id), "PUT", null, token);
};

export const alertService = {
  getAllAlerts,
  getAlertsByZone,
  markAsRead,
};
