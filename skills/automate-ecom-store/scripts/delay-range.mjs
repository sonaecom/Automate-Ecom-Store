#!/usr/bin/env node
/**
 * Human pace for every module. Click gaps are uneven and at least a human
 * minimum. Clicks are direct. A red dot is optional. Page loads and batch
 * rests stay longer. --no-sleep is for tests.
 *
 *   node delay-range.mjs --profile normal --kind click --no-sleep
 *   node delay-range.mjs --profile fast --kind type --text "hello" --no-sleep
 *   node delay-range.mjs --kind batch-rest --multiplier 2 --no-sleep
 *   node delay-range.mjs --min 3 --max 8 --no-sleep
 */

import { setTimeout as sleep } from "node:timers/promises";
import { batchRestMs, clickGap, mulberry32, pageGap, redDotExpression, typePlan } from "../core/pace.mjs";

function usage() {
  console.error("usage: node delay-range.mjs [--profile safe|normal|fast] [--kind click|type|page-load|batch-rest] [--red-dot on|off] [--text words] [--x n --y n] [--multiplier 1] [--seed n] [--no-sleep]");
  console.error("   or: node delay-range.mjs --min <seconds> --max <seconds> [--multiplier 1] [--no-sleep]");
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

const noSleep = process.argv.includes("--no-sleep");
const help = process.argv.includes("--help") || process.argv.includes("-h");
if (help) {
  usage();
  process.exit(0);
}

const multiplierRaw = arg("--multiplier");
const multiplier = multiplierRaw === "" ? 1 : Number(multiplierRaw);
if (!Number.isInteger(multiplier) || multiplier < 1 || multiplier > 8) {
  console.error("--multiplier must be a whole number from 1 to 8");
  usage();
  process.exit(2);
}

const seedRaw = arg("--seed");
const random = seedRaw === "" ? Math.random : mulberry32(Number(seedRaw));
const profile = (arg("--profile") || "normal").toLowerCase();
if (!["safe", "normal", "fast"].includes(profile)) {
  console.error("--profile must be safe, normal, or fast");
  process.exit(2);
}
const redDot = (arg("--red-dot") || "off").toLowerCase();
if (redDot !== "on" && redDot !== "off") {
  console.error("--red-dot must be on or off");
  process.exit(2);
}

const legacyMin = arg("--min");
const legacyMax = arg("--max");
let kind = (arg("--kind") || "").toLowerCase();
if (!kind && legacyMin !== "") kind = "legacy";
if (!kind) kind = "click";

let waitMs = 0;
console.log(`profile: ${profile}`);
console.log(`kind: ${kind}`);
console.log(`multiplier: ${multiplier}`);
console.log("click: direct");
console.log("mouse_steps: 0");
console.log(`red_dot: ${redDot}`);
console.log("rhythm: uneven");

if (kind === "legacy") {
  const min = Number(legacyMin);
  const max = Number(legacyMax);
  if (!Number.isInteger(min) || min < 0 || !Number.isInteger(max) || max < min) {
    console.error("--min and --max must be whole seconds, max >= min");
    usage();
    process.exit(2);
  }
  const seconds = (min * multiplier) + Math.floor(random() * ((max - min) * multiplier + 1));
  waitMs = seconds * 1000;
  console.log(`seconds: ${seconds}`);
} else if (kind === "batch-rest") {
  waitMs = batchRestMs(random, multiplier);
  console.log(`gap_ms: ${waitMs}`);
} else if (kind === "page-load") {
  waitMs = pageGap(profile, random, multiplier);
  console.log(`gap_ms: ${waitMs}`);
  console.log("page_load: wait_for_load_then_settle");
} else if (kind === "type") {
  const text = arg("--text") || "a";
  const plan = typePlan(profile, text, random, multiplier);
  waitMs = plan.total;
  console.log(`chars: ${plan.perChar.length}`);
  console.log(`per_char_ms: ${plan.perChar.join(",")}`);
  console.log(`gap_ms: ${waitMs}`);
} else if (kind === "click") {
  waitMs = clickGap(profile, random, null, multiplier);
  console.log(`gap_ms: ${waitMs}`);
  if (redDot === "on") {
    const expression = redDotExpression(arg("--x"), arg("--y"));
    console.log("marker: red-dot");
    console.log("marker_ms: 180");
    if (expression) console.log(`marker_script: ${expression}`);
    else console.log("marker_script: needs --x and --y");
  }
} else {
  console.error(`unknown kind: ${kind}`);
  usage();
  process.exit(2);
}

console.log("result: OK");
if (!noSleep && waitMs > 0) await sleep(waitMs);
