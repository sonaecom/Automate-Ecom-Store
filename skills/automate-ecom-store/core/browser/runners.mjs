/**
 * Pick the browser runner for a store. Both runners only open a profile and
 * return a CDP websocket; everything after that (one tab, pacing, captcha,
 * read-only and money guards, journal) is shared code.
 */

import * as adspower from "./adspower-runner.mjs";
import * as mktlogin from "./mktlogin-runner.mjs";

export const RUNNERS = ["adspower", "mktlogin"];

export function runnerName(value) {
  const name = String(value || "adspower").trim().toLowerCase();
  if (!RUNNERS.includes(name)) {
    const error = new Error("runner must be adspower or mktlogin");
    error.code = "BAD_RUNNER";
    throw error;
  }
  return name;
}

/**
 * True when an error means the runner app itself could not be reached
 * (not running, wrong port, host down), as opposed to a profile problem.
 */
export function isUnreachable(error) {
  const codes = ["ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH", "ENOTFOUND", "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_SOCKET"];
  let current = error;
  for (let depth = 0; current && depth < 4; depth += 1) {
    if (codes.includes(current.code)) return true;
    if (current.name === "AbortError" || current.name === "TimeoutError") return true;
    current = current.cause;
  }
  return error instanceof TypeError && /fetch failed/i.test(String(error.message || ""));
}

/**
 * Preflight: is the runner app answering on its local API at all?
 * Any HTTP answer counts as reachable; only network failures count as down.
 * Returns { ok, runner, reason } and never throws.
 */
export async function checkRunner(value, env = process.env, { fetchImpl = fetch, timeoutMs = 5000 } = {}) {
  let selected;
  try {
    selected = selectRunner(value, env);
  } catch (error) {
    return { ok: false, runner: String(value || "adspower"), reason: error.code || "MISSING_ENV" };
  }
  const { base, apiKey } = selected.config;
  const url = selected.name === "mktlogin" ? mktlogin.profileListUrl(base) : new URL("/status", `${base}/`).toString();
  const headers = selected.name === "mktlogin" ? mktlogin.mktloginHeaders(apiKey) : adspower.authHeaders(apiKey);
  try {
    const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
    if (response.status === 401 || response.status === 403) return { ok: false, runner: selected.name, reason: "AUTH_REJECTED" };
    return { ok: true, runner: selected.name, reason: "OK" };
  } catch (error) {
    return { ok: false, runner: selected.name, reason: isUnreachable(error) ? "RUNNER_UNAVAILABLE" : "CHECK_FAILED" };
  }
}

export function selectRunner(value, env = process.env) {
  const name = runnerName(value);
  if (name === "mktlogin") {
    return { name, config: mktlogin.mktloginConfig(env), startProfile: mktlogin.startProfile, stopProfile: mktlogin.stopProfile };
  }
  return { name, config: adspower.adsPowerConfig(env), startProfile: adspower.startProfile, stopProfile: adspower.stopProfile };
}
