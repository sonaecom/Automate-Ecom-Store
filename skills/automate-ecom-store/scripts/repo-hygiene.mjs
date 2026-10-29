#!/usr/bin/env node
/**
 * Refuse real store data in the repo. Sample files must say synthetic.
 * Extra banned strings, if any, are read from a denylist outside the repo.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const root = process.argv[2] || join(import.meta.dirname, "..", "..", "..");
const sampleRoots = [
  join(root, "skills", "automate-ecom-store", "templates"),
  join(root, "dashboard", "web", "sample"),
];
const skip = new Set([".git", "node_modules", ".next", "__pycache__"]);
const hits = [];

function walk(dir, files) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) walk(path, files);
    else files.push(path);
  }
}

const samples = [];
for (const dir of sampleRoots) walk(dir, samples);
for (const path of samples) {
  const text = readFileSync(path, "utf8");
  if (!text.toLowerCase().includes("synthetic")) hits.push(`${path} missing synthetic label`);
}

const denyPath = process.env.AUTOMATE_DENYLIST || join(homedir(), ".automate-ecom-store", "denylist.txt");
const denied = [];
if (existsSync(denyPath)) {
  for (const line of readFileSync(denyPath, "utf8").split(/\n/)) {
    const word = line.trim();
    if (word && !word.startsWith("#")) denied.push(word);
  }
}
if (denied.length) {
  const files = [];
  walk(root, files);
  for (const path of files) {
    if (path.endsWith(".png") || path.endsWith(".jpg")) continue;
    let text = "";
    try {
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    for (const word of denied) {
      if (text.includes(word)) hits.push(`${path} denylist`);
    }
  }
}

console.log(`samples: ${samples.length}`);
console.log(`denylist: ${existsSync(denyPath) ? "loaded" : "absent"}`);
if (hits.length) {
  for (const hit of hits) console.error(hit);
  console.error("result: FAIL");
  process.exit(1);
}
console.log("result: OK");
