#!/usr/bin/env node
/**
 * Plan stock and price edits. Does not open a browser.
 * A price cut stays a proposal unless the owner approved it under the percent.
 *
 *   node stock-price.mjs --changes file --platform shopee --out-dir DIR --store <STORE> --day YYYY-MM-DD --mode full --journal file
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { appendJournal, readJournal } from "../core/journal/action-key.mjs";
import { beginRun } from "../core/runner.mjs";
import { listingRoom } from "./listing-edit.mjs";

const MANIFEST = JSON.parse(readFileSync(new URL("../core/manifest/stock-price.manifest.json", import.meta.url), "utf8"));
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

function number(value) {
  if (value === undefined || value === "" || TOKEN.test(String(value))) return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function planStockPrice(rows, options) {
  const room = listingRoom(rows.length, options.hourlyDone || 0, options.target);
  let used = 0;
  return rows.map((row) => {
    const sku = row.sku || "";
    const field = (row.field || "").toLowerCase();
    const next = row.new_value || "";
    const current = row.current_value || "";
    if (!sku || !row.variation || TOKEN.test(`${sku} ${field} ${next} ${current} ${row.variation}`)) {
      return { sku, field, decision: "REJECT" };
    }
    if (field === "delete" || next.toLowerCase() === "delete") return { sku, field, decision: "HOLD_DELETE" };
    let decision = "APPLY";
    if (field === "price") {
      const from = number(current);
      const to = number(next);
      if (from === null || to === null) decision = "HOLD_PRICE";
      else if (to < from && (!options.priceApproved || options.priceDropPercent === null || ((from - to) / from) * 100 >= options.priceDropPercent)) decision = "HOLD_PRICE";
    } else if (field === "stock") {
      const qty = number(next);
      if (qty === null || qty < 0 || !Number.isInteger(qty)) decision = "REJECT";
    } else decision = "REJECT";
    if (decision !== "APPLY") return { sku, field, decision };
    if (used >= room.allowed) return { sku, field, decision: "OVER_CAP" };
    used += 1;
    return { sku, field, decision: "APPLY" };
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
  const changes = arg("--changes");
  const outDir = arg("--out-dir");
  const platform = (arg("--platform") || "").toLowerCase();
  const mode = arg("--mode") || "read_only";
  if (!store || !day || !journalPath || !changes || !outDir || !PLATFORMS.has(platform)) {
    console.error("usage: node stock-price.mjs --changes file --platform shopee|tiktokshop|lazada --out-dir DIR --store <STORE> --day YYYY-MM-DD --journal file");
    process.exit(2);
  }
  const decision = beginRun({
    store: { id: store, mode },
    manifest: MANIFEST,
    action: "stock_write",
    target: `${platform}|${day}`,
    day,
    journalRows: readJournal(journalPath),
    policyResult: arg("--policy") || "ALLOW",
  });
  console.log("classification: write");
  console.log(`module: ${MANIFEST.id}`);
  console.log(`platform: ${platform}`);
  console.log(`runner: ${decision.result}`);
  if (decision.result !== "RUN") {
    console.log(`result: ${decision.result}`);
    process.exit(1);
  }
  const dropRaw = arg("--price-drop-percent");
  const planned = planStockPrice(parseCsv(readFileSync(changes, "utf8")), {
    hourlyDone: arg("--hourly-done") === "" ? 0 : Number(arg("--hourly-done")),
    target: arg("--target"),
    priceApproved: arg("--price-approved") === "yes",
    priceDropPercent: dropRaw === "" || TOKEN.test(dropRaw) ? null : Number(dropRaw),
  });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "stock-plan.csv"), `sku,field,decision\n${planned.map((row) => `${row.sku},${row.field},${row.decision}`).join("\n")}\n`);
  console.log(`apply_count: ${planned.filter((row) => row.decision === "APPLY").length}`);
  console.log("cap_is: ceiling");
  appendJournal(journalPath, { actionKey: decision.actionKey, status: "pending", module: MANIFEST.id });
  for (const row of planned) console.log(`${row.decision} ${row.sku} ${row.field}`);
  console.log("result: PLAN");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
