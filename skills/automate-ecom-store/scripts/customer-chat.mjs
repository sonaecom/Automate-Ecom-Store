#!/usr/bin/env node
/**
 * Plan approved customer-chat replies for Shopee, TikTok Shop, or Lazada.
 * Does not open a browser. A refund or off-platform request is not answered.
 *
 *   node customer-chat.mjs --threads file --platform shopee --out-dir DIR --store <STORE> --day YYYY-MM-DD --mode full --journal file
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { appendJournal, readJournal } from "../core/journal/action-key.mjs";
import { beginRun } from "../core/runner.mjs";
import { CEILINGS, clipWork } from "../core/targets.mjs";
import { loadRules, rulesFor, textHits } from "./policy-rules.mjs";

const MANIFEST = JSON.parse(readFileSync(new URL("../core/manifest/customer-chat.manifest.json", import.meta.url), "utf8"));
const TOKEN = /<[A-Za-z0-9_]+>/;
const REFUND = /\b(refund|money back|partial refund)\b/i;
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

export function planChats(rows, options) {
  const max = Number.isInteger(options.maxLength) ? options.maxLength : 200;
  const ceiling = Math.min(CEILINGS.chatRepliesPerDay, max > 0 ? CEILINGS.chatRepliesPerDay : 0);
  const clip = clipWork(rows.length, options.target, ceiling);
  let sent = 0;
  return rows.map((row) => {
    const thread = row.thread || "";
    const text = row.text || "";
    const buyer = row.buyer_message || "";
    const blob = `${text}\n${buyer}`;
    if (!thread || !text || TOKEN.test(blob) || text.length > max) {
      return { thread, decision: "REJECT" };
    }
    const hits = textHits(blob, options.rules || []);
    if (hits.some((hit) => hit.status === "block") || REFUND.test(blob)) {
      return { thread, decision: "BLOCK" };
    }
    if (sent >= clip.allowed) return { thread, decision: "OVER_CAP" };
    sent += 1;
    return { thread, decision: "SEND" };
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
  const threads = arg("--threads");
  const outDir = arg("--out-dir");
  const platform = (arg("--platform") || "").toLowerCase();
  const market = arg("--market") || "PH";
  const mode = arg("--mode") || "read_only";
  if (!store || !day || !journalPath || !threads || !outDir || !PLATFORMS.has(platform)) {
    console.error("usage: node customer-chat.mjs --threads file --platform shopee|tiktokshop|lazada --out-dir DIR --store <STORE> --day YYYY-MM-DD --journal file [--market PH] [--target n] [--max 200]");
    process.exit(2);
  }
  const max = arg("--max") === "" ? 200 : Number(arg("--max"));
  if (!Number.isInteger(max) || max < 1 || max > 200) {
    console.error("--max must be a whole number from 1 to 200");
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
  console.log(`module: ${MANIFEST.id}`);
  console.log(`platform: ${platform}`);
  console.log(`runner: ${decision.result}`);
  if (decision.result !== "RUN") {
    console.log(`result: ${decision.result}`);
    process.exit(1);
  }
  const planned = planChats(parseCsv(readFileSync(threads, "utf8")), {
    target: arg("--target"),
    maxLength: max,
    rules: rulesFor(loadRules(), platform, market),
  });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "chat-plan.csv"), `thread,decision\n${planned.map((row) => `${row.thread},${row.decision}`).join("\n")}\n`);
  console.log(`ceiling: ${CEILINGS.chatRepliesPerDay}`);
  console.log(`target: ${arg("--target") || "unset"}`);
  console.log(`send_count: ${planned.filter((row) => row.decision === "SEND").length}`);
  console.log("cap_is: ceiling");
  appendJournal(journalPath, { actionKey: decision.actionKey, status: "pending", module: MANIFEST.id });
  for (const row of planned) console.log(`${row.decision} ${row.thread}`);
  console.log("result: PLAN");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
