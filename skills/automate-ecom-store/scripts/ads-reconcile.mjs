#!/usr/bin/env node
/**
 * Normalize ad spend and match top-ups across two in-store sources.
 * A card last-4 is kept only when the store page already shows it.
 * Does not top up, does not read Gmail or Drive, and does not call a seller site.
 *
 *   node ads-reconcile.mjs --spend-a a.csv [--spend-b b.csv] --topups t.csv \
 *     --topups-b history.csv --balances b.csv [--roas-floor 4] --out-dir DIR
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
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function sameMoney(a, b) {
  return a !== null && b !== null && Math.abs(a - b) < 0.001;
}

function daysApart(a, b) {
  const left = Date.parse(`${a}T00:00:00Z`);
  const right = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(left) || Number.isNaN(right)) return 99;
  return Math.abs(left - right) / 86400000;
}

function outsideStore(source) {
  const name = String(source || "").trim().toLowerCase();
  return ["gmail", "drive", "drive_statement", "google", "google_drive", "card_charge"].includes(name);
}

function keyOf(row) {
  return [row.store, row.platform, row.market, row.date].join("|");
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

const spendAPath = arg("--spend-a");
const outDir = arg("--out-dir");
if (!spendAPath || !outDir) {
  console.error("usage: node ads-reconcile.mjs --spend-a file --out-dir DIR [--spend-b file --topups file --topups-b file --balances file --roas-floor n]");
  process.exit(2);
}
if (process.argv.includes("--charges")) {
  console.error("charges are not a source; pass --topups-b from the in-store ads export or transaction history");
  process.exit(2);
}

const spendA = records(spendAPath);
const spendB = arg("--spend-b") ? records(arg("--spend-b")) : [];
const topups = arg("--topups") ? records(arg("--topups")).map((row) => ({ ...row, card_last4: last4(row.card_last4) })) : [];
const history = arg("--topups-b") ? records(arg("--topups-b")).map((row) => ({ ...row, card_last4: last4(row.card_last4) })) : [];
const balances = arg("--balances") ? records(arg("--balances")) : [];
const floorText = arg("--roas-floor");
const floor = floorText ? Number(floorText) : null;

let qc = spendB.length ? "OK" : "SINGLE_SOURCE";
const spendBMap = new Map(spendB.map((row) => [keyOf(row), row]));
if (spendB.length) {
  for (const row of spendA) {
    const other = spendBMap.get(keyOf(row));
    if (!other || !sameMoney(money(row.spend), money(other.spend)) || !sameMoney(money(row.gmv_attributed), money(other.gmv_attributed))) {
      qc = "QC_FAIL";
      console.log(`BOTH ${keyOf(row)} a_spend=${row.spend} b_spend=${other ? other.spend : "missing"} a_gmv=${row.gmv_attributed} b_gmv=${other ? other.gmv_attributed : "missing"}`);
    }
  }
}

let outside = false;
for (const row of [...spendA, ...spendB, ...topups, ...history, ...balances]) {
  if (outsideStore(row.source)) {
    outside = true;
    qc = "QC_FAIL";
    console.log(`outside_store source=${row.source}`);
  }
}

const groups = new Map();
for (const row of history) {
  const id = [row.date, row.amount, row.currency, row.store, row.platform, row.market].join("|");
  if (!groups.has(id)) groups.set(id, []);
  groups.get(id).push(row);
}
const duplicate = new Set();
for (const group of groups.values()) {
  if (group.length > 1) for (const extra of group.slice(1)) duplicate.add(extra);
}

function samePlace(topup, other) {
  if ((topup.store || "") && (other.store || "") && topup.store !== other.store) return false;
  if ((topup.platform || "") && (other.platform || "") && topup.platform !== other.platform) return false;
  if ((topup.market || "") && (other.market || "") && topup.market !== other.market) return false;
  if (topup.card_last4 && other.card_last4 && topup.card_last4 !== other.card_last4) return false;
  return true;
}

const used = new Set();
const recon = [];
for (const topup of topups) {
  const found = history.find((other) => {
    if (used.has(other) || duplicate.has(other)) return false;
    return sameMoney(money(topup.amount), money(other.amount))
      && (topup.currency || "").toUpperCase() === (other.currency || "").toUpperCase()
      && daysApart(topup.date, other.date) <= 2
      && samePlace(topup, other);
  });
  if (found) {
    used.add(found);
    recon.push({ ...topup, card_last4: topup.card_last4 || found.card_last4, match_status: "MATCH" });
  } else {
    recon.push({ ...topup, card_last4: topup.card_last4 || "", match_status: "UNMATCHED_TOPUP" });
  }
}
for (const other of history) {
  const status = duplicate.has(other) ? "DUPLICATE" : (!used.has(other) ? "UNMATCHED_EXPORT" : "");
  if (!status) continue;
  recon.push({
    date: other.date,
    store: other.store || "",
    platform: other.platform || "",
    market: other.market || "",
    amount: other.amount,
    currency: other.currency,
    merchant: "",
    card_last4: other.card_last4 || "",
    match_status: status,
    read_time: other.read_time || "",
    source: other.source || "",
  });
}

const byStore = new Map();
for (const row of spendA) {
  const id = `${row.store}|${row.platform}|${row.market}`;
  if (!byStore.has(id)) byStore.set(id, { spend: 0, gmv: 0, dates: new Set(), row });
  const bucket = byStore.get(id);
  bucket.spend += money(row.spend) || 0;
  bucket.gmv += money(row.gmv_attributed) || 0;
  bucket.dates.add(row.date);
}

mkdirSync(outDir, { recursive: true });
const normalized = spendA.map((row) => {
  const spend = money(row.spend);
  const gmv = money(row.gmv_attributed);
  const id = `${row.store}|${row.platform}|${row.market}`;
  const balanceRow = balances.find((item) => `${item.store}|${item.platform}|${item.market}` === id);
  const balance = balanceRow ? money(balanceRow.balance) : null;
  const days = byStore.get(id).dates.size && byStore.get(id).spend > 0 && balance !== null
    ? balance / (byStore.get(id).spend / byStore.get(id).dates.size)
    : "";
  const roas = spend ? (gmv / spend) : "";
  return {
    date: row.date,
    store: row.store,
    platform: row.platform,
    market: row.market,
    spend: row.spend,
    currency: row.currency,
    gmv_attributed: row.gmv_attributed,
    roas: row.roas || (roas === "" ? "" : String(Math.round(roas * 10000) / 10000)),
    spend_pct_gmv: gmv ? String(Math.round((spend / gmv) * 10000) / 10000) : "",
    balance: balanceRow ? balanceRow.balance : "",
    days_left: days === "" ? "" : String(Math.round(days * 100) / 100),
    topup_amount: "",
    match_status: qc,
    source: row.source || "",
    read_time: row.read_time || "",
    timezone: row.timezone || "",
  };
});

writeCsv(join(outDir, "normalized-spend.csv"), [
  "date", "store", "platform", "market", "spend", "currency", "gmv_attributed", "roas",
  "spend_pct_gmv", "balance", "days_left", "topup_amount", "match_status", "source", "read_time", "timezone",
], normalized);
writeCsv(join(outDir, "reconciliation.csv"), [
  "date", "store", "platform", "market", "amount", "currency", "merchant", "card_last4", "match_status", "read_time", "source",
], recon);

let longDigits = 0;
const written = readFileSync(join(outDir, "reconciliation.csv"), "utf8") + readFileSync(join(outDir, "normalized-spend.csv"), "utf8");
if (/\d{13,}/.test(written.replace(/[ -]/g, ""))) longDigits = 1;

for (const [id, bucket] of byStore) {
  const [store, platform] = id.split("|");
  const roas = bucket.spend ? bucket.gmv / bucket.spend : null;
  const pct = bucket.gmv ? bucket.spend / bucket.gmv : null;
  const balanceRow = balances.find((item) => `${item.store}|${item.platform}|${item.market}` === id);
  const balance = balanceRow ? money(balanceRow.balance) : null;
  const daily = bucket.dates.size ? bucket.spend / bucket.dates.size : 0;
  const days = balance !== null && daily > 0 ? Math.round((balance / daily) * 100) / 100 : "undefined";
  console.log(`store ${store} platform ${platform} spend ${bucket.spend} gmv ${bucket.gmv} roas ${roas ?? "undefined"} spend_pct_gmv ${pct ?? "undefined"} balance ${balance ?? "missing"} days_left ${days}`);
  if (floor !== null && roas !== null && roas < floor) console.log(`ALERT roas_below_floor store ${store} roas ${roas} floor ${floor}`);
  if (typeof days === "number" && days < 3) console.log(`ALERT low_balance_days store ${store} days_left ${days}`);
}
console.log(`qc: ${qc}`);
console.log(`matches: ${recon.filter((row) => row.match_status === "MATCH").length}`);
console.log(`unmatched_topups: ${recon.filter((row) => row.match_status === "UNMATCHED_TOPUP").length}`);
console.log(`unmatched_exports: ${recon.filter((row) => row.match_status === "UNMATCHED_EXPORT").length}`);
console.log(`duplicates: ${recon.filter((row) => row.match_status === "DUPLICATE").length}`);
console.log(`card_digits: ${longDigits ? "too_long" : "last4_only"}`);
console.log(qc === "QC_FAIL" || longDigits || outside ? "result: QC_FAIL" : "result: OK");
if (qc === "QC_FAIL" || longDigits || outside) process.exit(1);
