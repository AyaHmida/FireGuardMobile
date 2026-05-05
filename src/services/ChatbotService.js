// services/ChatbotService.js

import { BASE_URL, apiCall } from "./api";

const CHATBOT_ENDPOINTS = {
  MESSAGE: `${BASE_URL}/api/chatbot/message`,
  HISTORY: (page, pageSize) =>
    `${BASE_URL}/api/chatbot/history?page=${page}&pageSize=${pageSize}`,
  SUGGESTIONS: `${BASE_URL}/api/chatbot/suggestions`,
};

/**
 * Send a user message to the chatbot and get a response.
 * @param {string} message - The user's message text
 * @param {string} token - JWT auth token
 * @returns {{ success: boolean, data?: ChatResponseDto, error?: string }}
 */
const sendMessage = async (message, token) => {
  const body = { message };

  const { data, error } = await apiCall(
    CHATBOT_ENDPOINTS.MESSAGE,
    "POST",
    body,
    token,
  );

  if (error) {
    console.error("Chatbot sendMessage error:", error);
    return { success: false, error };
  }

  return { success: true, data };
};

/**
 * Fetch paginated chat history for the current user.
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Number of messages per page (max 100)
 * @param {string} token - JWT auth token
 * @returns {{ success: boolean, data?: ChatHistoryDto[], error?: string }}
 */
const getHistory = async (page = 1, pageSize = 20, token) => {
  const { data, error } = await apiCall(
    CHATBOT_ENDPOINTS.HISTORY(page, pageSize),
    "GET",
    null,
    token,
  );

  if (error) {
    console.error("Chatbot getHistory error:", error);
    return { success: false, error };
  }

  return { success: true, data };
};

/**
 * Fetch quick-start suggestion questions.
 * @param {string} token - JWT auth token
 * @returns {{ success: boolean, data?: { suggestions: string[] }, error?: string }}
 */
const getSuggestions = async (token) => {
  const { data, error } = await apiCall(
    CHATBOT_ENDPOINTS.SUGGESTIONS,
    "GET",
    null,
    token,
  );

  if (error) {
    console.error("Chatbot getSuggestions error:", error);
    return { success: false, error };
  }

  return { success: true, data };
};

export default {
  sendMessage,
  getHistory,
  getSuggestions,
};