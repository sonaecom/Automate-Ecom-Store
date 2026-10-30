#!/usr/bin/env node
/** Print local safety lessons. Skips lines that look like a secret. */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const file = join(homedir(), ".automate-ecom-store", "data", "lessons.md");
if (!existsSync(file)) {
  console.log("lessons: 0");
  console.log("result: NONE");
  process.exit(0);
}
const lines = readFileSync(file, "utf8").split(/\r?\n/).map((line) => line.trim()).filter((line) => line.startsWith("- "));
let shown = 0;
for (const line of lines) {
  if (/api_key|access_token|BEGIN |password/i.test(line)) continue;
  if (/\d{13,}/.test(line)) continue;
  console.log(line);
  shown += 1;
}
console.log(`lessons: ${shown}`);
console.log("result: OK");
