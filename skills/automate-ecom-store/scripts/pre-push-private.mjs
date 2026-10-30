#!/usr/bin/env node
/**
 * Fail the push when a tracked file names an internal test store.
 * The pattern is assembled so this file is not itself a match.
 */

import { spawnSync } from "node:child_process";

const pattern = [
  ["xb", "ox"].join(""),
  ["tropical", " ?", "munch"].join(""),
  ["\\b", "AZ", "A", "\\b"].join(""),
].join("|");

const result = spawnSync("git", ["grep", "-i", "-E", pattern], {
  encoding: "utf8",
});

if (result.status === 1) {
  console.log("tracked_private_names: 0");
  console.log("result: OK");
  process.exit(0);
}

if (result.status === 0) {
  process.stderr.write(result.stdout || "");
  console.error("result: FAIL");
  process.exit(1);
}

process.stderr.write(result.stderr || "git grep failed\n");
process.exit(result.status ?? 2);
