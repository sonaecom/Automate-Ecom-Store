#!/usr/bin/env node
/**
 * Decide whether one delivered order may receive the thank-you.
 * Does not send the message.
 *
 *   node follow-up.mjs --orders delivered.csv --sent sent.csv --opt-out opt.csv --order <ORDER_ID>
 *   node follow-up.mjs --text "message"
 *   node follow-up.mjs --library
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findForbidden } from "./review-phrases.mjs";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
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
  if (!path) return [];
  const rows = parseCsv(readFileSync(path, "utf8"));
  if (!rows.length) return [];
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  return rows.slice(1).map((cells) => {
    const record = {};
    header.forEach((key, index) => {
      record[key] = (cells[index] || "").trim();
    });
    return record;
  });
}

function checkText(text) {
  const hits = findForbidden(text);
  const points = Array.from(text).length;
  console.log(`code_points: ${points}`);
  if (!text.trim()) {
    console.log("result: EMPTY");
    process.exit(1);
  }
  if (hits.length) {
    console.log(`forbidden: ${[...new Set(hits)].join(" ")}`);
    console.log("result: FORBIDDEN");
    process.exit(1);
  }
  if (points > 300 || text.length > 300) {
    console.log("result: TOO_LONG");
    process.exit(1);
  }
  console.log("result: OK");
}

if (process.argv.includes("--library")) {
  const library = JSON.parse(readFileSync(join(import.meta.dirname, "..", "templates", "messages", "library.json"), "utf8"));
  let failed = false;
  for (const [language, text] of Object.entries(library.post_delivery || {})) {
    const hits = findForbidden(text);
    const points = Array.from(text).length;
    console.log(`post_delivery_${language}_code_points: ${points}`);
    if (hits.length || points > 300 || text.length > 300) {
      console.error(`${language}: ${hits.join(" ") || "TOO_LONG"}`);
      failed = true;
    }
  }
  console.log(failed ? "result: FAIL" : "result: OK");
  process.exit(failed ? 1 : 0);
}

if (arg("--text") || process.argv.includes("--text")) {
  checkText(arg("--text"));
  process.exit(0);
}

const ordersPath = arg("--orders");
const orderId = arg("--order");
if (!ordersPath || !orderId) {
  console.error("usage: node follow-up.mjs --orders file --order id [--sent file --opt-out file] | --text message | --library");
  process.exit(2);
}
const delivered = new Set(["delivered", "completed"]);
const order = records(ordersPath).find((row) => row.order_id === orderId);
if (!order) {
  console.log("result: SKIP");
  console.log("reason: not_found");
  process.exit(0);
}
if (!delivered.has((order.status || "").toLowerCase())) {
  console.log("result: SKIP");
  console.log("reason: not_delivered");
  process.exit(0);
}
if (records(arg("--sent")).some((row) => row.order_id === orderId)) {
  console.log("result: SKIP");
  console.log("reason: already_sent");
  process.exit(0);
}
const blocked = records(arg("--opt-out")).find((row) => row.order_id === orderId);
if (blocked) {
  console.log("result: SKIP");
  console.log(`reason: ${blocked.reason || "opt_out"}`);
  process.exit(0);
}
console.log(`order: ${orderId}`);
console.log(`store: ${order.store || ""}`);
console.log(`platform: ${order.platform || ""}`);
console.log("result: SEND");
