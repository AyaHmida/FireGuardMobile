// services/deviceControlService.js

import { BASE_URL, apiCall } from "./api";

const DEVICE_CONTROL_ENDPOINTS = {
  CONTROL: (deviceId) => `${BASE_URL}/api/device-control/${deviceId}`,
};

const sendCommand = async (deviceId, action, token) => {
  const body = {
    action: action,
  };

  const { data, error } = await apiCall(
    DEVICE_CONTROL_ENDPOINTS.CONTROL(deviceId),
    "POST",
    body,
    token,
  );

  if (error) {
    console.log("Device control error:", error);
    return { success: false };
  }

  return { success: true, data };
};

export const deviceControlService = {
  sendCommand,
};
