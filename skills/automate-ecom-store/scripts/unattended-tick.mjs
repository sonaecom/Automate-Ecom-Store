#!/usr/bin/env node
/**
 * Wake check for a host that stays on. Does not open AdsPower or a browser.
 *
 *   node unattended-tick.mjs --state path --gap-hours 2 [--csv path --platform shopee]
 *
 * READY means a session may start. WAIT means do not open a profile.
 */

import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function resultLine(text) {
  const lines = String(text || "").split(/\n/).filter((line) => line.startsWith("result: "));
  return lines.length ? lines[lines.length - 1].slice("result: ".length).trim() : "";
}

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
}

function main() {
  const state = arg("--state");
  const gap = arg("--gap-hours");
  if (!state || !gap) {
    console.error("usage: node unattended-tick.mjs --state path --gap-hours n [--csv path --platform name]");
    process.exit(2);
  }
  const caps = new URL("./caps-counter.mjs", import.meta.url);
  const show = run(caps.pathname, ["--state", state, "--show", "--gap-hours", gap]);
  const gate = resultLine(`${show.stdout}\n${show.stderr}`);
  console.log(`gap: ${gate || "missing"}`);
  const csv = arg("--csv");
  const platform = arg("--platform");
  let review = "OK";
  if (csv || platform) {
    if (!csv || !platform) {
      console.error("captcha review needs both --csv and --platform");
      process.exit(2);
    }
    const log = new URL("./captcha-log.mjs", import.meta.url);
    const reviewed = run(log.pathname, ["--csv", csv, "--review", "--platform", platform]);
    review = resultLine(`${reviewed.stdout}\n${reviewed.stderr}`) || "missing";
    console.log(`captcha: ${review}`);
  }
  console.log("open_browser: no");
  if (gate === "READY" && review !== "REVIEW") {
    console.log("result: READY");
    return;
  }
  console.log("result: WAIT");
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
