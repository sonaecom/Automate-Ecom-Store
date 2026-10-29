#!/usr/bin/env node
/**
 * Pick a whole number of seconds inside a range, then wait that long.
 *
 * Usage:
 *   node delay-range.mjs --min 3 --max 8
 *   node delay-range.mjs --min 20 --max 60 --multiplier 2
 *   node delay-range.mjs --min 120 --max 300 --no-sleep
 *
 * --multiplier doubles (or scales) the range after a captcha. Allowed 1–8.
 * --no-sleep prints the choice and returns at once. Tests use this.
 *
 * Exit 0 after the wait. Exit 2 on bad arguments.
 * This script never reads secrets and never contacts the network.
 */

import { setTimeout as sleep } from "node:timers/promises";

function usage() {
  console.error(
    "usage: node delay-range.mjs --min <seconds> --max <seconds> [--multiplier 1] [--no-sleep]",
  );
}

function parseArgs(argv) {
  let min = null;
  let max = null;
  let multiplier = 1;
  let noSleep = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--min") {
      min = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--max") {
      max = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--multiplier") {
      multiplier = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--no-sleep") {
      noSleep = true;
    } else if (arg === "--help" || arg === "-h") {
      return { help: true };
    } else {
      return { error: `unknown argument: ${arg}` };
    }
  }

  if (!Number.isInteger(min) || min < 0) return { error: "--min must be a whole number of seconds >= 0" };
  if (!Number.isInteger(max) || max < min) return { error: "--max must be a whole number >= --min" };
  if (!Number.isInteger(multiplier) || multiplier < 1 || multiplier > 8) {
    return { error: "--multiplier must be a whole number from 1 to 8" };
  }
  return { min, max, multiplier, noSleep };
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
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

const min = parsed.min * parsed.multiplier;
const max = parsed.max * parsed.multiplier;
const seconds = randomInt(min, max);
console.log(`min: ${min}`);
console.log(`max: ${max}`);
console.log(`multiplier: ${parsed.multiplier}`);
console.log(`seconds: ${seconds}`);
console.log("result: OK");

if (!parsed.noSleep && seconds > 0) {
  await sleep(seconds * 1000);
}
