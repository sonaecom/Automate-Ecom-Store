#!/usr/bin/env node
/**
 * Decide whether a module may run for a platform and market.
 * Example policy files are ignored. This script does not contact a seller site.
 *
 *   node policy-gate.mjs --platform shopee --market SG --action read
 *   node policy-gate.mjs --platform shopee --market SG --action publish
 *
 * Exit 0: ALLOW, or POLICY_PENDING / STALE on a read-only action.
 * Exit 1: POLICY_PENDING or STALE on a mutating action.
 * Exit 2: usage error.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MUTATING = new Set([
  "publish",
  "price",
  "budget",
  "refund",
  "register",
  "delete",
  "stock_write",
  "submit",
]);

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "policy");

function usage() {
  console.error("usage: node policy-gate.mjs --platform name --market CODE --action name");
}

function parseArgs(argv) {
  const out = { platform: "", market: "", action: "read" };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--platform") out.platform = argv[++i] || "";
    else if (argv[i] === "--market") out.market = argv[++i] || "";
    else if (argv[i] === "--action") out.action = (argv[++i] || "read").toLowerCase();
    else if (argv[i] === "--help") return { help: true };
    else return { error: `unknown argument: ${argv[i]}` };
  }
  if (!out.platform || !out.market) return { error: "--platform and --market are required" };
  return out;
}

function field(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, "m"));
  return match ? match[1].trim() : "";
}

function policyPath(platform, market) {
  const dir = join(root, platform);
  if (!existsSync(dir)) return "";
  const target = `${market}.yaml`;
  const found = readdirSync(dir).find((name) => name === target && !name.includes("example"));
  return found ? join(dir, found) : "";
}

function ageDays(retrieved) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(retrieved);
  if (!match) return null;
  const then = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - then) / 86400000);
}

const parsed = parseArgs(process.argv.slice(2));
if (parsed.help) {
  usage();
  process.exit(0);
}
if (parsed.error) {
  console.error(parsed.error);
  usage();
  process.exit(2);
}

const file = policyPath(parsed.platform, parsed.market);
const mutating = MUTATING.has(parsed.action);
console.log(`platform: ${parsed.platform}`);
console.log(`market: ${parsed.market}`);
console.log(`action: ${parsed.action}`);
console.log(`mutating: ${mutating ? "yes" : "no"}`);

if (!file) {
  console.log("result: POLICY_PENDING");
  process.exit(mutating ? 1 : 0);
}

const text = readFileSync(file, "utf8");
const retrieved = field(text, "retrieved");
const source = field(text, "source_url");
const days = ageDays(retrieved);
console.log(`retrieved: ${retrieved || "missing"}`);
console.log(`source: ${source ? "set" : "missing"}`);

if (!retrieved || retrieved.includes("<") || days === null || !source || source.includes("<")) {
  console.log("result: POLICY_PENDING");
  process.exit(mutating ? 1 : 0);
}
if (days > 7) {
  console.log(`age_days: ${days}`);
  console.log("result: STALE");
  process.exit(mutating ? 1 : 0);
}
console.log(`age_days: ${days}`);
console.log("result: ALLOW");
