#!/usr/bin/env node
/**
 * Fail when a relative markdown link points at a missing file.
 * External https links are checked for shape only.
 *
 *   node check-md-links.mjs [repo-root]
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const root = process.argv[2] || join(import.meta.dirname, "..", "..", "..");
const skip = new Set([".git", "node_modules", ".next", "data", "screenshots"]);
const misses = [];

function walk(dir, files) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) walk(path, files);
    else if (name.endsWith(".md")) files.push(path);
  }
}

function resolveLink(fromFile, target) {
  const clean = target.split("#")[0].split("?")[0];
  if (!clean) return "";
  if (clean.startsWith("{baseDir}/")) {
    return join(root, "skills", "automate-ecom-store", clean.slice("{baseDir}/".length));
  }
  return normalize(join(dirname(fromFile), clean));
}

const files = [];
walk(root, files);
const linkPattern = /\[[^\]]*\]\(([^)\s]+)\)/g;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(linkPattern)) {
    const target = match[1];
    if (target.startsWith("mailto:")) {
      misses.push(`${file} mailto is not allowed`);
      continue;
    }
    if (target.startsWith("http://") || target.startsWith("https://")) {
      try {
        const url = new URL(target);
        if (url.protocol !== "https:" && url.protocol !== "http:") misses.push(`${file} bad url ${target}`);
      } catch {
        misses.push(`${file} bad url ${target}`);
      }
      continue;
    }
    if (target.startsWith("#")) continue;
    const resolved = resolveLink(file, target);
    if (!resolved || !existsSync(resolved)) misses.push(`${file} -> ${target}`);
  }
}
if (misses.length) {
  for (const miss of misses) console.error(miss);
  console.error("result: FAIL");
  process.exit(1);
}
console.log(`files: ${files.length}`);
console.log("result: OK");
