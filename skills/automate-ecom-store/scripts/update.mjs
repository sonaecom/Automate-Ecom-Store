#!/usr/bin/env node
/**
 * Update the skill with git pull and leave local config where it is.
 *
 *   node update.mjs
 *   node update.mjs --check
 *
 * Preserves ~/.automate-ecom-store/config.yaml, stores.yaml, and google-token.json.
 * Does not print those files.
 */

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function hashFile(path) {
  if (!existsSync(path)) return "absent";
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function gitRoot(start) {
  let dir = start;
  while (dir !== "/") {
    if (existsSync(join(dir, ".git"))) return dir;
    dir = join(dir, "..");
  }
  return "";
}

function versionOf(skillDir) {
  const file = join(skillDir, "VERSION");
  return existsSync(file) ? readFileSync(file, "utf8").trim() : "";
}

const skillDir = join(import.meta.dirname, "..");
const root = gitRoot(skillDir);
const protectedFiles = [
  join(homedir(), ".automate-ecom-store", "config.yaml"),
  join(homedir(), ".automate-ecom-store", "stores.yaml"),
  join(homedir(), ".automate-ecom-store", "google-token.json"),
];
const before = Object.fromEntries(protectedFiles.map((file) => [file, hashFile(file)]));
const versionBefore = versionOf(skillDir);
console.log(`version_before: ${versionBefore || "missing"}`);

if (!process.argv.includes("--check")) {
  if (!root) {
    console.error("git_root: missing");
    console.log("config: preserved");
    process.exit(1);
  }
  const pull = spawnSync("git", ["pull", "--ff-only"], { cwd: root, encoding: "utf8" });
  if (pull.status !== 0) {
    console.error("git_pull: failed");
    console.log("config: preserved");
    process.exit(1);
  }
  console.log("git_pull: ok");
} else {
  console.log("git_pull: skipped");
}

const after = Object.fromEntries(protectedFiles.map((file) => [file, hashFile(file)]));
const changed = protectedFiles.filter((file) => before[file] !== after[file]);
console.log(`version_after: ${versionOf(skillDir) || "missing"}`);
if (changed.length) {
  console.error("config: changed");
  process.exit(1);
}
console.log("config: preserved");
console.log("result: OK");
