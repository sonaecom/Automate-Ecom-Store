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
 *   node inventory-sync.mjs --platform-stock file --source file --map file --now HH:MM --mode live [--apply] [--push-asap] [--last-pushed file]
 *
 * Live sheet reads use a read-only Google token. The script does not print it.
 * Near-realtime: poll every 5 to 15 minutes, then push at human pace.
 *
 * --save-readonly-token is only for onboarding case 2: the owner already has
 * a real-time inventory tracking file on Google Sheets. Case 1 (Sheets reports)
 * uses push-sheets.mjs. If both answers are no, do not save this token.
 */

import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const METADATA_SCOPE = "https://www.googleapis.com/auth/drive.metadata.readonly";

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
  const source = text.replace(/^\uFEFF/, "").replace(/^(?:#[^\n]*\n)+/, "");
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
  console.error("   or: node inventory-sync.mjs --platform-stock file --source file --map file --now HH:MM --mode live [--apply] [--push-asap] [--last-pushed file] [--state file] [--commit] [--readback file]");
  console.error("   or: node inventory-sync.mjs (--save-readonly-token | --readonly-status | --reset-readonly-token)");
  console.error("readonly token: only when the owner already has a real-time inventory file on Google Sheets");
  process.exit(2);
}

function readonlyTokenPath() {
  return join(homedir(), ".automate-ecom-store", "google-sheets-readonly.json");
}

function scopeList(value) {
  return String(value || "").split(/\s+/).map((item) => item.trim()).filter(Boolean);
}

function scopeAllowed(scopes) {
  if (!scopes.includes(READONLY_SCOPE)) return false;
  return scopes.every((item) => item === READONLY_SCOPE || item === METADATA_SCOPE);
}

function saveReadonlyToken() {
  if (process.stdin.isTTY) {
    console.error("stdin JSON required");
    process.exit(2);
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(0, "utf8"));
  } catch (error) {
    console.error(`payload_error: ${error.message}`);
    process.exit(2);
  }
  const access = typeof parsed.access_token === "string" ? parsed.access_token.trim() : "";
  const spreadsheet = typeof parsed.spreadsheet_id === "string" ? parsed.spreadsheet_id.trim() : "";
  const scopes = scopeList(parsed.scope);
  if (!access || access.includes("<") || spreadsheet.includes("<")) {
    console.error("payload_error: token or spreadsheet id is empty or still a placeholder");
    process.exit(2);
  }
  if (!scopeAllowed(scopes)) {
    console.log("scope: rejected");
    console.log("result: FAILED");
    process.exit(1);
  }
  const dir = join(homedir(), ".automate-ecom-store");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
  const file = readonlyTokenPath();
  writeFileSync(file, `${JSON.stringify({ access_token: access, spreadsheet_id: spreadsheet, scope: scopes.join(" ") }, null, 2)}\n`, { mode: 0o600 });
  chmodSync(file, 0o600);
  console.log("token: set");
  console.log(`spreadsheet: ${spreadsheet ? "set" : "missing"}`);
  console.log("scope: spreadsheets.readonly");
  console.log("mode: 600");
  console.log("result: SAVED");
}

function readonlyStatus() {
  const file = readonlyTokenPath();
  if (!existsSync(file)) {
    console.log("token: missing");
    console.log("spreadsheet: missing");
    console.log("result: MISSING");
    process.exit(1);
  }
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  const token = typeof parsed.access_token === "string" && parsed.access_token.trim() !== "";
  const sheet = typeof parsed.spreadsheet_id === "string" && parsed.spreadsheet_id.trim() !== "" && !parsed.spreadsheet_id.includes("<");
  const scopes = scopeList(parsed.scope);
  console.log(`token: ${token ? "set" : "missing"}`);
  console.log(`spreadsheet: ${sheet ? "set" : "missing"}`);
  console.log(`scope: ${scopeAllowed(scopes) ? "spreadsheets.readonly" : "rejected"}`);
  console.log(token && scopeAllowed(scopes) ? "result: OK" : "result: MISSING");
  if (!token || !scopeAllowed(scopes)) process.exit(1);
}

function clampPoll(value) {
  if (value < 5) return { minutes: 5, clamped: true };
  if (value > 15) return { minutes: 15, clamped: true };
  return { minutes: value, clamped: false };
}

function sheetHash(rows, skuKey, qtyKey) {
  const lines = rows.map((row) => {
    const sku = row[skuKey] || row.sku || row.source_sku || "";
    const qty = row[qtyKey] || row.qty || "";
    return `${row.store || ""}|${row.platform || ""}|${sku}|${qty}`;
  }).sort();
  return createHash("sha256").update(lines.join("\n")).digest("hex");
}

