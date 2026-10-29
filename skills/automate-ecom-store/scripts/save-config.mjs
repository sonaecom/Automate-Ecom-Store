#!/usr/bin/env node
/**
 * Save or reset the local store config. Never prints secrets.
 *
 * Live file: ~/.automate-ecom-store/config.yaml
 * Directory mode 700. File mode 600.
 *
 *   node save-config.mjs --status
 *   node save-config.mjs --reset
 *   node save-config.mjs < payload.json
 *
 * The JSON payload is:
 *   api_key          required on first write, omitted on later merges
 *   api_base         optional; empty means the client's usual Local API address
 *   stores           [{ platform, profile_id, label? }]
 *   roas_floor       optional number or ""
 *   price_drop_approval_percent  optional number or ""
 *   tasks            optional object merged by key
 *
 * Stdin is required for a write. Values are never echoed.
 * Exit 0: SAVED, RESET, or a present config.
 * Exit 1: config missing on --status, or headless is not false.
 * Exit 2: usage or invalid payload.
 */

import { chmodSync, existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PLATFORMS = new Set(["shopee", "lazada", "tiktokshop"]);

const DEFAULTS = {
  schedule: { gap_hours_min: 2, gap_hours_max: 3, session_minutes_max: 40 },
  caps: {
    session: {
      listing_edits: 10,
      affiliate_invites: 30,
      affiliate_batch_size: 10,
      ads_changes: 3,
      chat_replies: 10,
    },
    daily: {
      listing_edits: 10,
      affiliate_invites: 30,
      ads_changes: 3,
      chat_replies: 10,
    },
  },
  paths: {
    invited_csv: "data/invited.csv",
    captcha_log: "data/captcha_log.csv",
    session_state: "data/session-state.json",
    screenshots_dir: "screenshots",
  },
  show_click_dot: true,
};

function homePaths() {
  const dir = join(homedir(), ".automate-ecom-store");
  return { dir, file: join(dir, "config.yaml") };
}

function usage() {
  console.error("usage: node save-config.mjs (--status | --reset | < payload.json)");
}

function blank() {
  return {
    adspower: { api_key: "", api_base: "", headless: false },
    stores: [],
    schedule: structuredClone(DEFAULTS.schedule),
    caps: structuredClone(DEFAULTS.caps),
    price_drop_approval_percent: "",
    roas_floor: "",
    paths: structuredClone(DEFAULTS.paths),
    show_click_dot: true,
    tasks: {},
  };
}

function readConfig(file) {
  const text = readFileSync(file, "utf8");
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("config_error: root must be an object");
  }
  return parsed;
}

function writeConfig(dir, file, config) {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
  const body = `${JSON.stringify(config, null, 2)}\n`;
  writeFileSync(file, body, { mode: 0o600 });
  chmodSync(file, 0o600);
}

function isSet(value) {
  return typeof value === "string" && value.trim() !== "" && !value.includes("<");
}

