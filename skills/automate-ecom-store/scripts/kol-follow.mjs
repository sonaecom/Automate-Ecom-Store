#!/usr/bin/env node
/** Label invited creators keep, remind, or review. Does not send a new invite. */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { appendJournal, readJournal } from "../core/journal/action-key.mjs";
import { beginRun } from "../core/runner.mjs";
import { ownerNumber } from "../core/targets.mjs";

const MANIFEST = JSON.parse(readFileSync(new URL("../core/manifest/kol-follow.manifest.json", import.meta.url), "utf8"));

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

export function planFollow(rows, options) {
  const threshold = ownerNumber(options.threshold);
  return rows.map((row) => {
    const handle = row.handle || "";
    if (!handle) return { handle, decision: "REJECT" };
    const posted = String(row.video_posted || "").toLowerCase() === "yes";
    const gmv = ownerNumber(row.gmv);
    if (threshold === null) return { handle, decision: "REVIEW" };
    if (posted && gmv !== null && gmv >= threshold) return { handle, decision: "KEEP" };
    if (!posted) return { handle, decision: "REMIND" };
    return { handle, decision: "REVIEW" };
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
  const file = arg("--creators");
  const mode = arg("--mode") || "read_only";
  if (!store || !day || !journalPath || !file) {
    console.error("usage: node kol-follow.mjs --creators file --store <STORE> --day YYYY-MM-DD --journal file [--threshold n]");
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
  const planned = planFollow(parseCsv(readFileSync(file, "utf8")), { threshold: arg("--threshold") });
  for (const row of planned) console.log(`${row.decision} ${row.handle}`);
  appendJournal(journalPath, { actionKey: decision.actionKey, status: "pending", module: MANIFEST.id });
  console.log("result: PLAN");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
