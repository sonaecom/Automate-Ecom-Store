#!/usr/bin/env node
/** Append one AI cost row. Refuses notes that look like a key. Never prints secrets. */

import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

const moduleName = arg("--module");
const model = arg("--model") || "<MODEL>";
const input = arg("--input-tokens") || "0";
const output = arg("--output-tokens") || "0";
const cost = arg("--cost") || "0";
const currency = arg("--currency") || "USD";
const note = arg("--note") || "";
if (!moduleName) {
  console.error("usage: node ai-cost-log.mjs --module name [--model name --input-tokens n --output-tokens n --cost n]");
  process.exit(2);
}
if (/api_key|access_token|BEGIN /i.test(note)) {
  console.error("note_rejected");
  process.exit(2);
}
const file = join(homedir(), ".automate-ecom-store", "data", "ai-cost.csv");
mkdirSync(join(file, ".."), { recursive: true, mode: 0o700 });
const header = "logged_at,module,model,input_tokens,output_tokens,cost,currency,note\n";
if (!existsSync(file)) appendFileSync(file, header, { mode: 0o600 });
const stamp = new Date().toISOString();
appendFileSync(file, `${stamp},${moduleName},${model},${input},${output},${cost},${currency},${note.replaceAll(",", " ")}\n`);
console.log("result: LOGGED");
