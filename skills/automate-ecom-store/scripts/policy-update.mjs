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

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcesPath = join(skillRoot, "policies", "sources.yaml");

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

function visibleLines(text) {
  const clean = text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = [];
  for (let i = 0; i < clean.length && parts.length < 400; i += 140) parts.push(clean.slice(i, i + 140));
  return parts;
}

function changeSummary(before, after) {
  const oldLines = new Set(before);
  const added = after.filter((line) => !oldLines.has(line)).slice(0, 4);
  if (!added.length) return "page hash changed. Visible lines could not be isolated. verify: yes";
  return `page hash changed. New visible text starts: ${added[0]}`;
}

function impactedModules(platform, market) {
  const path = join(skillRoot, "policies", platform, `${market}.md`);
  if (!existsSync(path)) return "unknown";
  const names = new Set();
  for (const line of readFileSync(path, "utf8").split(/\n/)) {
    const match = line.match(/^- modules:\s*(.+)$/);
    if (match) match[1].split(",").forEach((item) => names.add(item.trim()));
  }
  return [...names].filter(Boolean).join(", ") || "unknown";
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
  const lines = visibleLines(loaded.text);
  mkdirSync(cacheDir, { recursive: true, mode: 0o700 });
  const cachePath = join(cacheDir, `${source.id}.sha256`);
  const snapshotPath = join(cacheDir, `${source.id}.txt`);
  const previous = existsSync(cachePath) ? readFileSync(cachePath, "utf8").trim() : "";
  const previousLines = existsSync(snapshotPath) ? readFileSync(snapshotPath, "utf8").split("\n") : [];
  if (previous && previous !== hash) {
    const summary = changeSummary(previousLines, lines);
    const modules = impactedModules(source.platform, source.market);
    const line = `- ${localStamp()} | source: ${source.url} | what changed: ${summary} | impacted modules: ${modules} | verify: yes | Do not change seller settings.\n`;
    mkdirSync(dirname(changelog), { recursive: true, mode: 0o700 });
    appendFileSync(changelog, line, { mode: 0o600 });
    const marketFile = join(skillRoot, "policies", source.platform, `${source.market}.md`);
    if (existsSync(marketFile) && !process.argv.includes("--no-apply-changelog")) {
      appendFileSync(marketFile, line);
    }
    console.log(`ALERT policy_changed id=${source.id}`);
    alerts += 1;
  } else if (!previous) {
    console.log(`NEW ${source.id}`);
  } else {
    console.log(`UNCHANGED ${source.id}`);
  }
  writeFileSync(cachePath, `${hash}\n`, { mode: 0o600 });
  writeFileSync(snapshotPath, `${lines.join("\n")}\n`, { mode: 0o600 });
}

console.log(`alerts: ${alerts}`);
console.log(dryRun ? "result: DRY_RUN" : "result: OK");
