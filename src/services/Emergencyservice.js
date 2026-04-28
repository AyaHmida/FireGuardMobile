import { BASE_URL, apiCall } from "./api";

const EMERGENCY_ENDPOINTS = {
  GET_ALL: `${BASE_URL}/api/emergency`,
  ADD: `${BASE_URL}/api/emergency/add`,
  DELETE: (id) => `${BASE_URL}/api/emergency/${id}`,
  SIMULATE_CALL: `${BASE_URL}/api/emergency/simulate-call`,
};

/**
 * GET /api/emergency
 * Fetch all emergency contacts for the authenticated user.
 */
const getContacts = async (token) => {
  const { data, error } = await apiCall(
    EMERGENCY_ENDPOINTS.GET_ALL,
    "GET",
    null,
    token,
  );

  if (error) return { success: false, error, data: [] };
  return { success: true, data: data ?? [] };
};

/**
 * POST /api/emergency/add
 * Add a new emergency contact.
 * @param {{ name: string, phoneNumber: string, relationship: string }} dto
 */
const addContact = async (dto, token) => {
  const { data, error } = await apiCall(
    EMERGENCY_ENDPOINTS.ADD,
    "POST",
    dto,
    token,
  );

  if (error) return { success: false, error };
  return { success: true, data };
};

/**
 * DELETE /api/emergency/{id}
 * Delete an emergency contact by ID.
 * @param {number} id
 */
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

/**
 * POST /api/emergency/simulate-call
 * Trigger a Twilio sandbox call simulation to all contacts.
 */
const simulateCall = async (token) => {
  const { data, error } = await apiCall(
    EMERGENCY_ENDPOINTS.SIMULATE_CALL,
    "POST",
    null,
    token,
  );

  if (error) return { success: false, error };
  return { success: true, message: data?.message ?? "Appel simulé" };
};

export const emergencyService = {
  getContacts,
  addContact,
  deleteContact,
  simulateCall,
};
