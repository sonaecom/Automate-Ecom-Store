#!/usr/bin/env node
/**
 * Apply ~/.automate-ecom-store/stores.yaml onto the local config.
 * Never prints a profile id or an API key.
 * Caps above the account-safety ceiling are not applied.
 *
 *   node apply-stores.mjs
 *   node apply-stores.mjs --check
 *   node apply-stores.mjs --file path --config path
 */

import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CEILING = {
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
};

const PLATFORMS = new Set(["shopee", "lazada", "tiktokshop"]);

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function parseScalar(raw) {
  const text = raw.trim();
  if (text === "true") return true;
  if (text === "false") return false;
  if (/^-?\d+$/.test(text)) return Number(text);
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1);
  }
  return text;
}

function parseSimpleYamlFixed(text) {
  const root = {};
  const stack = [{ indent: -1, value: root, key: "", parent: null }];
  for (const rawLine of text.split(/\n/)) {
    const withoutComment = rawLine.replace(/\r$/, "").replace(/\s+#.*$/, "");
    if (!withoutComment.trim() || withoutComment.trim().startsWith("#")) continue;
    const indent = withoutComment.match(/^ */)[0].length;
    const content = withoutComment.trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const frame = stack[stack.length - 1];
    if (content.startsWith("- ")) {
      if (!Array.isArray(frame.value)) {
        if (!frame.key || !frame.parent) throw new Error("yaml_error: list item has no list");
        const list = [];
        frame.parent[frame.key] = list;
        frame.value = list;
      }
      const item = {};
      frame.value.push(item);
      stack.push({ indent, value: item, key: "", parent: frame.value });
      const rest = content.slice(2).trim();
      if (rest) putKey(stack, item, rest, indent + 2);
      continue;
    }
    putKey(stack, frame.value, content, indent);
  }
  return root;
}

function putKey(stack, parent, content, indent) {
  const splitAt = content.indexOf(":");
  if (splitAt === -1) throw new Error(`yaml_error: ${content}`);
  const key = content.slice(0, splitAt).trim();
  const raw = content.slice(splitAt + 1).trim();
  if (!key) throw new Error("yaml_error: empty key");
  if (raw === "") {
    const child = {};
    parent[key] = child;
    stack.push({ indent, value: child, key, parent });
    return;
  }
  parent[key] = parseScalar(raw);
}

function clampCaps(caps) {
  const notes = [];
  const next = { session: {}, daily: {} };
  for (const scope of ["session", "daily"]) {
    for (const [key, ceiling] of Object.entries(CEILING[scope])) {
      const asked = caps?.[scope]?.[key];
      if (!Number.isInteger(asked) || asked < 1) {
        next[scope][key] = ceiling;
        continue;
      }
      if (asked > ceiling) {
        notes.push(`cap_not_raised: ${scope}.${key}`);
        next[scope][key] = ceiling;
      } else {
        next[scope][key] = asked;
      }
    }
  }
  return { caps: next, notes };
}

function clampSchedule(schedule) {
  const gapMin = Number.isInteger(schedule?.gap_hours_min) ? schedule.gap_hours_min : 2;
  const gapMax = Number.isInteger(schedule?.gap_hours_max) ? schedule.gap_hours_max : 3;
  const minutes = Number.isInteger(schedule?.session_minutes_max) ? schedule.session_minutes_max : 40;
  return {
    gap_hours_min: Math.max(2, gapMin),
    gap_hours_max: Math.max(Math.max(2, gapMin), gapMax),
    session_minutes_max: Math.min(40, Math.max(1, minutes)),
  };
}

function validateStore(store, { allowPlaceholder }) {
  if (!store || typeof store !== "object") return "store must be an object";
  if (!PLATFORMS.has(store.platform)) return "platform must be shopee, lazada, or tiktokshop";
  if (typeof store.label !== "string" || !store.label.trim()) return "label is required";
  if (typeof store.market !== "string" || !store.market.trim()) return "market is required";
  if (typeof store.staff !== "string" || !store.staff.trim()) return "staff is required";
  if (typeof store.profile_id !== "string" || !store.profile_id.trim()) return "profile_id is required";
  const placeholder = store.profile_id.includes("<");
  if (allowPlaceholder && !placeholder) return "example profile_id must stay a placeholder";
  if (!allowPlaceholder && placeholder) return "placeholder";
  return "";
}

function printStore(store) {
  console.log(`store: ${store.label}`);
  console.log(`platform: ${store.platform}`);
  console.log(`market: ${store.market}`);
  console.log(`staff: ${store.staff}`);
  console.log(`gap_hours_min: ${store.schedule.gap_hours_min}`);
  console.log(`gap_hours_max: ${store.schedule.gap_hours_max}`);
  console.log(`session_minutes_max: ${store.schedule.session_minutes_max}`);
  for (const scope of ["session", "daily"]) {
    for (const [key, value] of Object.entries(store.caps[scope])) {
      console.log(`${scope}_${key}: ${value}`);
    }
  }
}

function normalize(raw, allowPlaceholder) {
  if (!raw || !Array.isArray(raw.stores)) throw new Error("yaml_error: stores list is required");
  return raw.stores.map((store) => {
    const error = validateStore(store, { allowPlaceholder });
    if (error && error !== "placeholder") throw new Error(`yaml_error: ${error}`);
    const capped = clampCaps(store.caps);
    return {
      placeholder: store.profile_id.includes("<"),
      profile_id: store.profile_id.trim(),
      label: store.label.trim(),
      platform: store.platform,
      market: store.market.trim(),
      staff: store.staff.trim(),
      schedule: clampSchedule(store.schedule),
      caps: capped.caps,
      notes: capped.notes,
    };
  });
}

function homeFile(name) {
  return join(homedir(), ".automate-ecom-store", name);
}

function main() {
  const check = process.argv.includes("--check");
  const examplePath = join(import.meta.dirname, "..", "stores.example.yaml");
  const sourcePath = arg("--file") || (check ? examplePath : homeFile("stores.yaml"));
  if (!existsSync(sourcePath)) {
    console.log("stores_file: missing");
    console.log("result: SKIP");
    return;
  }
  let parsed;
  try {
    parsed = parseSimpleYamlFixed(readFileSync(sourcePath, "utf8"));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
  let stores;
  try {
    stores = normalize(parsed, check);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
  if (check) {
    console.log(`store_count: ${stores.length}`);
    console.log("result: OK");
    return;
  }
  const configPath = arg("--config") || homeFile("config.yaml");
  if (!existsSync(configPath)) {
    console.log("config: missing");
    console.log("result: SKIP");
    return;
  }
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const current = Array.isArray(config.stores) ? config.stores : [];
  const notes = [];
  for (const store of stores) {
    const index = current.findIndex((item) => item && item.label === store.label);
    if (store.placeholder && index < 0) {
      console.log(`pending: ${store.label}`);
      continue;
    }
    const previous = index >= 0 ? current[index] : {};
    const profile = store.placeholder ? previous.profile_id : store.profile_id;
    if (!profile || String(profile).includes("<")) {
      console.log(`pending: ${store.label}`);
      continue;
    }
    const merged = {
      ...previous,
      platform: store.platform,
      profile_id: profile,
      label: store.label,
      market: store.market,
      staff: store.staff,
      schedule: store.schedule,
      caps: store.caps,
    };
    if (index >= 0) current[index] = merged;
    else current.push(merged);
    notes.push(...store.notes);
    printStore(merged);
  }
  config.stores = current;
  const dir = join(configPath, "..");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  chmodSync(configPath, 0o600);
  for (const note of notes) console.log(note);
  console.log(`store_count: ${current.length}`);
  console.log("result: APPLIED");
}

if (process.argv[1] && process.argv[1].endsWith("apply-stores.mjs")) main();
