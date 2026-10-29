#!/usr/bin/env node
/**
 * Read official pages listed in policy/sources.yaml, hash them, and alert
 * when a hash changes. Does not open a seller account and does not change
 * prices, budgets, listings, or programs.
 *
 *   node policy-update.mjs --dry-run
 *   node policy-update.mjs
 *   node policy-update.mjs --fixture-dir <DIR>
 *
 * Cache and changelog stay under ~/.automate-ecom-store/.
 */

import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sourcesPath = join(dirname(fileURLToPath(import.meta.url)), "..", "policy", "sources.yaml");

function parseSources(text) {
  const items = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const start = line.match(/^\s*-\s+id:\s*(\S+)\s*$/);
    if (start) {
      if (current) items.push(current);
      current = { id: start[1] };
      continue;
    }
    if (!current) continue;
    const field = line.match(/^\s+(platform|market|topic|url|retrieved):\s*(.*?)\s*$/);
    if (field) current[field[1]] = field[2].replace(/^["']|["']$/g, "");
  }
  if (current) items.push(current);
  return items.filter((item) => item.id);
}

function localStamp() {
  const date = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function usable(url) {
  return typeof url === "string" && url.startsWith("https://") && !url.includes("<");
}

async function bodyFor(source, fixtureDir) {
  if (fixtureDir) {
    const path = join(fixtureDir, `${source.id}.txt`);
    if (!existsSync(path)) return { error: "missing_fixture" };
    return { text: readFileSync(path, "utf8") };
  }
  try {
    const response = await fetch(source.url, { redirect: "follow" });
    if (!response.ok) return { error: `http_${response.status}` };
    return { text: await response.text() };
  } catch (error) {
    return { error: error.message };
  }
}

const dryRun = process.argv.includes("--dry-run");
const fixtureFlag = process.argv.indexOf("--fixture-dir");
const fixtureDir = fixtureFlag >= 0 ? process.argv[fixtureFlag + 1] : "";
if (fixtureFlag >= 0 && !fixtureDir) {
  console.error("--fixture-dir needs a path");
  process.exit(2);
}

const sources = parseSources(readFileSync(sourcesPath, "utf8"));
const cacheDir = join(homedir(), ".automate-ecom-store", "policy-cache");
const changelog = join(homedir(), ".automate-ecom-store", "policy-changelog.md");
let alerts = 0;

for (const source of sources) {
  if (!usable(source.url)) {
    console.log(`SKIP ${source.id} url_placeholder`);
    continue;
  }
  if (dryRun) {
    console.log(`PLAN ${source.id} ${source.platform} ${source.market}`);
    continue;
  }
  const loaded = await bodyFor(source, fixtureDir);
  if (loaded.error) {
    console.log(`ALERT fetch_failed id=${source.id}`);
    alerts += 1;
    continue;
  }
  const hash = createHash("sha256").update(loaded.text).digest("hex");
  mkdirSync(cacheDir, { recursive: true, mode: 0o700 });
  const cachePath = join(cacheDir, `${source.id}.sha256`);
  const previous = existsSync(cachePath) ? readFileSync(cachePath, "utf8").trim() : "";
  if (previous && previous !== hash) {
    const line = `- ${localStamp()} id=${source.id} platform=${source.platform} market=${source.market} change=hash was ${previous.slice(0, 8)} now ${hash.slice(0, 8)}. Alert the owner. Do not change seller settings.\n`;
    mkdirSync(dirname(changelog), { recursive: true, mode: 0o700 });
    appendFileSync(changelog, line, { mode: 0o600 });
    console.log(`ALERT policy_changed id=${source.id}`);
    alerts += 1;
  } else if (!previous) {
    console.log(`NEW ${source.id}`);
  } else {
    console.log(`UNCHANGED ${source.id}`);
  }
  writeFileSync(cachePath, `${hash}\n`, { mode: 0o600 });
}

console.log(`alerts: ${alerts}`);
console.log(dryRun ? "result: DRY_RUN" : "result: OK");
