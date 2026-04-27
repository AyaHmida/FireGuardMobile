// services/MeasurementService.js
import { BASE_URL } from "./api";

export async function getSensorHistory(sensorId, start, end, token) {
  const url = `${BASE_URL}/api/measurements/${sensorId}/history?start=${start}&end=${end}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Erreur lors du chargement de l'historique");
  return await res.json();
}

export async function getSensorStats(sensorId, start, end, token) {
  const history = await getSensorHistory(sensorId, start, end, token);

  if (!history || history.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }

  const values = history.map((h) => h.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

  return { min, max, avg };
}
