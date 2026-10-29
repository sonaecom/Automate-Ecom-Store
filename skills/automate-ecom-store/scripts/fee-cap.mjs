#!/usr/bin/env node
/**
 * Compare platform fees with an owner cap. Two exports must agree.
 * Prints proposals. Does not opt out, change a price, or stop a promotion.
 *
 *   node fee-cap.mjs --orders-a file --caps file --out-dir DIR [--orders-b file] [--config file] [--include-ads]
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PROGRAMS = ["free_shipping", "coins", "voucher", "affiliate"];
const PROMO = new Set(["coins", "voucher"]);
const PARTS = ["commission", "payment_fee", "free_shipping", "coins", "voucher", "affiliate"];

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

function money(value) {
  if (value === undefined || value === "" || String(value).includes("<")) return null;
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function show(value) {
  if (value === null || !Number.isFinite(value)) return "";
  return String(Math.round(value * 10000) / 10000);
}

function same(a, b) {
  return a !== null && b !== null && Math.abs(a - b) < 0.001;
}

function configMap(path) {
  const out = {};
  if (!path) return out;
  for (const raw of readFileSync(path, "utf8").split(/\n/)) {
    const line = raw.replace(/\s+#.*$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const pair = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!pair) continue;
    out[pair[1]] = pair[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(path, header, rows) {
  const lines = [header.join(",")];
  for (const row of rows) lines.push(header.map((key) => csvCell(row[key] ?? "")).join(","));
  writeFileSync(path, `${lines.join("\n")}\n`);
}

const ordersAPath = arg("--orders-a");
const capsPath = arg("--caps");
const outDir = arg("--out-dir");
if (!ordersAPath || !capsPath || !outDir) {
  console.error("usage: node fee-cap.mjs --orders-a file --caps file --out-dir DIR [--orders-b file] [--config file] [--include-ads]");
  process.exit(2);
}

const cfg = configMap(arg("--config"));
const includeAds = process.argv.includes("--include-ads") || cfg.include_ads === "yes";
const warn = money(arg("--warn-fraction") || cfg.warn_fraction) ?? 0.9;
const ordersB = records(arg("--orders-b"));
const byId = new Map(ordersB.map((row) => [row.order_id, row]));
let qc = ordersB.length ? "OK" : "SINGLE_SOURCE";
const fields = ["gmv", ...PARTS, "ads_fee"];

const caps = records(capsPath);
function findCap(level, row) {
  const hit = caps.find((cap) => cap.level === level
    && cap.store === row.store
    && cap.platform === row.platform
    && cap.market === row.market
    && (level !== "sku" || cap.sku === row.sku)
    && (level !== "category" || cap.category === row.category));
  return hit ? money(hit.cap_percent) : null;
}

function capForOrder(row) {
  return findCap("sku", row) ?? findCap("category", row) ?? findCap("store", row);
}

function partsOf(row) {
  const parts = {};
  let missing = false;
  for (const key of PARTS) {
    const value = money(row[key]);
    if (value === null) missing = true;
    else parts[key] = value;
  }
  if (includeAds) {
    const ads = money(row.ads_fee);
    if (ads === null) missing = true;
    else parts.ads = ads;
  }
  return { parts, missing };
}

function judge(pct, cap) {
  if (cap === null) return "UNSET";
  if (pct >= cap) return "OVER";
  if (pct >= cap * warn) return "NEAR";
  return "OK";
}

function topProgram(parts) {
  const ranked = Object.entries(parts).sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] || "";
}

function proposalFor(parts, gmv, cap) {
  const total = Object.values(parts).reduce((sum, value) => sum + value, 0);
  const capAmount = gmv * cap / 100;
  const ranked = PROGRAMS.map((name) => [name, parts[name] || 0]).sort((a, b) => b[1] - a[1]);
  for (const [name, amount] of ranked) {
    if (amount > 0 && total - amount < capAmount - 0.001) {
      return { action: PROMO.has(name) ? "STOP_PROMO" : "OPT_OUT", program: name };
    }
  }
  return { action: "ADJUST_PRICE", program: "" };
}

const orders = [];
for (const row of records(ordersAPath)) {
  const other = ordersB.length ? byId.get(row.order_id) : null;
  let orderQc = qc === "SINGLE_SOURCE" ? "SINGLE_SOURCE" : "OK";
  if (ordersB.length && !other) {
    orderQc = "QC_FAIL";
    qc = "QC_FAIL";
    console.log(`BOTH ${row.order_id} b=missing`);
  } else if (other) {
    for (const field of fields) {
      if (!same(money(row[field]), money(other[field]))) {
        orderQc = "QC_FAIL";
        qc = "QC_FAIL";
        console.log(`BOTH ${row.order_id} ${field} a=${row[field] || ""} b=${other[field] || ""}`);
      }
    }
  }
  const gmv = money(row.gmv);
  const { parts, missing } = partsOf(row);
  const fee = missing || gmv === null ? null : Object.values(parts).reduce((sum, value) => sum + value, 0);
  const pct = fee === null || gmv === null || gmv === 0 ? null : fee / gmv * 100;
  const cap = capForOrder(row);
  let result = "MISSING";
  if (orderQc === "QC_FAIL") result = "QC_FAIL";
  else if (pct !== null) result = judge(pct, cap);
  const top = result === "QC_FAIL" || result === "MISSING" ? "" : topProgram(parts);
  let proposal = "";
  if ((result === "OVER") && pct !== null && cap !== null) {
    const chosen = proposalFor(parts, gmv, cap);
    proposal = chosen.program ? `${chosen.action} ${chosen.program}` : chosen.action;
  }
  orders.push({
    order_id: row.order_id || "",
    date: row.date || "",
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    sku: row.sku || "",
    category: row.category || "",
    gmv: show(gmv),
    fee: show(fee),
    fee_pct: show(pct),
    cap_percent: show(cap),
    result,
    top_program: top,
    proposal,
    currency: row.currency || "",
    qc: orderQc,
    parts,
  });
  console.log(`order ${row.order_id} gmv ${show(gmv)} fee ${show(fee)} fee_pct ${show(pct)} cap ${show(cap)} result: ${result} program ${top} proposal ${proposal}`);
}

function addGroup(map, key, order) {
  const bucket = map.get(key) || {
    orders: [],
    store: order.store,
    platform: order.platform,
    market: order.market,
    sku: order.sku,
    category: order.category,
    date: order.date,
    currency: order.currency,
  };
  bucket.orders.push(order);
  map.set(key, bucket);
}

const groups = {
  sku: new Map(),
  category: new Map(),
  store_day: new Map(),
  store_month: new Map(),
};
for (const order of orders) {
  if (order.result === "QC_FAIL" || order.result === "MISSING") continue;
  addGroup(groups.sku, `${order.store}|${order.platform}|${order.market}|${order.sku}`, order);
  addGroup(groups.category, `${order.store}|${order.platform}|${order.market}|${order.category}`, order);
  addGroup(groups.store_day, `${order.date}|${order.store}|${order.platform}|${order.market}`, order);
  addGroup(groups.store_month, `${order.date.slice(0, 7)}|${order.store}|${order.platform}|${order.market}`, order);
}

const rollups = [];
const proposals = [];
for (const [level, map] of Object.entries(groups)) {
  for (const [key, bucket] of map) {
    const gmv = bucket.orders.reduce((sum, order) => sum + Number(order.gmv), 0);
    const fee = bucket.orders.reduce((sum, order) => sum + Number(order.fee), 0);
    const parts = {};
    for (const order of bucket.orders) {
      for (const [name, amount] of Object.entries(order.parts)) parts[name] = (parts[name] || 0) + amount;
    }
    const sample = bucket.orders[0];
    const cap = level === "sku"
      ? (findCap("sku", sample) ?? findCap("store", sample))
      : level === "category"
        ? (findCap("category", sample) ?? findCap("store", sample))
        : findCap("store", sample);
    const pct = gmv === 0 ? null : fee / gmv * 100;
    const result = judge(pct, cap);
    const top = topProgram(parts);
    let proposal = "";
    if (result === "OVER" && cap !== null) {
      const chosen = proposalFor(parts, gmv, cap);
      proposal = chosen.program ? `${chosen.action} ${chosen.program}` : chosen.action;
      proposals.push({
        action: chosen.action,
        program: chosen.program,
        level,
        key,
        store: sample.store,
        platform: sample.platform,
        market: sample.market,
        sku: level === "sku" ? sample.sku : "",
        reason: `${show(pct)} of ${show(cap)}`,
        approval: "required",
        applied: "no",
      });
    }
    const period = level === "store_month" ? sample.date.slice(0, 7) : sample.date;
    rollups.push({
      level,
      key,
      period,
      date: level === "store_month" ? `${sample.date.slice(0, 7)}-01` : sample.date,
      store: sample.store,
      platform: sample.platform,
      market: sample.market,
      gmv: show(gmv),
      fee: show(fee),
      fee_pct: show(pct),
      cap_percent: show(cap),
      result,
      top_program: top,
      proposal,
      currency: sample.currency,
      qc: qc === "QC_FAIL" ? "PARTIAL" : qc,
    });
    console.log(`${level} ${key} gmv ${show(gmv)} fee ${show(fee)} fee_pct ${show(pct)} cap ${show(cap)} result: ${result} program ${top} proposal ${proposal}`);
  }
}
for (const row of proposals) {
  console.log(`proposal ${row.action} program ${row.program} level ${row.level} key ${row.key} approval required applied no`);
}

mkdirSync(outDir, { recursive: true });
writeCsv(join(outDir, "fee-orders.csv"), ["order_id", "date", "store", "platform", "market", "sku", "category", "gmv", "fee", "fee_pct", "cap_percent", "result", "top_program", "proposal", "currency", "qc"], orders);
writeCsv(join(outDir, "fee-rollups.csv"), ["level", "key", "period", "date", "store", "platform", "market", "gmv", "fee", "fee_pct", "cap_percent", "result", "top_program", "proposal", "currency", "qc"], rollups);
writeCsv(join(outDir, "fee-proposals.csv"), ["action", "program", "level", "key", "store", "platform", "market", "sku", "reason", "approval", "applied"], proposals);
console.log(`include_ads: ${includeAds ? "yes" : "no"}`);
console.log(`warn_fraction: ${warn}`);
console.log(`qc: ${qc}`);
console.log(`orders: ${orders.length}`);
console.log(`proposals: ${proposals.length}`);
console.log("result: OK");
