#!/usr/bin/env node
/**
 * Classify a stock change. Does not open a seller site and does not type.
 * Manual mode previews an exact variation quantity and marks PUSH only after
 * --confirm. Auto mode marks PUSH only inside an owner time window, after
 * buffer, and never below reserved plus pending.
 *
 *   node inventory-sync.mjs --platform-stock file --set <SKU>=50 --store <STORE> --platform shopee [--confirm] [--readback file]
 *   node inventory-sync.mjs --platform-stock file --sets file [--confirm] [--readback file]
 *   node inventory-sync.mjs --platform-stock file --source file --map file --now HH:MM --mode auto [--apply]
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function argsAll(name) {
  const out = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === name && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) {
      out.push(process.argv[i + 1]);
    }
  }
  return out;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

function records(path) {
  const rows = parseCsv(readFileSync(path, "utf8"));
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  return rows.slice(1).map((cells) => {
    const record = {};
    header.forEach((key, index) => {
      record[key] = (cells[index] || "").trim();
    });
    return record;
  });
}

function num(value) {
  if (value === undefined || value === "" || String(value).includes("<")) return null;
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function show(value) {
  if (value === null || !Number.isFinite(value)) return "";
  return String(Math.round(value * 10000) / 10000);
}

function configMap(path) {
  const out = {};
  if (!path) return out;
  for (const raw of readFileSync(path, "utf8").split(/\n/)) {
    const line = raw.replace(/\s+#.*$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const pair = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!pair) continue;
    out[pair[1]] = pair[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

function minutes(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value || "");
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function windowOpen(now, times, tolerance) {
  const current = minutes(now);
  if (current === null) return false;
  return times.some((slot) => {
    const target = minutes(slot);
    if (target === null) return false;
    const diff = Math.abs(current - target);
    return Math.min(diff, 1440 - diff) <= tolerance;
  });
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function usage() {
  console.error("usage: node inventory-sync.mjs --platform-stock file (--set <SKU>=<QTY> --store <STORE> --platform <PLATFORM> | --sets file) [--confirm] [--readback file] [--mode manual] [--config file] [--out-dir DIR]");
  console.error("   or: node inventory-sync.mjs --platform-stock file --source file --map file --now HH:MM --mode auto [--apply] [--config file] [--out-dir DIR]");
  process.exit(2);
}

const platformPath = arg("--platform-stock");
const sourcePath = arg("--source");
const mapPath = arg("--map");
const setsPath = arg("--sets");
const setArgs = argsAll("--set");
const now = arg("--now");
const readbackPath = arg("--readback");
const cfg = configMap(arg("--config"));
const mode = (arg("--mode") || cfg.mode || "manual").toLowerCase();
const manual = mode !== "auto";
if (mode !== "auto" && mode !== "manual") usage();
if (!platformPath) usage();
if (manual && setArgs.length === 0 && !setsPath) usage();
if (!manual && (!sourcePath || !mapPath || !now)) usage();

const apply = process.argv.includes("--apply");
const confirm = process.argv.includes("--confirm");
const buffer = num(arg("--buffer") || cfg.buffer) ?? 0;
const skipPercent = num(arg("--skip-change-percent") || cfg.skip_change_percent);
const batchSize = num(arg("--batch-size") || cfg.batch_size) ?? 10;
const sessionMax = num(arg("--session-max") || cfg.session_max) ?? 10;
const tolerance = num(arg("--tolerance-minutes") || cfg.tolerance_minutes) ?? 0;
const times = (arg("--times") || cfg.times || "").split(",").map((item) => item.trim()).filter(Boolean);
const open = manual ? false : windowOpen(now, times, tolerance);
const skuColumn = (cfg.sku_column || "sku").toLowerCase();
const qtyColumn = (cfg.qty_column || "qty").toLowerCase();
const manualSku = (cfg.manual_sku_column || "sku").toLowerCase();
const manualQty = (cfg.manual_qty_column || "qty").toLowerCase();
const manualStore = (cfg.manual_store_column || "store").toLowerCase();
const manualPlatform = (cfg.manual_platform_column || "platform").toLowerCase();

const decisions = [];

if (manual) {
  const store = arg("--store");
  const platform = arg("--platform");
  const rawSets = [];
  for (const text of setArgs) {
    const match = /^(.*)=([^=]+)$/.exec(text.trim());
    if (!match || !store || !platform) usage();
    rawSets.push({ sku: match[1].trim(), qty: match[2].trim(), store, platform });
  }
  if (setsPath) {
    for (const row of records(setsPath)) {
      rawSets.push({
        sku: row[manualSku] || row.sku || "",
        qty: row[manualQty] || row.qty || "",
        store: row[manualStore] || row.store || "",
        platform: row[manualPlatform] || row.platform || "",
      });
    }
  }
  const setMap = new Map();
  for (const item of rawSets) {
    if (!item.sku || !item.store || !item.platform) usage();
    setMap.set(`${item.store}|${item.platform}|${item.sku}`, item);
  }
  const platformByKey = new Map();
  for (const row of records(platformPath)) {
    platformByKey.set(`${row.store}|${row.platform}|${row.sku}`, row);
  }
  for (const item of setMap.values()) {
    const row = platformByKey.get(`${item.store}|${item.platform}|${item.sku}`);
    const requested = num(item.qty);
    const base = {
      sku: item.sku,
      store: item.store,
      platform: item.platform,
      on_hand: "",
      floor: "",
      proposed: "",
      source: "manual",
      reason: "",
      decision: "SKIP",
    };
    if (!row) {
      decisions.push({ ...base, reason: "not_on_export" });
      continue;
    }
    const onHand = num(row.on_hand);
    const reserved = num(row.reserved) ?? 0;
    const pending = num(row.pending) ?? 0;
    const floor = reserved + pending;
    base.on_hand = show(onHand);
    base.floor = String(floor);
    if (onHand === null || requested === null) {
      decisions.push({ ...base, reason: "missing_qty" });
      continue;
    }
    const proposed = Math.max(requested, floor);
    const reasons = [];
    if (requested < floor) reasons.push("floored");
    base.proposed = String(proposed);
    if (proposed === onHand) {
      decisions.push({ ...base, decision: "UNCHANGED", reason: reasons.join(",") });
      continue;
    }
    if (onHand === 0) reasons.push("from_zero");
    else if (skipPercent !== null) {
      const changePercent = Math.abs(proposed - onHand) / onHand * 100;
      if (changePercent >= skipPercent) reasons.push("large_change");
    }
    decisions.push({ ...base, decision: "ELIGIBLE", reason: reasons.join(",") });
  }
} else {
  const sourceBySku = new Map();
  for (const row of records(sourcePath)) {
    const key = row[skuColumn] || row.sku || row.source_sku;
    if (key) sourceBySku.set(key, num(row[qtyColumn] || row.qty));
  }
  const mapBySeller = new Map();
  for (const row of records(mapPath)) {
    if (row.seller_sku) mapBySeller.set(`${row.store}|${row.platform}|${row.seller_sku}`, row);
  }
  for (const row of records(platformPath)) {
    const key = `${row.store}|${row.platform}|${row.sku}`;
    const mapped = mapBySeller.get(key);
    const onHand = num(row.on_hand);
    const reserved = num(row.reserved) ?? 0;
    const pending = num(row.pending) ?? 0;
    const floor = reserved + pending;
    const base = {
      sku: row.sku || "",
      store: row.store || "",
      platform: row.platform || "",
      on_hand: show(onHand),
      floor: String(floor),
      proposed: "",
      source: mapped ? mapped.source : "",
      reason: "",
      decision: "SKIP",
    };
    if (!mapped) {
      decisions.push({ ...base, reason: "unmapped" });
      continue;
    }
    const sourceQty = sourceBySku.get(mapped.source_sku);
    if (onHand === null || sourceQty === null) {
      decisions.push({ ...base, reason: "missing_qty" });
      continue;
    }
    const raw = sourceQty - buffer;
    const proposed = Math.max(raw, floor);
    const floored = raw < floor;
    base.proposed = String(proposed);
    if (proposed === onHand) {
      decisions.push({ ...base, decision: "UNCHANGED", reason: floored ? "floored" : "" });
      continue;
    }
    const changePercent = onHand === 0 ? null : Math.abs(proposed - onHand) / onHand * 100;
    if (onHand === 0 || (skipPercent !== null && changePercent !== null && changePercent >= skipPercent)) {
      decisions.push({ ...base, decision: "SKIP", reason: onHand === 0 ? "from_zero" : "large_change" });
      continue;
    }
    decisions.push({ ...base, decision: "ELIGIBLE", reason: floored ? "floored" : "" });
  }
}

let pushes = 0;
for (const row of decisions) {
  if (row.decision !== "ELIGIBLE") continue;
  if (manual) {
    if (!confirm) {
      row.decision = "PREVIEW";
      continue;
    }
  } else if (!apply || !open) {
    row.decision = "PREVIEW";
    if (!open) row.reason = row.reason ? `${row.reason},window_closed` : "window_closed";
    continue;
  }
  if (pushes >= sessionMax) {
    row.decision = "DEFER";
    row.reason = "session_cap";
    continue;
  }
  pushes += 1;
  row.decision = "PUSH";
  row.batch = String(Math.floor((pushes - 1) / batchSize) + 1);
}

const outDir = arg("--out-dir");
if (outDir) {
  mkdirSync(outDir, { recursive: true });
  const header = ["sku", "store", "platform", "on_hand", "floor", "proposed", "source", "decision", "reason", "batch"];
  const lines = [header.join(",")];
  for (const row of decisions) {
    lines.push(header.map((key) => csvCell(row[key] || "")).join(","));
  }
  writeFileSync(join(outDir, "inventory-audit.csv"), `${lines.join("\n")}\n`);
}

console.log(`mode: ${mode}`);
console.log(`window: ${manual ? "n/a" : open ? "open" : "closed"}`);
console.log(`apply: ${apply ? "yes" : "no"}`);
console.log(`confirm: ${confirm ? "yes" : "no"}`);
console.log(`buffer: ${manual ? "off" : buffer}`);
for (const row of decisions) {
  console.log(`sku ${row.sku} store ${row.store} platform ${row.platform} on_hand ${row.on_hand} floor ${row.floor} proposed ${row.proposed} source ${row.source} decision ${row.decision} reason ${row.reason} batch ${row.batch || ""}`);
}
if (readbackPath) {
  const back = new Map();
  for (const row of records(readbackPath)) {
    back.set(`${row.store}|${row.platform}|${row.sku}`, num(row.on_hand));
  }
  for (const row of decisions) {
    const seen = back.get(`${row.store}|${row.platform}|${row.sku}`);
    const proposed = num(row.proposed);
    let status = "MISMATCH";
    if (seen === undefined || seen === null) status = "MISSING";
    else if (proposed !== null && seen === proposed) status = "MATCH";
    console.log(`readback sku ${row.sku} store ${row.store} platform ${row.platform} proposed ${row.proposed} on_hand ${seen === undefined || seen === null ? "" : seen} ${status}`);
  }
}
const counts = decisions.reduce((map, row) => {
  map[row.decision] = (map[row.decision] || 0) + 1;
  return map;
}, {});
for (const [key, value] of Object.entries(counts)) console.log(`count_${key}: ${value}`);
console.log("result: OK");
