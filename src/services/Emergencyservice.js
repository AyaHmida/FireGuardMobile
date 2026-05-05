import { BASE_URL, apiCall } from "./api";

const EMERGENCY_ENDPOINTS = {
  GET_ALL: (userId) => `${BASE_URL}/api/emergencycontacts/${userId}`,
  ADD: (userId) => `${BASE_URL}/api/emergencycontacts/${userId}`,
  DELETE: (id) => `${BASE_URL}/api/emergencycontacts/${id}`,
  SIMULATE_CALL: (userId) =>
    `${BASE_URL}/api/emergencycontacts/${userId}/simulate-call`,
};

const getContacts = async (userId, token) => {
  const { data, error } = await apiCall(
    EMERGENCY_ENDPOINTS.GET_ALL(userId),
    "GET",
    null,
    token,
  );
  if (error) return { success: false, error, data: [] };
  return { success: true, data: data ?? [] };
};

const addContact = async (userId, dto, token) => {
  const { data, error } = await apiCall(
    EMERGENCY_ENDPOINTS.ADD(userId),
    "POST",
    dto,
    token,
  );
  if (error) return { success: false, error };
  return { success: true, data };
};

const deleteContact = async (id, token) => {
  const { data, error } = await apiCall(
    EMERGENCY_ENDPOINTS.DELETE(id),
    "DELETE",
    null,
    token,
  );
  if (error) return { success: false, error };
  return { success: true, data };
};

const simulateCall = async (userId, token) => {
  const { data, error } = await apiCall(
    EMERGENCY_ENDPOINTS.SIMULATE_CALL(userId),
    "POST",
    null,
    token,
  );

  if (error) return { success: false, error };

  // FIX ICI
  return {
    success: true,
    message: data?.length
      ? `Appel envoyé à ${data.length} contact(s)`
      : "Aucun appel effectué",
  };
};

export const emergencyService = {
  getContacts,
  addContact,
  deleteContact,
  simulateCall,
};
