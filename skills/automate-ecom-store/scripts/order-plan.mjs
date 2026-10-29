#!/usr/bin/env node
/** Plan which orders may be marked shipped. A row without a pickup time stays held. */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { appendJournal, readJournal } from "../core/journal/action-key.mjs";
import { beginRun } from "../core/runner.mjs";

const MANIFEST = JSON.parse(readFileSync(new URL("../core/manifest/order-handling.manifest.json", import.meta.url), "utf8"));

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

export function planOrders(rows) {
  return rows.map((row) => {
    const id = row.order_id || "";
    if (!id || !row.variation) return { order_id: id, decision: "REJECT" };
    if (!row.pickup_time) return { order_id: id, decision: "HOLD" };
    return { order_id: id, decision: "SHIP" };
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
  const file = arg("--orders");
  const mode = arg("--mode") || "read_only";
  if (!store || !day || !journalPath || !file) {
    console.error("usage: node order-plan.mjs --orders file --store <STORE> --day YYYY-MM-DD --journal file");
    process.exit(2);
  }
  const decision = beginRun({
    store: { id: store, mode },
    manifest: MANIFEST,
    action: "submit",
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
  for (const row of planOrders(parseCsv(readFileSync(file, "utf8")))) console.log(`${row.decision} ${row.order_id}`);
  appendJournal(journalPath, { actionKey: decision.actionKey, status: "pending", module: MANIFEST.id });
  console.log("result: PLAN");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
