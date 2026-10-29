#!/usr/bin/env node
/**
 * Append one AI cost row for a run and a store.
 * Refuses notes that look like a key. Never prints secrets.
 * An omitted cost stays blank. Do not invent a price.
 *
 *   node ai-cost-log.mjs --module name --store <STORE_LABEL> --platform shopee \
 *     --market <MARKET> --staff <STAFF> --run-id <RUN_ID> \
 *     [--model <MODEL> --input-tokens n --output-tokens n --cost n]
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

const moduleName = arg("--module");
const store = arg("--store") || "<STORE_LABEL>";
const platform = arg("--platform") || "<PLATFORM>";
const market = arg("--market") || "<MARKET>";
const staff = arg("--staff") || "<STAFF>";
const runId = arg("--run-id") || "<RUN_ID>";
const model = arg("--model") || "<MODEL>";
const input = arg("--input-tokens") || "";
const output = arg("--output-tokens") || "";
const cost = arg("--cost") || "";
const currency = arg("--currency") || "USD";
const note = arg("--note") || "";
if (!moduleName) {
  console.error("usage: node ai-cost-log.mjs --module name --store label --platform name --market label --staff label --run-id id");
  process.exit(2);
}
if (/api_key|access_token|BEGIN |@/.test(`${note}${store}${staff}`)) {
  console.error("note_rejected");
  process.exit(2);
}
const header = "logged_at,run_id,store,platform,market,staff,module,model,input_tokens,output_tokens,cost,currency,note\n";
const file = join(homedir(), ".automate-ecom-store", "data", "ai-cost.csv");
mkdirSync(join(file, ".."), { recursive: true, mode: 0o700 });
if (existsSync(file)) {
  const first = readFileSync(file, "utf8").split(/\n/)[0];
  if (first && first !== header.trim()) {
    console.error("header_mismatch");
    process.exit(2);
  }
} else {
  appendFileSync(file, header, { mode: 0o600 });
}
const stamp = new Date().toISOString();
const cells = [stamp, runId, store, platform, market, staff, moduleName, model, input, output, cost, currency, note.replaceAll(",", " ")];
appendFileSync(file, `${cells.join(",")}\n`);
console.log("result: LOGGED");
console.log(`store: ${store}`);
console.log(`module: ${moduleName}`);