function status(file) {
  if (!existsSync(file)) {
    console.log("config: missing");
    console.log("api_key: missing");
    console.log("api_base: missing");
    console.log("store_count: 0");
    console.log("platforms:");
    console.log("result: MISSING");
    process.exit(1);
  }
  let config;
  try {
    config = readConfig(file);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
  const mode = statSync(file).mode & 0o777;
  if (mode !== 0o600) chmodSync(file, 0o600);
  const ads = config.adspower || {};
  const stores = Array.isArray(config.stores) ? config.stores : [];
  const platforms = [...new Set(stores.map((store) => store && store.platform).filter(Boolean))].sort();
  console.log("config: present");
  console.log(`api_key: ${isSet(ads.api_key) ? "set" : "missing"}`);
  console.log(`api_base: ${isSet(ads.api_base) ? "custom" : "default"}`);
  console.log(`store_count: ${stores.length}`);
  console.log(`platforms: ${platforms.join(" ")}`);
  console.log(`headless: ${ads.headless === false ? "false" : "blocked"}`);
  console.log("mode: 600");
  if (ads.headless !== false) {
    console.log("result: BLOCKED");
    process.exit(1);
  }
  if (!isSet(ads.api_key)) {
    console.log("result: MISSING");
    process.exit(1);
  }
  if (stores.length === 0) {
    console.log("result: NEED_STORES");
    return;
  }
  console.log("result: OK");
}

function validateStores(stores) {
  if (!Array.isArray(stores)) return "stores must be a list";
  if (stores.length === 0) return "";
  for (const store of stores) {
    if (!store || typeof store !== "object") return "each store must be an object";
    if (!PLATFORMS.has(store.platform)) return "platform must be shopee, lazada, or tiktokshop";
    if (!isSet(store.profile_id)) return "each store needs a profile_id";
    if (store.label !== undefined && typeof store.label !== "string") return "label must be a string";
  }
  return "";
}

function applyPayload(current, payload, { requireKey }) {
  const next = current;
  if (payload.api_key !== undefined) {
    if (!isSet(payload.api_key)) return "api_key is empty or still a placeholder";
    next.adspower.api_key = payload.api_key.trim();
  } else if (requireKey && !isSet(next.adspower.api_key)) {
    return "api_key is required";
  }
  if (payload.api_base !== undefined) {
    if (payload.api_base !== "" && !isSet(payload.api_base)) return "api_base is still a placeholder";
    next.adspower.api_base = String(payload.api_base).trim();
  }
  next.adspower.headless = false;
  if (payload.stores !== undefined) {
    const error = validateStores(payload.stores);
    if (error) return error;
    next.stores = payload.stores.map((store) => ({
      platform: store.platform,
      profile_id: store.profile_id.trim(),
      label: typeof store.label === "string" ? store.label.trim() : "",
    }));
  }
  if (payload.roas_floor !== undefined) next.roas_floor = payload.roas_floor;
  if (payload.price_drop_approval_percent !== undefined) {
    next.price_drop_approval_percent = payload.price_drop_approval_percent;
  }
  if (payload.tasks && typeof payload.tasks === "object" && !Array.isArray(payload.tasks)) {
    next.tasks = { ...next.tasks, ...payload.tasks };
  }
  return "";
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(0);
  }
  if (args.length > 1 || (args.length === 1 && args[0] !== "--status" && args[0] !== "--reset")) {
    usage();
    process.exit(2);
  }
  const { dir, file } = homePaths();
  if (args[0] === "--status") {
    status(file);
    return;
  }
  if (args[0] === "--reset") {
    if (existsSync(file)) unlinkSync(file);
    console.log("config: missing");
    console.log("result: RESET");
    return;
  }
  if (process.stdin.isTTY) {
    usage();
    process.exit(2);
  }
  let payload;
  try {
    payload = JSON.parse(readFileSync(0, "utf8"));
  } catch (error) {
    console.error(`payload_error: ${error.message}`);
    process.exit(2);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    console.error("payload_error: JSON object required");
    process.exit(2);
  }
  const existing = existsSync(file);
  let current = blank();
  if (existing) {
    try {
      const loaded = readConfig(file);
      current = {
        ...blank(),
        ...loaded,
        adspower: { ...blank().adspower, ...(loaded.adspower || {}) },
        tasks: { ...(loaded.tasks || {}) },
      };
    } catch (error) {
      console.error(error.message);
      process.exit(2);
    }
  }
  const error = applyPayload(current, payload, { requireKey: !existing });
  if (error) {
    console.error(`payload_error: ${error}`);
    process.exit(2);
  }
  if (!isSet(current.adspower.api_key)) {
    console.error("payload_error: api_key is required");
    process.exit(2);
  }
  if (current.stores.length > 0) {
    const storeError = validateStores(current.stores);
    if (storeError) {
      console.error(`payload_error: ${storeError}`);
      process.exit(2);
    }
  }
  writeConfig(dir, file, current);
  console.log("config: present");
  console.log("api_key: set");
  console.log(`api_base: ${isSet(current.adspower.api_base) ? "custom" : "default"}`);
  console.log(`store_count: ${current.stores.length}`);
  console.log("mode: 600");
  console.log("result: SAVED");
}

main();
