import { API_ENDPOINTS, apiCall } from "./api";

const getStatus = async (token) => {
  const { data, error, status } = await apiCall(
    API_ENDPOINTS.SYSTEM.STATUS,
    "GET",
    null,
    token,
  );

  return { data, error, status, success: !error };
};

const toggleState = async (payload, token) => {
  const { data, error, status } = await apiCall(
    API_ENDPOINTS.SYSTEM.TOGGLE,
    "PUT",
    payload,
    token,
  );

  return { data, error, status, success: !error };
};

export const systemStateService = {
  getStatus,
  toggleState,
};
