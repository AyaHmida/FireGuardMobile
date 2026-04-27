import { BASE_URL, apiCall } from "./api";

const ZONE_ENDPOINTS = {
  MY_ZONES: `${BASE_URL}/api/zones/my-zones`,
  REALTIME: (zoneId) => `${BASE_URL}/api/zones/${zoneId}/realtime`,
};

const getMyZones = async (token) => {
  const { data, error } = await apiCall(
    ZONE_ENDPOINTS.MY_ZONES,
    "GET",
    null,
    token,
  );

  if (error) return { success: false, error, data: [] };

  return { success: true, data: data ?? [] };
};

const getZoneRealtime = async (zoneId, token) => {
  const url = ZONE_ENDPOINTS.REALTIME(zoneId);
  const { data, error } = await apiCall(url, "GET", null, token);

  if (error) {
    console.log("Realtime API error:", error);
    return {
      success: false,
      data: { temperature: 0, humidity: 0, gas: 0 },
    };
  }

  return { success: true, data };
};

export const zoneService = {
  getMyZones,
  getZoneRealtime,
};
