#!/usr/bin/env node
/**
 * Fail if the repository contains a host, a known local API port, a private
 * key, or a token. Placeholders such as <API_KEY> are allowed.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] || join(import.meta.dirname, "..", "..", "..");
const skip = new Set([".git", "node_modules", "__pycache__", "data", "screenshots", ".next"]);
const patterns = [
  [/127\.0\.0\.1/, "loopback"],
  [/\b50325\b/, "local_api_port"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private_key"],
  [/\bghp_[A-Za-z0-9]{20,}/, "github_token"],
  [/\bsk-[A-Za-z0-9]{20,}/, "api_token"],
  [/\bAKIA[0-9A-Z]{16}\b/, "aws_key"],
];

function walk(dir, hits) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) {
      walk(path, hits);
      continue;
    }
    if (info.size > 1_000_000) continue;
    if (name.endsWith(".png") || name.endsWith(".jpg")) continue;
    let text = "";
    try {
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const [pattern, label] of patterns) {
        if (pattern.test(line)) hits.push(`${path}:${index + 1} ${label}`);
      }
    });
  }
}

const hits = [];
walk(root, hits);
if (hits.length) {
  for (const hit of hits) console.error(hit);
  console.error("result: FAIL");
  process.exit(1);
}
console.log("result: OK");
