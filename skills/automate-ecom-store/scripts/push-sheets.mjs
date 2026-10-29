#!/usr/bin/env node
/**
 * Store a Google token locally, or say whether one is present.
 * Does not print the token.
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

const arg = process.argv[2];
if (arg === "--status") {
  status();
} else if (arg === "--reset-token") {
  if (existsSync(file)) unlinkSync(file);
  console.log("token: missing");
  console.log("result: RESET");
} else if (arg === "--save-token") {
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
  console.error("usage: node push-sheets.mjs (--status | --save-token | --reset-token)");
  process.exit(2);
}
