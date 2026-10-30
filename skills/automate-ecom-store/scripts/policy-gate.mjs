#!/usr/bin/env node
/**
 * Decide whether a module may run for a platform and market.
 * Example policy files are ignored. This script does not contact a seller site.
 *
 *   node policy-gate.mjs --platform shopee --market SG --action read
 *   node policy-gate.mjs --platform shopee --market SG --action publish
 *   node policy-gate.mjs --platform shopee --market SG --action submit --text "file"
 *
 * Exit 0: ALLOW, or POLICY_PENDING / STALE on a read-only action with no block.
 * Exit 1: POLICY_PENDING or STALE on a mutating action, or VIOLATION.
 * Exit 2: usage error.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { discountRules, healthThresholds, loadRules, rulesFor, textHits } from "./policy-rules.mjs";

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

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(skillRoot, "policy");
const policiesRoot = join(skillRoot, "policies");

function usage() {
  console.error("usage: node policy-gate.mjs --platform name --market CODE --action name [--text words | --file path]");
}

function parseArgs(argv) {
  const out = { platform: "", market: "", action: "read", text: "" };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--platform") out.platform = argv[++i] || "";
    else if (argv[i] === "--market") out.market = argv[++i] || "";
    else if (argv[i] === "--action") out.action = (argv[++i] || "read").toLowerCase();
    else if (argv[i] === "--text") out.text = argv[++i] || "";
    else if (argv[i] === "--file") out.text = readFileSync(argv[++i] || "", "utf8");
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
  const markdown = join(policiesRoot, platform, `${market}.md`);
  if (existsSync(markdown)) return markdown;
  const dir = join(root, platform);
  if (!existsSync(dir)) return "";
  const target = `${market}.yaml`;
  const found = readdirSync(dir).find((name) => name === target && !name.includes("example"));
  return found ? join(dir, found) : "";
}

function parseRules(markdown) {
  return markdown.split("\n### ").slice(1).map((chunk) => {
    const lines = chunk.split("\n");
    const rule = { id: lines[0].trim(), status: "flag", verify: "yes", source: "", match: "" };
    for (const line of lines.slice(1)) {
      const fieldMatch = line.match(/^- (status|verify|source|match):\s*(.*)$/);
      if (fieldMatch) rule[fieldMatch[1]] = fieldMatch[2].trim();
    }
    return rule;
  });
}

function scanText(text, rules, yamlRules) {
  const hits = textHits(text, yamlRules);
  for (const rule of rules) {
    if (!rule.match) continue;
    const needles = rule.match.split(";").map((item) => item.trim()).filter(Boolean);
    if (needles.some((needle) => text.toLowerCase().includes(needle.toLowerCase()))) hits.push(rule);
  }
  const seen = new Map();
  for (const hit of hits) {
    const previous = seen.get(hit.id);
    if (!previous || (previous.status !== "block" && hit.status === "block")) seen.set(hit.id, hit);
  }
  return [...seen.values()];
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

const text = file ? readFileSync(file, "utf8") : "";
const rules = text ? parseRules(text) : [];
const yamlRules = rulesFor(loadRules(), parsed.platform, parsed.market);
console.log(`rules_loaded: ${yamlRules.length}`);
for (const rule of yamlRules) {
  console.log(`policy_rule ${rule.id} action=${rule.action || ""} category=${rule.category || ""}`);
}
for (const row of healthThresholds(yamlRules)) {
  console.log(`health_threshold metric=${row.metric} max=${row.max} direction=${row.direction} rule=${row.id} action=${row.action} unverified=${row.unverified ? "yes" : "no"}`);
}
for (const row of discountRules(yamlRules)) {
  console.log(`discount_rule ${row.id} action=${row.action} lead_days=${row.lead_days || ""} unverified=${row.unverified ? "yes" : "no"}`);
}
const hits = parsed.text ? scanText(parsed.text, rules, yamlRules) : [];
for (const hit of hits) {
  console.log(`${hit.status === "block" ? "VIOLATION" : "FLAG"} ${hit.id} verify=${hit.verify || "yes"} source=${hit.source || "policy"}`);
}
if (hits.some((hit) => hit.status === "block")) {
  console.log("result: VIOLATION");
  process.exit(1);
}

if (!file) {
  console.log("result: POLICY_PENDING");
  process.exit(mutating ? 1 : 0);
}
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
if (hits.some((hit) => hit.status !== "block") && mutating) {
  console.log("result: FLAG");
  process.exit(1);
}
console.log("result: ALLOW");
