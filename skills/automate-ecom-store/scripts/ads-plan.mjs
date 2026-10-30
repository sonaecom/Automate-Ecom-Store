#!/usr/bin/env node
/**
 * Plan ads setting changes and a saved-card top-up. Does not open a browser
 * and does not add a card. 10% of GMV is not a default target.
 *
 *   node ads-plan.mjs --count 2 --out-dir DIR --store <STORE> --day YYYY-MM-DD --mode full --journal file
 *   node ads-plan.mjs --topup --saved-card yes --approved yes --out-dir DIR --store <STORE> --day YYYY-MM-DD --mode full --journal file
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { appendJournal, readJournal } from "../core/journal/action-key.mjs";
import { beginRun } from "../core/runner.mjs";
import { CEILINGS, clipWork } from "../core/targets.mjs";

const MANIFEST = JSON.parse(readFileSync(new URL("../core/manifest/ads-change.manifest.json", import.meta.url), "utf8"));

export function topupDecision({ approved, standing, savedCard, addCard }) {
  if (addCard) return "BLOCK_ADD_CARD";
  if (!savedCard) return "BLOCK_NO_SAVED_CARD";
  if (!approved && !standing) return "HOLD_APPROVAL";
  return "ALLOW_SAVED_CARD";
}

export function adsRoom(count, hourlyDone, target) {
  const done = Number.isInteger(hourlyDone) && hourlyDone > 0 ? hourlyDone : 0;
  const remaining = Math.max(0, CEILINGS.adsChangesPerHour - done);
  return clipWork(count, target, remaining);
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function yes(name) {
  return arg(name) === "yes";
}

function main() {
  const store = arg("--store");
  const day = arg("--day");
  const journalPath = arg("--journal");
  const outDir = arg("--out-dir");
  const mode = arg("--mode") || "read_only";
  if (!store || !day || !journalPath || !outDir) {
    console.error("usage: node ads-plan.mjs --out-dir DIR --store <STORE> --day YYYY-MM-DD --journal file [--count n | --topup --saved-card yes (--approved yes | --standing yes)]");
    process.exit(2);
  }
  const topup = process.argv.includes("--topup");
  const decisionFlags = topup ? topupDecision({
    approved: yes("--approved"),
    standing: yes("--standing"),
    savedCard: yes("--saved-card"),
    addCard: yes("--add-card"),
  }) : "";
  if (topup && decisionFlags !== "ALLOW_SAVED_CARD") {
    console.log("classification: write");
    console.log(`topup: ${decisionFlags}`);
    console.log("bill: no");
    console.log(`result: ${decisionFlags}`);
    process.exit(1);
  }
  const run = beginRun({
    store: { id: store, mode },
    manifest: MANIFEST,
    action: topup ? "topup" : "publish",
    target: day,
    day,
    journalRows: readJournal(journalPath),
    policyResult: arg("--policy") || "ALLOW",
    intent: topup ? { savedCard: true, addCard: false, approved: yes("--approved"), standing: yes("--standing") } : {},
  });
  console.log("classification: write");
  console.log(`module: ${MANIFEST.id}`);
  console.log(`runner: ${run.result}`);
  if (run.result !== "RUN") {
    console.log(`result: ${run.result}`);
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });
  if (topup) {
    writeFileSync(join(outDir, "ads-bill.csv"), "store,day,card,action,bill\n" + `${store},${day},saved-last4,topup,send\n`);
    console.log("topup: ALLOW_SAVED_CARD");
    console.log("add_card: no");
    console.log("bill: send");
    appendJournal(journalPath, { actionKey: run.actionKey, status: "pending", module: MANIFEST.id });
    console.log("result: PLAN");
    return;
  }
  const count = Number(arg("--count") || 0);
  if (!Number.isInteger(count) || count < 0) {
    console.error("--count must be a whole number");
    process.exit(2);
  }
  const hourlyDone = arg("--hourly-done") === "" ? 0 : Number(arg("--hourly-done"));
  const room = adsRoom(count, hourlyDone, arg("--target"));
  writeFileSync(join(outDir, "ads-plan.csv"), `allowed,held,ceiling,target\n${room.allowed},${room.held},${room.ceiling},${room.target}\n`);
  console.log(`ceiling: ${CEILINGS.adsChangesPerHour}`);
  console.log(`target: ${room.target}`);
  console.log(`allowed: ${room.allowed}`);
  console.log("cap_is: ceiling");
  console.log("example_ads_percent: not_a_target");
  appendJournal(journalPath, { actionKey: run.actionKey, status: "pending", module: MANIFEST.id });
  console.log("result: PLAN");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
