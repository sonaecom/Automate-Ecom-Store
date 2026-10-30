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

export function selectRunner(value, env = process.env) {
  const name = runnerName(value);
  if (name === "mktlogin") {
    return { name, config: mktlogin.mktloginConfig(env), startProfile: mktlogin.startProfile, stopProfile: mktlogin.stopProfile };
  }
  return { name, config: adspower.adsPowerConfig(env), startProfile: adspower.startProfile, stopProfile: adspower.stopProfile };
}
