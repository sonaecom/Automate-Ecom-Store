#!/usr/bin/env node
/**
 * Plan an approved KOL or affiliate shortlist. Does not open a browser.
 * The owner's target is optional. The ceiling is not a quota.
 *
 *   node affiliate-plan.mjs --handles file --out-dir DIR --store <STORE> --day YYYY-MM-DD --mode full --journal file
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { appendJournal, readJournal } from "../core/journal/action-key.mjs";
import { beginRun } from "../core/runner.mjs";
import { CEILINGS, clipWork, inviteCeiling } from "../core/targets.mjs";

const MANIFEST = JSON.parse(readFileSync(new URL("../core/manifest/affiliate-invite.manifest.json", import.meta.url), "utf8"));

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

export function planInvites(handles, options) {
  const approved = handles.filter((row) => String(row.approved || "yes").toLowerCase() !== "no" && row.handle);
  const ceiling = inviteCeiling(options.stage, options.dayIndex);
  const hourly = Math.min(CEILINGS.invitesPerHour, ceiling);
  const clip = clipWork(approved.length, options.target, ceiling);
  const room = Math.min(clip.allowed, hourly);
  return approved.map((row, index) => ({
    handle: row.handle,
    decision: index < room ? "INVITE" : (index < clip.allowed ? "OVER_HOUR" : "OVER_CAP"),
  }));
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function main() {
  const store = arg("--store");
  const day = arg("--day");
  const journalPath = arg("--journal");
  const handlesPath = arg("--handles");
  const outDir = arg("--out-dir");
  const mode = arg("--mode") || "read_only";
  if (!store || !day || !journalPath || !handlesPath || !outDir) {
    console.error("usage: node affiliate-plan.mjs --handles file --out-dir DIR --store <STORE> --day YYYY-MM-DD --journal file [--target n] [--stage A] [--day-index 0] [--mode full]");
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
  console.log(`module: ${MANIFEST.id}`);
  console.log(`runner: ${decision.result}`);
  if (decision.result !== "RUN") {
    console.log(`result: ${decision.result}`);
    process.exit(1);
  }
  const stage = arg("--stage") || "C";
  const dayIndex = arg("--day-index") === "" ? 0 : Number(arg("--day-index"));
  const planned = planInvites(parseCsv(readFileSync(handlesPath, "utf8")), {
    stage,
    dayIndex,
    target: arg("--target"),
  });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "invite-plan.csv"), `handle,decision\n${planned.map((row) => `${row.handle},${row.decision}`).join("\n")}\n`);
  const inviteCount = planned.filter((row) => row.decision === "INVITE").length;
  console.log(`ceiling: ${inviteCeiling(stage, dayIndex)}`);
  console.log(`hourly_ceiling: ${CEILINGS.invitesPerHour}`);
  console.log(`target: ${arg("--target") || "unset"}`);
  console.log(`invite_count: ${inviteCount}`);
  console.log("cap_is: ceiling");
  appendJournal(journalPath, { actionKey: decision.actionKey, status: "pending", module: MANIFEST.id });
  for (const row of planned) console.log(`${row.decision} ${row.handle}`);
  console.log("result: PLAN");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
