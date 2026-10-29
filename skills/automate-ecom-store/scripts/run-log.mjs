#!/usr/bin/env node
/** Append a run row and, on failure, a local lesson. Does not change seller settings. */

import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

const moduleName = arg("--module");
const platform = arg("--platform") || "";
const result = arg("--result") || "ok";
const captcha = arg("--captcha-count") || "0";
if (!moduleName) {
  console.error("usage: node run-log.mjs --module name --platform name --result ok|failed --captcha-count n");
  process.exit(2);
}
const dir = join(homedir(), ".automate-ecom-store", "data");
mkdirSync(dir, { recursive: true, mode: 0o700 });
const runs = join(dir, "runs.csv");
if (!existsSync(runs)) {
  appendFileSync(runs, "logged_at,module,platform,result,captcha_count\n", { mode: 0o600 });
}
appendFileSync(runs, `${new Date().toISOString()},${moduleName},${platform},${result},${captcha}\n`);
if (result !== "ok") {
  const lessons = join(dir, "lessons.md");
  appendFileSync(
    lessons,
    `\n- ${new Date().toISOString()} ${moduleName} ${platform} result=${result}. Review the run. Do not change seller settings from this note.\n`,
    { mode: 0o600 },
  );
  console.log("lesson: added");
}
console.log("result: LOGGED");
