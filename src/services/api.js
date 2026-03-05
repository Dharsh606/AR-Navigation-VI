/**
 * Backend API Layer - analytics, session storage, emergency, user profiles.
 * Set EXPO_PUBLIC_API_URL to your Node backend (e.g. http://localhost:3000).
 */

const BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

async function fetchApi(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json?.() ?? {};
  } catch (e) {
    return null;
  }
}

export async function logSession(data) {
  return fetchApi("/api/sessions", { method: "POST", body: JSON.stringify(data) });
}

export async function logObstacleHeatmap(point) {
  return fetchApi("/api/heatmap", { method: "POST", body: JSON.stringify(point) });
}

export async function getFrequentRoutes() {
  return fetchApi("/api/routes/frequent");
}

export async function getRiskZones() {
  return fetchApi("/api/risk-zones");
}

export async function sendEmergency(payload) {
  return fetchApi("/api/emergency", { method: "POST", body: JSON.stringify(payload) });
}

export const api = {
  logSession,
  logObstacleHeatmap,
  getFrequentRoutes,
  getRiskZones,
  sendEmergency,
};
export default api;
