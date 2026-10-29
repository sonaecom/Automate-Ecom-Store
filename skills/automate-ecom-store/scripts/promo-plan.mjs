#!/usr/bin/env node
/**
 * Plan a voucher or promotion. Does not open a browser.
 * Nothing is saved until the owner has approved that row.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { appendJournal, readJournal } from "../core/journal/action-key.mjs";
import { beginRun } from "../core/runner.mjs";
import { clipWork } from "../core/targets.mjs";

const MANIFEST = JSON.parse(readFileSync(new URL("../core/manifest/promotion.manifest.json", import.meta.url), "utf8"));
const TOKEN = /<[A-Za-z0-9_]+>/;
const PLATFORMS = new Set(["shopee", "tiktokshop", "lazada"]);

function parseCsv(text) {
  const source = String(text || "").replace(/^\uFEFF/, "").replace(/^(?:#[^\n]*\n)+/, "").trim();
  if (!source) return [];
  const lines = source.split(/\n/).filter(Boolean);
  const header = lines[0].split(",").map((cell) => cell.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const record = {};
    header.forEach((key, index) => {
      record[key] = (cells[index] || "").trim();
    });
    return record;
  });
}

export function planPromos(rows, options) {
  const clip = clipWork(rows.length, options.target, Math.max(rows.length, 1));
  let used = 0;
  return rows.map((row) => {
    const name = row.name || "";
    const blob = `${name} ${row.start || ""} ${row.end || ""} ${row.discount || ""} ${row.items || ""} ${row.budget || ""}`;
    if (!name || !row.start || !row.end || !row.discount || !row.items || TOKEN.test(blob)) {
      return { name, decision: "REJECT" };
    }
    if (row.budget && row.budget.toLowerCase() !== "none") return { name, decision: "HOLD_MONEY" };
    if (!options.approved) return { name, decision: "HOLD_APPROVAL" };
    if (used >= clip.allowed) return { name, decision: "OVER_CAP" };
    used += 1;
    return { name, decision: "APPLY" };
  });
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function main() {
  const store = arg("--store");
  const day = arg("--day");
  const journalPath = arg("--journal");
  const file = arg("--promos");
  const outDir = arg("--out-dir");
  const platform = (arg("--platform") || "").toLowerCase();
  const mode = arg("--mode") || "read_only";
  if (!store || !day || !journalPath || !file || !outDir || !PLATFORMS.has(platform)) {
    console.error("usage: node promo-plan.mjs --promos file --platform shopee|tiktokshop|lazada --out-dir DIR --store <STORE> --day YYYY-MM-DD --journal file [--approved yes]");
    process.exit(2);
  }
  const decision = beginRun({
    store: { id: store, mode },
    manifest: MANIFEST,
    action: "submit",
    target: `${platform}|${day}`,
    day,
    journalRows: readJournal(journalPath),
    policyResult: arg("--policy") || "ALLOW",
  });
  console.log("classification: write");
  console.log(`runner: ${decision.result}`);
  if (decision.result !== "RUN") {
    console.log(`result: ${decision.result}`);
    process.exit(1);
  }
  const planned = planPromos(parseCsv(readFileSync(file, "utf8")), {
    target: arg("--target"),
    approved: arg("--approved") === "yes",
  });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "promo-plan.csv"), `name,decision\n${planned.map((row) => `${row.name},${row.decision}`).join("\n")}\n`);
  console.log(`apply_count: ${planned.filter((row) => row.decision === "APPLY").length}`);
  console.log("result: PLAN");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
