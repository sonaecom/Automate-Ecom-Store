/**
 * Open one MKTLogin profile (local API v2.1.1) and hand back its CDP websocket.
 * The page work is the same as AdsPower: connectOverCDP reuses the profile's own
 * context and first tab, and actions.mjs does the rest with the same guards.
 * The base and optional key come from the environment. Nothing here is hard-coded.
 */

export const MKTLOGIN_DEFAULT_BASE = "http://localhost:4980";

export function mktloginConfig(env = process.env) {
  const base = String(env.MKTLOGIN_API_BASE || MKTLOGIN_DEFAULT_BASE).trim().replace(/\/$/, "");
  const apiKey = String(env.MKTLOGIN_API_KEY || "").trim();
  return { base, apiKey };
}

export function mktloginHeaders(apiKey) {
  return apiKey ? { "X-Api-Key": apiKey, Authorization: `Bearer ${apiKey}` } : {};
}

function profileUrl(base, profileId, action) {
  const id = encodeURIComponent(String(profileId || ""));
  return new URL(`/api/v1/profiles/${id}/${action}`, `${base}/`).toString();
}

export const profileOpenUrl = (base, profileId) => profileUrl(base, profileId, "open");
export const profileCloseUrl = (base, profileId) => profileUrl(base, profileId, "close");
export const profileListUrl = (base) => new URL("/api/v1/profiles", `${base}/`).toString();

export function wsFromOpen(body) {
  if (!body || body.status !== true) {
    const error = new Error("mktlogin_start_failed");
    error.code = "START_FAILED";
    throw error;
  }
  const ws = body.data?.ws || "";
  if (!/^wss?:\/\//.test(ws)) {
    const error = new Error("mktlogin_ws_missing");
    error.code = "WS_MISSING";
    throw error;
  }
  return ws;
}

export async function listProfiles({ base, apiKey, fetchImpl = fetch }) {
  const response = await fetchImpl(profileListUrl(base), { headers: mktloginHeaders(apiKey) });
  const body = await response.json();
  return (Array.isArray(body?.data) ? body.data : []).map((p) => ({ id: p.id, name: p.name, group_name: p.group_name }));
}

export async function startProfile({ base, apiKey, profileId, fetchImpl = fetch }) {
  const response = await fetchImpl(profileOpenUrl(base, profileId), { headers: mktloginHeaders(apiKey) });
  const body = await response.json();
  return { ws: wsFromOpen(body) };
}

export async function stopProfile({ base, apiKey, profileId, fetchImpl = fetch }) {
  await fetchImpl(profileCloseUrl(base, profileId), { headers: mktloginHeaders(apiKey) });
}