function readState(path) {
  if (!path || !existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

function valuesToRecords(values) {
  if (!values.length) return [];
  const header = values[0].map((cell) => String(cell || "").trim().toLowerCase());
  return values.slice(1).filter((cells) => cells.some((cell) => String(cell || "").trim() !== "")).map((cells) => {
    const record = {};
    header.forEach((key, index) => {
      record[key] = String(cells[index] || "").trim();
    });
    return record;
  });
}

async function fetchSheet(tokenFile, tab) {
  const parsed = JSON.parse(readFileSync(tokenFile, "utf8"));
  const token = typeof parsed.access_token === "string" ? parsed.access_token.trim() : "";
  const spreadsheetId = typeof parsed.spreadsheet_id === "string" ? parsed.spreadsheet_id.trim() : "";
  const scopes = scopeList(parsed.scope);
  if (!token || !scopeAllowed(scopes)) {
    console.log("scope: rejected");
    console.log("result: FAILED");
    process.exit(1);
  }
  if (!spreadsheetId || spreadsheetId.includes("<")) {
    console.log("spreadsheet: missing");
    console.log("result: MISSING");
    process.exit(1);
  }
  let modified = "";
  if (scopes.includes(METADATA_SCOPE)) {
    const meta = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(spreadsheetId)}?fields=modifiedTime`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (meta.ok) {
      const body = await meta.json();
      modified = typeof body.modifiedTime === "string" ? body.modifiedTime : "";
    }
  }
  const range = encodeURIComponent(`${tab}!A:Z`);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    console.log(`http_status: ${response.status}`);
    console.log("result: FAILED");
    process.exit(1);
  }
  const body = await response.json();
  return { rows: valuesToRecords(body.values || []), modified };
}

if (process.argv.includes("--save-readonly-token")) {
  saveReadonlyToken();
  process.exit(0);
}
if (process.argv.includes("--readonly-status")) {
  readonlyStatus();
  process.exit(0);
}
if (process.argv.includes("--reset-readonly-token")) {
  const file = readonlyTokenPath();
  if (existsSync(file)) unlinkSync(file);
  console.log("token: missing");
  console.log("result: RESET");
  process.exit(0);
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
const manual = mode === "manual";
const live = mode === "live";
if (mode !== "auto" && mode !== "manual" && mode !== "live") usage();
if (!platformPath) usage();
if (manual && setArgs.length === 0 && !setsPath) usage();
if (mode === "auto" && (!sourcePath || !mapPath || !now)) usage();
if (live && (!mapPath || !now)) usage();

const apply = process.argv.includes("--apply");
const confirm = process.argv.includes("--confirm");
const buffer = num(arg("--buffer") || cfg.buffer) ?? 0;
const skipPercent = num(arg("--skip-change-percent") || cfg.skip_change_percent);
const batchSize = num(arg("--batch-size") || cfg.batch_size) ?? 10;
const sessionMax = num(arg("--session-max") || cfg.session_max) ?? 10;
const tolerance = num(arg("--tolerance-minutes") || cfg.tolerance_minutes) ?? 0;
const times = (arg("--times") || cfg.times || "").split(",").map((item) => item.trim()).filter(Boolean);
const poll = clampPoll(num(arg("--poll-minutes") || cfg.poll_minutes) ?? 10);
const pushAsap = live && (process.argv.includes("--push-asap") || cfg.push_asap === "yes" || cfg.push_asap === "true");
const open = manual ? false : pushAsap ? true : windowOpen(now, times, tolerance);
const minutesSince = num(arg("--minutes-since"));
if (live && minutesSince !== null && minutesSince < poll.minutes) {
  console.log("mode: live");
  console.log(`poll_minutes: ${poll.minutes}`);
  console.log(`poll_clamped: ${poll.clamped ? "yes" : "no"}`);
  console.log(`minutes_since: ${minutesSince}`);
  console.log("realtime: near");
  console.log("pace_seconds: 20-60");
  console.log("result: WAIT");
  process.exit(0);
}
const skuColumn = (cfg.sku_column || "sku").toLowerCase();
const qtyColumn = (cfg.qty_column || "qty").toLowerCase();
const manualSku = (cfg.manual_sku_column || "sku").toLowerCase();
const manualQty = (cfg.manual_qty_column || "qty").toLowerCase();
const manualStore = (cfg.manual_store_column || "store").toLowerCase();
const manualPlatform = (cfg.manual_platform_column || "platform").toLowerCase();

const liveTab = cfg.live_tab || cfg.tab || "Stock";
const liveSku = (cfg.live_sku_column || skuColumn).toLowerCase();
const liveQty = (cfg.live_qty_column || qtyColumn).toLowerCase();
let liveRows = null;
let modified = arg("--modified");
if (live && !sourcePath) {
  const tokenFile = readonlyTokenPath();
  if (!existsSync(tokenFile)) {
    console.log("token: missing");
    console.log("result: MISSING");
    process.exit(1);
  }
  const loaded = await fetchSheet(tokenFile, liveTab);
  liveRows = loaded.rows;
  if (!modified) modified = loaded.modified;
}
if (live && !sourcePath && !liveRows) usage();

const sourceRows = live ? (liveRows || records(sourcePath)) : null;
const statePath = arg("--state");
const state = live ? readState(statePath) : null;
const currentHash = live ? sheetHash(sourceRows, liveSku, liveQty) : "";
if (live && state && state.row_hash === currentHash) {
  console.log("mode: live");
  console.log("sheet: unchanged");
  console.log(`poll_minutes: ${poll.minutes}`);
  console.log(`poll_clamped: ${poll.clamped ? "yes" : "no"}`);
  console.log(`push_asap: ${pushAsap ? "yes" : "no"}`);
  console.log("realtime: near");
  console.log("pace_seconds: 20-60");
  console.log("result: OK");
  process.exit(0);
}

const lastPushed = new Map();
if (live && arg("--last-pushed")) {
  for (const row of records(arg("--last-pushed"))) {
    if (row.sku) lastPushed.set(`${row.store}|${row.platform}|${row.sku}`, num(row.pushed_qty || row.qty));
  }
}

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
  const loadedRows = live ? sourceRows : records(sourcePath);
  const keyName = live ? liveSku : skuColumn;
  const qtyName = live ? liveQty : qtyColumn;
  for (const row of loadedRows) {
    const key = row[keyName] || row.sku || row.source_sku;
    if (key) sourceBySku.set(key, num(row[qtyName] || row.qty));
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
    if (live) base.source = base.source || "sheet";
    const pushedQty = live ? lastPushed.get(key) : undefined;
    if (live && pushedQty !== undefined && pushedQty !== null && pushedQty === proposed) {
      decisions.push({ ...base, decision: "UNCHANGED", reason: floored ? "floored,already_pushed" : "already_pushed" });
      continue;
    }
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
console.log(`window: ${manual ? "n/a" : pushAsap ? "asap" : open ? "open" : "closed"}`);
console.log(`apply: ${apply ? "yes" : "no"}`);
console.log(`confirm: ${confirm ? "yes" : "no"}`);
console.log(`buffer: ${manual ? "off" : buffer}`);
if (live) {
  console.log("sheet: changed");
  console.log(`poll_minutes: ${poll.minutes}`);
  console.log(`poll_clamped: ${poll.clamped ? "yes" : "no"}`);
  console.log(`push_asap: ${pushAsap ? "yes" : "no"}`);
  console.log("realtime: near");
  console.log("pace_seconds: 20-60");
}
for (const row of decisions) {
  console.log(`sku ${row.sku} store ${row.store} platform ${row.platform} on_hand ${row.on_hand} floor ${row.floor} proposed ${row.proposed} source ${row.source} decision ${row.decision} reason ${row.reason} batch ${row.batch || ""}`);
}
const readback = new Map();
if (readbackPath) {
  for (const row of records(readbackPath)) {
    readback.set(`${row.store}|${row.platform}|${row.sku}`, num(row.on_hand));
  }
  for (const row of decisions) {
    const seen = readback.get(`${row.store}|${row.platform}|${row.sku}`);
    const proposed = num(row.proposed);
    let status = "MISMATCH";
    if (seen === undefined || seen === null) status = "MISSING";
    else if (proposed !== null && seen === proposed) status = "MATCH";
    row.readback = status;
    console.log(`readback sku ${row.sku} store ${row.store} platform ${row.platform} proposed ${row.proposed} on_hand ${seen === undefined || seen === null ? "" : seen} ${status}`);
  }
}
const counts = decisions.reduce((map, row) => {
  map[row.decision] = (map[row.decision] || 0) + 1;
  return map;
}, {});
for (const [key, value] of Object.entries(counts)) console.log(`count_${key}: ${value}`);
const commit = live && process.argv.includes("--commit");
if (commit) {
  const pushed = decisions.filter((row) => row.decision === "PUSH");
  const waiting = decisions.some((row) => row.decision === "PREVIEW" || row.decision === "DEFER");
  const unmatched = pushed.some((row) => row.readback !== "MATCH");
  if (waiting || unmatched || (pushed.length > 0 && !readbackPath)) {
    console.log("result: HOLD");
    process.exit(1);
  }
  if (statePath) {
    mkdirSync(dirname(statePath), { recursive: true });
    writeFileSync(statePath, `${JSON.stringify({ modified_time: modified || "", row_hash: currentHash }, null, 2)}\n`, { mode: 0o600 });
  }
  if (outDir) {
    const next = new Map(lastPushed);
    for (const row of pushed) next.set(`${row.store}|${row.platform}|${row.sku}`, num(row.proposed));
    const header = ["sku", "store", "platform", "pushed_qty"];
    const lines = [header.join(",")];
    for (const [key, qty] of next) {
      const [store, platform, sku] = key.split("|");
      lines.push([csvCell(sku), csvCell(store), csvCell(platform), qty].join(","));
    }
    writeFileSync(join(outDir, "last-pushed.csv"), `${lines.join("\n")}\n`);
  }
  console.log("committed: yes");
}
console.log("result: OK");
