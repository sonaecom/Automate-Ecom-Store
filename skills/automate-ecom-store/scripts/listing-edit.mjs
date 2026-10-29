#!/usr/bin/env node
/**
 * Plan Shopee listing edits. Does not open a browser and does not save a listing.
 *
 *   node listing-edit.mjs --changes file --out-dir DIR --store <STORE> --day YYYY-MM-DD --journal file
 *   node listing-edit.mjs --done --store <STORE> --day YYYY-MM-DD --journal file
 *
 * A price change stays HOLD_PRICE until --price-approved yes.
 * A price cut at or above --price-drop-percent, or any cut when that percent is omitted, stays HOLD_PRICE.
 * The session limit is a ceiling. Fewer rows do not get padded up to it.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { appendJournal, readJournal } from "../core/journal/action-key.mjs";
import { beginRun } from "../core/runner.mjs";

const MANIFEST = JSON.parse(readFileSync(new URL("../core/manifest/shopee-listing-update.manifest.json", import.meta.url), "utf8"));
const TOKEN = /<[A-Za-z0-9_]+>/;

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = String(text || "").replace(/^\uFEFF/, "").replace(/^(?:#[^\n]*\n)+/, "");
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

export function records(text) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  return rows.slice(1).map((cells) => {
    const record = {};
    header.forEach((key, index) => {
      record[key] = (cells[index] || "").trim();
    });
    return record;
  });
}

function number(value) {
  if (value === undefined || value === "" || TOKEN.test(String(value))) return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function priceDecision(current, next, approved, dropPercent) {
  if (!approved) return "HOLD_PRICE";
  const from = number(current);
  const to = number(next);
  if (from === null || to === null) return "HOLD_PRICE";
  if (to >= from) return "APPLY";
  if (dropPercent === null) return "HOLD_PRICE";
  const drop = ((from - to) / from) * 100;
  if (drop >= dropPercent) return "HOLD_PRICE";
  return "APPLY";
}

export function planListing(rows, savedLabels, options = {}) {
  const limit = Number.isInteger(options.sessionLimit) ? options.sessionLimit : 10;
  const saved = savedLabels instanceof Set ? savedLabels : new Set(savedLabels || []);
  const seen = new Set();
  let room = limit;
  return rows.map((row) => {
    const label = (row.item_label || "").trim();
    const field = (row.field || "").trim().toLowerCase();
    const next = (row.new_value || "").trim();
    const current = (row.current_value || "").trim();
    const base = { item_label: label, field, new_value: next, current_value: current, match: "" };
    const blob = `${label} ${field} ${next} ${current}`;
    if (!label || !field || !next || TOKEN.test(blob)) return { ...base, decision: "REJECT" };
    if (field === "delete" || field === "remove" || next.toLowerCase() === "delete") {
      return { ...base, decision: "HOLD_DELETE" };
    }
    const key = label.toLowerCase();
    if (saved.has(key) || seen.has(key)) return { ...base, decision: "SKIP" };
    seen.add(key);
    let decision = "APPLY";
    if (field === "price") decision = priceDecision(current, next, options.priceApproved === true, options.priceDropPercent ?? null);
    if (decision !== "APPLY") return { ...base, decision };
    if (room <= 0) return { ...base, decision: "OVER_CAP" };
    room -= 1;
    const match = field === "variation" ? "variation_name" : "item_label";
    return { ...base, decision: "APPLY", match };
  });
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function main() {
  const store = arg("--store");
  const day = arg("--day");
  const journalPath = arg("--journal");
  const mode = arg("--mode") || "read_only";
  if (!store || !day || !journalPath) {
    console.error("usage: node listing-edit.mjs --changes file --out-dir DIR --store <STORE> --day YYYY-MM-DD --journal file [--log file] [--mode read_only|full] [--policy ALLOW] [--session-limit 10] [--price-approved yes] [--price-drop-percent n]");
    process.exit(2);
  }
  if (mode !== "read_only" && mode !== "full") {
    console.error("--mode must be read_only or full");
    process.exit(2);
  }
  const decision = beginRun({
    store: { id: store, mode: process.argv.includes("--done") ? "full" : mode },
    manifest: MANIFEST,
    action: "publish",
    target: day,
    day,
    journalRows: process.argv.includes("--done") ? [] : readJournal(journalPath),
    policyResult: process.argv.includes("--done") ? "ALLOW" : (arg("--policy") || "ALLOW"),
  });
  if (process.argv.includes("--done")) {
    if (!decision.actionKey) {
      console.log("result: MANIFEST");
      process.exit(1);
    }
    appendJournal(journalPath, { actionKey: decision.actionKey, status: "done", module: MANIFEST.id });
    console.log(`action_key: ${decision.actionKey}`);
    console.log("classification: write");
    console.log("result: DONE");
    return;
  }
  console.log("classification: write");
  console.log(`module: ${MANIFEST.id}`);
  if (decision.actionKey) console.log(`action_key: ${decision.actionKey}`);
  if (decision.detail) console.log(`detail: ${decision.detail}`);
  if (decision.result !== "RUN") {
    console.log(`result: ${decision.result}`);
    process.exit(1);
  }
  const changesPath = arg("--changes");
  const outDir = arg("--out-dir");
  if (!changesPath || !outDir) {
    console.error("--changes and --out-dir are required");
    process.exit(2);
  }
  const limitRaw = arg("--session-limit");
  const sessionLimit = limitRaw === "" ? 10 : Number(limitRaw);
  if (!Number.isInteger(sessionLimit) || sessionLimit < 1) {
    console.error("--session-limit must be a whole number of at least 1");
    process.exit(2);
  }
  const dropRaw = arg("--price-drop-percent");
  const priceDropPercent = dropRaw === "" || TOKEN.test(dropRaw) ? null : Number(dropRaw);
  if (priceDropPercent !== null && (!Number.isFinite(priceDropPercent) || priceDropPercent < 0)) {
    console.error("--price-drop-percent must be a number, or omit it");
    process.exit(2);
  }
  const logPath = arg("--log");
  const saved = new Set();
  if (logPath) {
    for (const row of records(readFileSync(logPath, "utf8"))) {
      if (row.item_label) saved.add(row.item_label.toLowerCase());
    }
  }
  const planned = planListing(records(readFileSync(changesPath, "utf8")), saved, {
    sessionLimit,
    priceApproved: arg("--price-approved") === "yes",
    priceDropPercent,
  });
  mkdirSync(outDir, { recursive: true });
  const header = ["item_label", "field", "new_value", "current_value", "decision", "match"];
  const lines = [header.join(",")];
  for (const row of planned) lines.push(header.map((key) => csvCell(row[key] ?? "")).join(","));
  writeFileSync(join(outDir, "listing-plan.csv"), `${lines.join("\n")}\n`);
  const counts = {};
  for (const row of planned) counts[row.decision] = (counts[row.decision] || 0) + 1;
  for (const row of planned) console.log(`${row.decision} ${row.item_label} ${row.field}`);
  console.log(`ceiling: ${sessionLimit}`);
  console.log(`apply_count: ${counts.APPLY || 0}`);
  console.log(`hold_price: ${counts.HOLD_PRICE || 0}`);
  console.log(`hold_delete: ${counts.HOLD_DELETE || 0}`);
  console.log(`skip: ${counts.SKIP || 0}`);
  console.log(`over_cap: ${counts.OVER_CAP || 0}`);
  console.log(`reject: ${counts.REJECT || 0}`);
  console.log("cap_is: ceiling");
  if (counts.REJECT) {
    console.log("result: REJECT");
    process.exit(1);
  }
  appendJournal(journalPath, { actionKey: decision.actionKey, status: "pending", module: MANIFEST.id });
  console.log("result: PLAN");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
