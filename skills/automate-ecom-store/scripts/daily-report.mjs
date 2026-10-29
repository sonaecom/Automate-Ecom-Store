#!/usr/bin/env node
/** Compare two in-store daily figures. Does not change the store. */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { readJournal } from "../core/journal/action-key.mjs";
import { beginRun } from "../core/runner.mjs";

const MANIFEST = JSON.parse(readFileSync(new URL("../core/manifest/daily-report.manifest.json", import.meta.url), "utf8"));
const METRICS = ["orders", "gmv", "ads"];

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

function num(value) {
  if (value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function reconcileDaily(rowsA, rowsB) {
  const other = new Map(rowsB.map((row) => [`${row.date}|${row.store}|${row.platform}`, row]));
  return rowsA.map((row) => {
    const pair = other.get(`${row.date}|${row.store}|${row.platform}`);
    if (!pair) return { ...row, qc: "QC_FAIL", detail: "missing_b" };
    const parts = [];
    for (const metric of METRICS) {
      const left = num(row[metric]);
      const right = num(pair[metric]);
      if (left === null && right === null) continue;
      if (left === null || right === null || Math.abs(left - right) > 0.001) parts.push(`${metric} a=${row[metric] || ""} b=${pair[metric] || ""}`);
    }
    return { ...row, qc: parts.length ? "QC_FAIL" : "OK", detail: parts.join("; ") };
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
  const mode = arg("--mode") || "read_only";
  if (!store || !day || !journalPath || !arg("--a") || !arg("--b")) {
    console.error("usage: node daily-report.mjs --a file --b file --store <STORE> --day YYYY-MM-DD --journal file");
    process.exit(2);
  }
  const decision = beginRun({
    store: { id: store, mode },
    manifest: MANIFEST,
    action: "read",
    target: day,
    day,
    journalRows: readJournal(journalPath),
    policyResult: arg("--policy") || "ALLOW",
  });
  console.log("classification: read");
  console.log(`runner: ${decision.result}`);
  if (decision.result !== "RUN") {
    console.log(`result: ${decision.result}`);
    process.exit(1);
  }
  const rows = reconcileDaily(parseCsv(readFileSync(arg("--a"), "utf8")), parseCsv(readFileSync(arg("--b"), "utf8")));
  for (const row of rows) console.log(`${row.qc} ${row.date} ${row.detail || ""}`.trim());
  console.log("result: REPORT");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
