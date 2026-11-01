#!/usr/bin/env node
/**
 * Preflight before a test round or a work batch: is the browser runner
 * (AdsPower or MKTLogin local API) reachable? Exit 0 when it answers,
 * 3 when it is down, 2 when its config is missing. Prints no keys or hosts.
 *
 * usage: node scripts/runner-check.mjs [--runner adspower|mktlogin] [--timeout-ms 5000]
 */

import { pathToFileURL } from "node:url";
import { checkRunner } from "../core/browser/runners.mjs";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

export function exitCode(result) {
  if (result.ok) return 0;
  return result.reason === "RUNNER_UNAVAILABLE" ? 3 : 2;
}

async function main() {
  const result = await checkRunner(arg("--runner") || "adspower", process.env, { timeoutMs: Number(arg("--timeout-ms")) || 5000 });
  console.log(`runner: ${result.runner}`);
  console.log(`result: ${result.reason}`);
  process.exit(exitCode(result));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
