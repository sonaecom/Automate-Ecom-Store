#!/usr/bin/env node
/** Plan shop homepage slots. A size marked verify is not uploaded. */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { appendJournal, readJournal } from "../core/journal/action-key.mjs";
import { beginRun } from "../core/runner.mjs";

const MANIFEST = JSON.parse(readFileSync(new URL("../core/manifest/shop-decoration.manifest.json", import.meta.url), "utf8"));
const TOKEN = /<[A-Za-z0-9_]+>/;

function parseCsv(text) {
  const source = String(text || "").replace(/^\uFEFF/, "").replace(/^(?:#[^\n]*\n)+/, "").trim();
  if (!source) return [];
  const lines = source.split(/\n/).filter(Boolean);
  const header = lines[0].split(",").map((cell) => cell.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const record = {};
    header.forEach((key, index) => { record[key] = (cells[index] || "").trim(); });
    return record;
  });
}

export function planShop(rows, options) {
  return rows.map((row) => {
    const slot = row.slot || "";
    if (!slot || TOKEN.test(`${slot} ${row.size || ""}`)) return { slot, decision: "REJECT" };
    if (!row.size || row.size.toLowerCase() === "verify") return { slot, decision: "HOLD_VERIFY" };
    if (!options.approved) return { slot, decision: "HOLD_APPROVAL" };
    return { slot, decision: "APPLY" };
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
  const file = arg("--slots");
  const mode = arg("--mode") || "read_only";
  if (!store || !day || !journalPath || !file) {
    console.error("usage: node shop-plan.mjs --slots file --store <STORE> --day YYYY-MM-DD --journal file [--approved yes]");
    process.exit(2);
  }
  const decision = beginRun({
    store: { id: store, mode },
    manifest: MANIFEST,
    action: "publish",
    target: day,
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
  const planned = planShop(parseCsv(readFileSync(file, "utf8")), { approved: arg("--approved") === "yes" });
  for (const row of planned) console.log(`${row.decision} ${row.slot}`);
  appendJournal(journalPath, { actionKey: decision.actionKey, status: "pending", module: MANIFEST.id });
  console.log("result: PLAN");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
