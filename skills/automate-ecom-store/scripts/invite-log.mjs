#!/usr/bin/env node
/**
 * Per-shop affiliate invite log. Checks duplicates. Does not open a seller site.
 *
 *   node invite-log.mjs --csv path --list
 *   node invite-log.mjs --csv path --handle <HANDLE>
 *   node invite-log.mjs --csv path --append --handle <HANDLE> --campaign <NAME> --time YYYY-MM-DDTHH:MM:SS --terms <TERMS>
 *
 * A missing file is an empty log. SKIP means the handle is already there.
 * --append refuses SKIP and leaves the file unchanged.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const HEADER = ["handle", "campaign_name", "invited_time", "terms"];

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
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

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function load(path) {
  if (!existsSync(path)) return [];
  const rows = parseCsv(readFileSync(path, "utf8"));
  if (!rows.length) return [];
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  if (header.join(",") !== HEADER.join(",")) {
    console.error(`header_error: expected ${HEADER.join(",")}`);
    process.exit(2);
  }
  return rows.slice(1).map((cells) => {
    const record = {};
    header.forEach((key, index) => {
      record[key] = (cells[index] || "").trim();
    });
    return record;
  });
}

function known(rows, handle) {
  const key = handle.trim().toLowerCase();
  return rows.some((row) => row.handle.toLowerCase() === key);
}

function validTime(value) {
  return /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2})?$/.test(value) && !Number.isNaN(Date.parse(value.length === 10 ? `${value}T00:00:00` : value));
}

const csv = arg("--csv");
const handle = arg("--handle");
const list = process.argv.includes("--list");
const append = process.argv.includes("--append");
if (!csv || (!list && !handle)) {
  console.error("usage: node invite-log.mjs --csv path (--list | --handle <HANDLE> [--append --campaign <NAME> --time <TIME> --terms <TERMS>])");
  process.exit(2);
}

const rows = load(csv);
if (list && !handle) {
  for (const row of rows) console.log(row.handle);
  console.log(`count: ${rows.length}`);
  console.log("result: OK");
  process.exit(0);
}
if (!handle.trim()) {
  console.error("handle is empty");
  process.exit(2);
}

const seen = known(rows, handle);
if (!append) {
  console.log(seen ? "result: SKIP" : "result: NEW");
  process.exit(0);
}
if (seen) {
  console.log("result: SKIP");
  process.exit(1);
}
const campaign = arg("--campaign");
const time = arg("--time");
const terms = arg("--terms");
if (!campaign.trim() || !terms.trim() || !validTime(time)) {
  console.error("append needs --campaign, --time YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS, and --terms");
  process.exit(2);
}
const next = rows.concat([{ handle: handle.trim(), campaign_name: campaign.trim(), invited_time: time, terms: terms.trim() }]);
mkdirSync(dirname(csv), { recursive: true });
const lines = [HEADER.join(",")];
for (const row of next) lines.push(HEADER.map((key) => csvEscape(row[key])).join(","));
writeFileSync(csv, `${lines.join("\n")}\n`);
console.log("result: APPENDED");
