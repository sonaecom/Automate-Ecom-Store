#!/usr/bin/env node
/**
 * Compare wallet balances and match withdrawals to in-store payout lines.
 * Keeps the last 4 digits of a bank account only when the store page shows them.
 * Does not read Gmail or Drive. Does not start a withdrawal. Does not call a seller site.
 *
 *   node wallet-reconcile.mjs --balance-a a.csv [--balance-b b.csv] \
 *     --withdrawals w.csv --credits c.csv --as-of YYYY-MM-DD --out-dir DIR
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

function last4(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length >= 4) return digits.slice(-4);
  return "";
}

function money(value) {
  const number = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function sameMoney(a, b) {
  return a !== null && b !== null && Math.abs(a - b) < 0.001;
}

function dayNumber(value) {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(parsed) ? null : parsed / 86400000;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(path, header, rows) {
  const lines = [header.join(",")];
  for (const row of rows) lines.push(header.map((key) => csvEscape(row[key])).join(","));
  writeFileSync(path, `${lines.join("\n")}\n`);
}

const balanceAPath = arg("--balance-a");
const outDir = arg("--out-dir");
const asOf = arg("--as-of");
if (!balanceAPath || !outDir || !asOf) {
  console.error("usage: node wallet-reconcile.mjs --balance-a file --as-of YYYY-MM-DD --out-dir DIR [--balance-b file --withdrawals file --credits file --wait-days 5 --pending-days 7]");
  process.exit(2);
}
const waitDays = arg("--wait-days") ? Number(arg("--wait-days")) : 5;
const pendingDays = arg("--pending-days") ? Number(arg("--pending-days")) : 7;
const asOfDay = dayNumber(asOf);
if (asOfDay === null || !Number.isFinite(waitDays) || !Number.isFinite(pendingDays)) {
  console.error("as-of must be YYYY-MM-DD and day windows must be numbers");
  process.exit(2);
}

const balanceA = records(balanceAPath);
const balanceB = records(arg("--balance-b"));
const withdrawals = records(arg("--withdrawals")).map((row) => ({ ...row, bank_last4: last4(row.bank_last4) }));
const credits = records(arg("--credits")).map((row) => ({ ...row, bank_last4: last4(row.bank_last4) }));
function outsideStore(source) {
  const name = String(source || "").trim().toLowerCase();
  return ["gmail", "drive", "drive_statement", "google", "google_drive"].includes(name);
}

let qc = balanceB.length ? "OK" : "SINGLE_SOURCE";
let outside = false;
for (const row of [...balanceA, ...balanceB, ...withdrawals, ...credits]) {
  if (outsideStore(row.source)) {
    outside = true;
    qc = "QC_FAIL";
    console.log(`outside_store source=${row.source}`);
  }
}
if (balanceB.length) {
  for (const row of balanceA) {
    const other = balanceB.find((item) => item.store === row.store && item.platform === row.platform && item.market === row.market);
    if (!other
      || !sameMoney(money(row.available), money(other.available))
      || !sameMoney(money(row.pending), money(other.pending))
      || !sameMoney(money(row.incoming), money(other.incoming))) {
      qc = "QC_FAIL";
      console.log(`BOTH ${row.store}|${row.platform}|${row.market} a_available=${row.available} b_available=${other ? other.available : "missing"} a_pending=${row.pending} b_pending=${other ? other.pending : "missing"} a_incoming=${row.incoming} b_incoming=${other ? other.incoming : "missing"}`);
    }
  }
}

const groups = new Map();
for (const credit of credits) {
  const id = [credit.date, credit.amount, credit.currency, credit.bank_last4].join("|");
  if (!groups.has(id)) groups.set(id, []);
  groups.get(id).push(credit);
}
const duplicate = new Set();
for (const group of groups.values()) {
  if (group.length > 1) for (const extra of group.slice(1)) duplicate.add(extra);
}

function inWindow(withdrawal, credit) {
  const creditDay = dayNumber(credit.date);
  const withdrawalDay = dayNumber(withdrawal.date);
  if (creditDay === null || withdrawalDay === null) return false;
  const lag = creditDay - withdrawalDay;
  return (withdrawal.currency || "").toUpperCase() === (credit.currency || "").toUpperCase()
    && withdrawal.bank_last4 === credit.bank_last4
    && lag >= 0
    && lag <= waitDays;
}

const used = new Set();
const recon = [];
const prepared = withdrawals.map((withdrawal) => {
  const amount = money(withdrawal.amount);
  const fee = money(withdrawal.fee) || 0;
  return { withdrawal, net: amount === null ? null : amount - fee };
});
for (const item of prepared) {
  const found = credits.find((credit) => !used.has(credit) && !duplicate.has(credit) && inWindow(item.withdrawal, credit) && sameMoney(item.net, money(credit.amount)));
  item.credit = found || null;
  if (found) used.add(found);
}
for (const item of prepared) {
  if (item.credit) continue;
  const candidates = credits.filter((credit) => !used.has(credit) && !duplicate.has(credit) && inWindow(item.withdrawal, credit));
  if (candidates.length === 1) {
    item.credit = candidates[0];
    item.mismatch = true;
    used.add(candidates[0]);
  }
}
for (const item of prepared) {
  const { withdrawal, net } = item;
  const status = (withdrawal.status || "").toLowerCase();
  const age = asOfDay - (dayNumber(withdrawal.date) ?? asOfDay);
  let match = "UNMATCHED";
  if (item.credit && !item.mismatch) match = "MATCH";
  else if (item.mismatch) match = "AMOUNT_MISMATCH";
  else if (status === "pending" && age > pendingDays) match = "PENDING_TOO_LONG";
  else if (status === "completed" || status === "paid" || status === "success") match = "MISSING";
  else if (status === "pending") match = "PENDING";
  recon.push({
    date: withdrawal.date,
    store: withdrawal.store,
    platform: withdrawal.platform,
    market: withdrawal.market,
    withdrawal_amount: withdrawal.amount,
    withdrawal_fee: withdrawal.fee,
    withdrawal_net: net === null ? "" : String(net),
    bank_last4: withdrawal.bank_last4,
    withdrawal_status: withdrawal.status,
    match_status: match,
    source: withdrawal.source || "",
    read_time: withdrawal.read_time || "",
    currency: withdrawal.currency || "",
  });
}
for (const credit of credits) {
  if (!duplicate.has(credit)) continue;
  recon.push({
    date: credit.date,
    store: "",
    platform: "",
    market: "",
    withdrawal_amount: credit.amount,
    withdrawal_fee: "",
    withdrawal_net: credit.amount,
    bank_last4: credit.bank_last4,
    withdrawal_status: "",
    match_status: "DUPLICATE",
    source: credit.source || "",
    read_time: credit.read_time || "",
    currency: credit.currency || "",
  });
}

const normalized = [];
for (const row of balanceA) {
  const related = recon.filter((item) => item.store === row.store && item.platform === row.platform && item.match_status !== "DUPLICATE");
  const base = {
    date: asOf,
    store: row.store,
    platform: row.platform,
    market: row.market,
    available: row.available,
    pending: row.pending,
    incoming: row.incoming,
    currency: row.currency,
    withdrawal_amount: "",
    withdrawal_fee: "",
    withdrawal_net: "",
    bank_last4: "",
    withdrawal_status: "",
    match_status: qc,
    source: row.source || "",
    read_time: row.read_time || "",
    timezone: row.timezone || "",
  };
  if (related.length === 0) normalized.push(base);
  for (const item of related) {
    normalized.push({
      ...base,
      withdrawal_amount: item.withdrawal_amount,
      withdrawal_fee: item.withdrawal_fee,
      withdrawal_net: item.withdrawal_net,
      bank_last4: item.bank_last4,
      withdrawal_status: item.withdrawal_status,
      match_status: qc === "QC_FAIL" ? "QC_FAIL" : item.match_status,
      source: item.source || base.source,
      read_time: item.read_time || base.read_time,
    });
  }
  console.log(`store ${row.store} platform ${row.platform} available ${row.available} pending ${row.pending} incoming ${row.incoming} ${row.currency}`);
}

mkdirSync(outDir, { recursive: true });
const header = [
  "date", "store", "platform", "market", "available", "pending", "incoming", "currency",
  "withdrawal_amount", "withdrawal_fee", "withdrawal_net", "bank_last4", "withdrawal_status",
  "match_status", "source", "read_time", "timezone",
];
const lines = [header.join(",")];
for (const row of normalized) {
  lines.push(header.map((key) => {
    const text = String(row[key] ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }).join(","));
}
const outFile = join(outDir, "normalized-wallet.csv");
writeFileSync(outFile, `${lines.join("\n")}\n`);
const written = readFileSync(outFile, "utf8");
const longDigits = /\d{13,}/.test(written.replace(/[ -]/g, ""));
const count = (status) => normalized.filter((row) => row.match_status === status).length;
console.log(`qc: ${qc}`);
console.log(`matches: ${count("MATCH")}`);
console.log(`missing: ${count("MISSING")}`);
console.log(`pending_too_long: ${count("PENDING_TOO_LONG")}`);
console.log(`amount_mismatch: ${count("AMOUNT_MISMATCH")}`);
console.log(`duplicates: ${recon.filter((row) => row.match_status === "DUPLICATE").length}`);
console.log(`bank_digits: ${longDigits ? "too_long" : "last4_only"}`);
console.log(qc === "QC_FAIL" || longDigits || outside ? "result: QC_FAIL" : "result: OK");
if (qc === "QC_FAIL" || longDigits || outside) process.exit(1);
