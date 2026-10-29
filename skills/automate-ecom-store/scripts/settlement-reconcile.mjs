#!/usr/bin/env node
/**
 * Compare each order's platform payout with sale price minus fees, shipping,
 * vouchers, and refunds. Two sources must agree. Does not refund or pay.
 *
 *   node settlement-reconcile.mjs --orders-a a.csv [--orders-b b.csv] --out-dir DIR
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
  if (!path) return [];
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

function money(value) {
  const number = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function sameMoney(a, b) {
  return Math.abs(a - b) < 0.001;
}

const ordersAPath = arg("--orders-a");
const outDir = arg("--out-dir");
if (!ordersAPath || !outDir) {
  console.error("usage: node settlement-reconcile.mjs --orders-a file --out-dir DIR [--orders-b file]");
  process.exit(2);
}
const ordersA = records(ordersAPath);
const ordersB = records(arg("--orders-b"));
let qc = ordersB.length ? "OK" : "SINGLE_SOURCE";
if (ordersB.length) {
  for (const row of ordersA) {
    const other = ordersB.find((item) => item.order_id === row.order_id);
    if (!other || !sameMoney(money(row.payout), money(other.payout)) || !sameMoney(money(row.sale_price), money(other.sale_price))) {
      qc = "QC_FAIL";
      console.log(`BOTH ${row.order_id} a_payout=${row.payout} b_payout=${other ? other.payout : "missing"} a_sale=${row.sale_price} b_sale=${other ? other.sale_price : "missing"}`);
    }
  }
}

const out = ordersA.map((row) => {
  const expected = money(row.sale_price) - money(row.platform_fee) - money(row.shipping_fee) - money(row.voucher) - money(row.refund);
  const payout = money(row.payout);
  let status = "MATCH";
  if (payout + 0.001 < expected) status = "UNDERPAID";
  else if (payout > expected + 0.001) status = "OVERPAID";
  if (qc === "QC_FAIL") status = "QC_FAIL";
  return {
    ...row,
    expected_payout: String(Math.round(expected * 100) / 100),
    gap: String(Math.round((payout - expected) * 100) / 100),
    match_status: status,
  };
});

mkdirSync(outDir, { recursive: true });
const header = ["order_id", "date", "store", "platform", "market", "sale_price", "platform_fee", "shipping_fee", "voucher", "refund", "payout", "expected_payout", "gap", "currency", "match_status", "source", "read_time"];
const lines = [header.join(",")];
for (const row of out) {
  lines.push(header.map((key) => {
    const text = String(row[key] ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }).join(","));
}
writeFileSync(join(outDir, "normalized-settlement.csv"), `${lines.join("\n")}\n`);
const underpaid = out.filter((row) => row.match_status === "UNDERPAID").length;
console.log(`orders: ${out.length}`);
console.log(`underpaid: ${underpaid}`);
console.log(`qc: ${qc}`);
console.log(qc === "QC_FAIL" ? "result: QC_FAIL" : "result: OK");
if (qc === "QC_FAIL") process.exit(1);
