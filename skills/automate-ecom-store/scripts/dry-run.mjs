#!/usr/bin/env node
/**
 * Block seller mutations while dry_run is on.
 * Screenshots and reads stay allowed.
 *
 *   node dry-run.mjs --status
 *   node dry-run.mjs --action submit
 *   node dry-run.mjs --action screenshot --config path
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BLOCKED = new Set([
  "save",
  "submit",
  "send",
  "publish",
  "update",
  "register",
  "pay",
  "topup",
  "withdraw",
  "delete",
  "budget",
  "refund",
  "stock_write",
  "price",
]);

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function configPath() {
  return arg("--config") || join(homedir(), ".automate-ecom-store", "config.yaml");
}

function dryRun() {
  const file = configPath();
  if (!existsSync(file)) return null;
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  return parsed.dry_run === true;
}

const statusOnly = process.argv.includes("--status");
const enabled = dryRun();
if (enabled === null) {
  console.log("config: missing");
  console.log("dry_run: false");
  console.log("result: MISSING");
  process.exit(statusOnly ? 1 : 1);
}
console.log(`dry_run: ${enabled ? "true" : "false"}`);
if (statusOnly) {
  console.log("result: OK");
  process.exit(0);
}
const action = (arg("--action") || "read").toLowerCase();
if (!enabled || !BLOCKED.has(action)) {
  console.log("result: ALLOWED");
  process.exit(0);
}
console.log(`blocked_action: ${action}`);
console.log("result: BLOCKED");
process.exit(1);
