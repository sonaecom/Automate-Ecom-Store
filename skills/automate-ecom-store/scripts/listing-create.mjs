#!/usr/bin/env node
/** Plan a new product listing. Does not open a browser. */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { appendJournal, readJournal } from "../core/journal/action-key.mjs";
import { beginRun } from "../core/runner.mjs";
import { listingRoom } from "./listing-edit.mjs";

const MANIFEST = JSON.parse(readFileSync(new URL("../core/manifest/product-listing.manifest.json", import.meta.url), "utf8"));
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

export function planListings(rows, options) {
  const room = listingRoom(rows.length, options.hourlyDone || 0, options.target);
  let used = 0;
  return rows.map((row) => {
    const title = row.title || "";
    const variation = row.variation || "";
    const images = Number(row.image_count);
    if (!title || !variation || TOKEN.test(`${title} ${variation}`) || !Number.isInteger(images) || images < 1) {
      return { title, decision: "REJECT" };
    }
    if (used >= room.allowed) return { title, decision: "OVER_CAP" };
    used += 1;
    return { title, decision: "CREATE" };
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
  const file = arg("--specs");
  const outDir = arg("--out-dir");
  const platform = (arg("--platform") || "").toLowerCase();
  const mode = arg("--mode") || "read_only";
  if (!store || !day || !journalPath || !file || !outDir || !PLATFORMS.has(platform)) {
    console.error("usage: node listing-create.mjs --specs file --platform shopee|tiktokshop|lazada --out-dir DIR --store <STORE> --day YYYY-MM-DD --journal file");
    process.exit(2);
  }
  const decision = beginRun({
    store: { id: store, mode },
    manifest: MANIFEST,
    action: "publish",
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
  const planned = planListings(parseCsv(readFileSync(file, "utf8")), {
    hourlyDone: arg("--hourly-done") === "" ? 0 : Number(arg("--hourly-done")),
    target: arg("--target"),
  });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "listing-create.csv"), `title,decision\n${planned.map((row) => `${row.title},${row.decision}`).join("\n")}\n`);
  console.log(`create_count: ${planned.filter((row) => row.decision === "CREATE").length}`);
  console.log("result: PLAN");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
