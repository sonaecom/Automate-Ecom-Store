#!/usr/bin/env node
/**
 * Preview or list a stock push. Does not open a seller site and does not
 * type a quantity. Manual mode only alerts. Auto mode marks PUSH only inside
 * an owner time window and never below reserved plus pending.
 *
 *   node inventory-sync.mjs --platform-stock file --source file --map file \
 *     --now HH:MM [--mode manual|auto] [--apply] [--config file] [--out-dir DIR]
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
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

const platformPath = arg("--platform-stock");
const sourcePath = arg("--source");
const mapPath = arg("--map");
const now = arg("--now");
if (!platformPath || !sourcePath || !mapPath || !now) {
  console.error("usage: node inventory-sync.mjs --platform-stock file --source file --map file --now HH:MM [--mode manual|auto] [--apply] [--config file] [--out-dir DIR]");
  process.exit(2);
}

const cfg = configMap(arg("--config"));
const mode = (arg("--mode") || cfg.mode || "manual").toLowerCase();
const apply = process.argv.includes("--apply");
const buffer = num(arg("--buffer") || cfg.buffer) ?? 0;
const skipPercent = num(arg("--skip-change-percent") || cfg.skip_change_percent);
const batchSize = num(arg("--batch-size") || cfg.batch_size) ?? 10;
const sessionMax = num(arg("--session-max") || cfg.session_max) ?? 10;
const tolerance = num(arg("--tolerance-minutes") || cfg.tolerance_minutes) ?? 0;
const times = (arg("--times") || cfg.times || "").split(",").map((item) => item.trim()).filter(Boolean);
const open = windowOpen(now, times, tolerance);
const skuColumn = (cfg.sku_column || "sku").toLowerCase();
const qtyColumn = (cfg.qty_column || "qty").toLowerCase();

const sourceBySku = new Map();
for (const row of records(sourcePath)) {
  const key = row[skuColumn] || row.sku || row.source_sku;
  if (key) sourceBySku.set(key, num(row[qtyColumn] || row.qty));
}
const mapBySeller = new Map();
for (const row of records(mapPath)) {
  if (row.seller_sku) mapBySeller.set(`${row.store}|${row.platform}|${row.seller_sku}`, row);
}

const decisions = [];
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

let pushes = 0;
for (const row of decisions) {
  if (row.decision !== "ELIGIBLE") continue;
  if (mode !== "auto") {
    row.decision = "ALERT_ONLY";
    continue;
  }
  if (!apply || !open) {
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
    lines.push(header.map((key) => row[key] || "").join(","));
  }
  writeFileSync(join(outDir, "inventory-audit.csv"), `${lines.join("\n")}\n`);
}

console.log(`mode: ${mode}`);
console.log(`window: ${open ? "open" : "closed"}`);
console.log(`apply: ${apply ? "yes" : "no"}`);
console.log(`buffer: ${buffer}`);
for (const row of decisions) {
  console.log(`sku ${row.sku} store ${row.store} platform ${row.platform} on_hand ${row.on_hand} floor ${row.floor} proposed ${row.proposed} source ${row.source} decision ${row.decision} reason ${row.reason} batch ${row.batch || ""}`);
}
const counts = decisions.reduce((map, row) => {
  map[row.decision] = (map[row.decision] || 0) + 1;
  return map;
}, {});
for (const [key, value] of Object.entries(counts)) console.log(`count_${key}: ${value}`);
console.log("result: OK");
