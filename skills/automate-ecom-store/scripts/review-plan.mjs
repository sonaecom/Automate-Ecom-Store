#!/usr/bin/env node
/** Plan a public review reply. A star ask or a reward is not sent. */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { appendJournal, readJournal } from "../core/journal/action-key.mjs";
import { beginRun } from "../core/runner.mjs";
import { loadRules, rulesFor, textHits } from "./policy-rules.mjs";

const MANIFEST = JSON.parse(readFileSync(new URL("../core/manifest/review-reply.manifest.json", import.meta.url), "utf8"));
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
    header.forEach((key, index) => { record[key] = (cells[index] || "").trim(); });
    return record;
  });
}

export function planReviews(rows, rules) {
  return rows.map((row) => {
    const id = row.review_id || "";
    const text = row.text || "";
    if (!id || !text || TOKEN.test(text)) return { review_id: id, decision: "REJECT" };
    if (textHits(text, rules).some((hit) => hit.status === "block")) return { review_id: id, decision: "BLOCK" };
    return { review_id: id, decision: "REPLY" };
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
  const file = arg("--reviews");
  const platform = (arg("--platform") || "").toLowerCase();
  const market = arg("--market") || "PH";
  const mode = arg("--mode") || "read_only";
  if (!store || !day || !journalPath || !file || !PLATFORMS.has(platform)) {
    console.error("usage: node review-plan.mjs --reviews file --platform shopee|tiktokshop|lazada --store <STORE> --day YYYY-MM-DD --journal file");
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
  for (const row of planReviews(parseCsv(readFileSync(file, "utf8")), rulesFor(loadRules(), platform, market))) {
    console.log(`${row.decision} ${row.review_id}`);
  }
  appendJournal(journalPath, { actionKey: decision.actionKey, status: "pending", module: MANIFEST.id });
  console.log("result: PLAN");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
