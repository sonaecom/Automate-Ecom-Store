#!/usr/bin/env node
/**
 * Alert on return and evidence deadlines from policies/rules.yaml.
 * Does not reply, refund, or submit a case.
 *
 *   node return-alerts.mjs --platform shopee --market PH --as-of YYYY-MM-DD --cases file
 */

import { readFileSync } from "node:fs";
import { loadRules, rulesFor } from "./policy-rules.mjs";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "").replace(/^(?:#[^\n]*\n)+/, "");
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

function records(path) {
  const rows = parseCsv(readFileSync(path, "utf8"));
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  return rows.slice(1).map((cells) => {
    const record = {};
    header.forEach((key, index) => {
      record[key] = (cells[index] || "").trim();
    });
    return record;
  });
}

function addDays(iso, days) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!match) return "";
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function statusFor(asOf, deadline) {
  if (!deadline) return "NONE";
  if (asOf > deadline) return "OVERDUE";
  const dayBefore = addDays(deadline, -1);
  if (asOf === deadline || asOf === dayBefore) return "DUE";
  return "OK";
}

const platform = arg("--platform");
const market = arg("--market");
const asOf = arg("--as-of");
const casesPath = arg("--cases");
if (!platform || !market || !asOf || !casesPath) {
  console.error("usage: node return-alerts.mjs --platform name --market CODE --as-of YYYY-MM-DD --cases file");
  process.exit(2);
}

const rules = rulesFor(loadRules(), platform, market);
const evidence = rules.find((rule) => rule.category === "returns" && /evidence request within 1 day/i.test(rule.rule || ""));
const review = rules.find((rule) => rule.category === "returns" && /review return\/refund requests within 2 calendar days/i.test(rule.rule || ""));
console.log(`platform: ${platform}`);
console.log(`market: ${market}`);
console.log(`as_of: ${asOf}`);
console.log("gap vouchers: not captured");
console.log("gap invite_limits: not captured");
if (platform.toLowerCase() === "lazada") console.log("gap lazada_coverage: incomplete");

let alerts = 0;
for (const row of records(casesPath)) {
  const kind = (row.kind || "").toLowerCase();
  let rule = null;
  let days = 0;
  let opened = row.opened_on || "";
  if (kind === "evidence" && evidence) {
    rule = evidence;
    days = 1;
  } else if (kind === "return_review" && review) {
    rule = review;
    days = 2;
  }
  if (!rule) {
    console.log(`case ${row.case_id || ""} kind ${kind} rule none status NONE`);
    continue;
  }
  const deadline = addDays(opened, days);
  const status = statusFor(asOf, deadline);
  console.log(`alert ${rule.id} case ${row.case_id || ""} kind ${kind} opened ${opened} deadline ${deadline} status ${status}`);
  if (status === "DUE" || status === "OVERDUE") alerts += 1;
}
console.log(`alerts: ${alerts}`);
console.log(alerts ? "result: ALERT" : "result: OK");
