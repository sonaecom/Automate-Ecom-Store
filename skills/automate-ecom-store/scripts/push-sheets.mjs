#!/usr/bin/env node
/**
 * Store a Google token locally, or say whether one is present.
 * Does not print the token.
 *
 * Connect Google only for one of these optional cases, after the AdsPower key:
 *   1. The owner wants reports on Google Sheets (this token).
 *   2. The owner already has a real-time inventory file on Google Sheets
 *      (the read-only token in inventory-sync.mjs, not this file).
 * If both answers are no, do not call --save-token. Neither case is required.
 *
 *   node push-sheets.mjs --status
 *   node push-sheets.mjs --save-token < token.json
 *   node push-sheets.mjs --reset-token
 *
 * token.json shape: {"access_token":"...","spreadsheet_id":""}
 * The file is ~/.automate-ecom-store/google-token.json mode 600.
 */

import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const dir = join(homedir(), ".automate-ecom-store");
const file = join(dir, "google-token.json");

function status() {
  if (!existsSync(file)) {
    console.log("token: missing");
    console.log("spreadsheet: missing");
    console.log("result: MISSING");
    process.exit(1);
  }
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  const token = typeof parsed.access_token === "string" && parsed.access_token.trim() !== "";
  const sheet = typeof parsed.spreadsheet_id === "string" && parsed.spreadsheet_id.trim() !== "";
  console.log(`token: ${token ? "set" : "missing"}`);
  console.log(`spreadsheet: ${sheet ? "set" : "missing"}`);
  console.log("mode: 600");
  console.log(token ? "result: OK" : "result: MISSING");
  if (!token) process.exit(1);
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
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

async function pushCsv() {
  const csvPath = arg("--csv");
  const tab = arg("--tab") || "AdsFacts";
  if (!csvPath) {
    console.error("--csv is required");
    process.exit(2);
  }
  if (!existsSync(file)) {
    console.log("token: missing");
    console.log("result: MISSING");
    process.exit(1);
  }
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  const token = typeof parsed.access_token === "string" ? parsed.access_token.trim() : "";
  const spreadsheetId = typeof parsed.spreadsheet_id === "string" ? parsed.spreadsheet_id.trim() : "";
  if (!token || !spreadsheetId) {
    console.log(`token: ${token ? "set" : "missing"}`);
    console.log(`spreadsheet: ${spreadsheetId ? "set" : "missing"}`);
    console.log("result: MISSING");
    process.exit(1);
  }
  const values = parseCsv(readFileSync(csvPath, "utf8"));
  const range = encodeURIComponent(`${tab}!A1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ range: `${tab}!A1`, majorDimension: "ROWS", values }),
  });
  if (!response.ok) {
    console.log(`http_status: ${response.status}`);
    console.log("result: FAILED");
    process.exit(1);
  }
  console.log(`tab: ${tab}`);
  console.log(`rows: ${values.length}`);
  console.log("result: PUSHED");
}

const arg0 = process.argv[2];
if (arg0 === "--status") {
  status();
} else if (arg0 === "--push") {
  await pushCsv();
} else if (arg0 === "--reset-token") {
  if (existsSync(file)) unlinkSync(file);
  console.log("token: missing");
  console.log("result: RESET");
} else if (arg0 === "--save-token") {
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
  if (!access || access.includes("<")) {
    console.error("payload_error: access_token is empty or still a placeholder");
    process.exit(2);
  }
  const spreadsheet = typeof parsed.spreadsheet_id === "string" ? parsed.spreadsheet_id.trim() : "";
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
  writeFileSync(file, `${JSON.stringify({ access_token: access, spreadsheet_id: spreadsheet }, null, 2)}\n`, { mode: 0o600 });
  chmodSync(file, 0o600);
  console.log("token: set");
  console.log(`spreadsheet: ${spreadsheet ? "set" : "missing"}`);
  console.log("mode: 600");
  console.log("result: SAVED");
} else {
  console.error("usage: node push-sheets.mjs (--status | --save-token | --reset-token | --push --csv path [--tab AdsFacts])");
  process.exit(2);
}
