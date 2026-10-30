#!/usr/bin/env node
/**
 * Cancellation rate uses orders created in the period, including pre-shipment cancels.
 * Return / RTS rate uses only orders with a courier pickup or transit time.
 * Unshipped orders are never in the return rate.
 * Does not cancel orders and does not call a seller site.
 *
 *   node cancel-return.mjs --orders-a a.csv --from YYYY-MM-DD --to YYYY-MM-DD --out-dir DIR
 *       [--orders-b b.csv] [--cancel-threshold 0.05] [--rts-threshold 0.05]
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RETURN_WORDS = new Set([
  "return_to_sender",
  "returned",
  "returning",
  "failed_delivery",
  "delivery_failed",
  "cancelled_in_transit",
  "canceled_in_transit",
  "lost",
]);

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

function day(value) {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value || "");
  return match ? match[1] : "";
}

function inRange(value, from, to) {
  const date = day(value);
  return Boolean(date) && date >= from && date <= to;
}

function norm(value) {
  return String(value || "").trim().toLowerCase().replaceAll(" ", "_").replaceAll("-", "_");
}

function shippedOut(row) {
  return Boolean(day(row.courier_pickup_time));
}

function isCancelled(row) {
  const status = norm(row.status);
  const party = norm(row.cancelled_by);
  if (["buyer", "seller", "system"].includes(party)) return true;
  return status === "cancelled" || status === "canceled";
}

function isReturn(row) {
  if (!shippedOut(row)) return false;
  const status = norm(row.status);
  const outcome = norm(row.outcome);
  return RETURN_WORDS.has(status) || RETURN_WORDS.has(outcome) || status === "cancelled_in_transit" || outcome === "cancelled_in_transit";
}

function rate(part, whole) {
  if (!whole) return "";
  return String(Math.round((part / whole) * 10000) / 10000);
}

function csv(path, header, rows) {
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(header.map((key) => {
      const text = String(row[key] ?? "");
      return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    }).join(","));
  }
  writeFileSync(path, `${lines.join("\n")}\n`);
}

const ordersAPath = arg("--orders-a");
const from = arg("--from");
const to = arg("--to");
const outDir = arg("--out-dir");
if (!ordersAPath || !from || !to || !outDir) {
  console.error("usage: node cancel-return.mjs --orders-a file --from YYYY-MM-DD --to YYYY-MM-DD --out-dir DIR [--orders-b file --cancel-threshold n --rts-threshold n]");
  process.exit(2);
}

const ordersA = records(ordersAPath);
const ordersB = records(arg("--orders-b"));
const cancelThreshold = arg("--cancel-threshold") ? Number(arg("--cancel-threshold")) : null;
const rtsThreshold = arg("--rts-threshold") ? Number(arg("--rts-threshold")) : null;

const qc = [];
let qcFail = false;
if (ordersB.length) {
  const mapB = new Map(ordersB.map((row) => [row.order_id, row]));
  for (const row of ordersA) {
    const other = mapB.get(row.order_id);
    if (!other) {
      qc.push({ order_id: row.order_id, field: "order_id", value_a: row.order_id, value_b: "", reason: "missing_in_b" });
      qcFail = true;
      continue;
    }
    if (norm(row.status) !== norm(other.status)) {
      qc.push({ order_id: row.order_id, field: "status", value_a: row.status, value_b: other.status, reason: "status_differs" });
      qcFail = true;
    }
    if (shippedOut(row) !== shippedOut(other)) {
      qc.push({ order_id: row.order_id, field: "courier_pickup_time", value_a: row.courier_pickup_time, value_b: other.courier_pickup_time, reason: "pickup_differs" });
      qcFail = true;
    }
    if (norm(row.cancelled_by) !== norm(other.cancelled_by)) {
      qc.push({ order_id: row.order_id, field: "cancelled_by", value_a: row.cancelled_by, value_b: other.cancelled_by, reason: "cancel_party_differs" });
      qcFail = true;
    }
  }
}

const classified = ordersA.map((row) => {
  const created = inRange(row.created_date, from, to);
  const pickupInPeriod = inRange(row.courier_pickup_time, from, to);
  const shipped = shippedOut(row);
  const cancelled = isCancelled(row);
  const rtsWord = RETURN_WORDS.has(norm(row.status)) || RETURN_WORDS.has(norm(row.outcome));
  let exclude = "";
  if (rtsWord && !shipped) exclude = "excluded_not_shipped";
  if (exclude) {
    qc.push({
      order_id: row.order_id,
      field: "courier_pickup_time",
      value_a: row.status,
      value_b: "",
      reason: "status says return or failed delivery but there is no courier pickup time; excluded from the return rate",
    });
  }
  return {
    ...row,
    in_cancel_cohort: created ? "yes" : "no",
    is_cancelled: created && cancelled ? "yes" : "no",
    in_ship_cohort: pickupInPeriod && shipped ? "yes" : "no",
    is_rts: pickupInPeriod && shipped && isReturn(row) ? "yes" : "no",
    exclude_reason: exclude,
  };
});

function rollup(rows, level, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row) || "<BLANK>";
    if (!groups.has(key)) {
      groups.set(key, { created: 0, cancelled: 0, buyer: 0, seller: 0, system: 0, shipped: 0, rts: 0 });
    }
    const bucket = groups.get(key);
    if (row.in_cancel_cohort === "yes") bucket.created += 1;
    if (row.is_cancelled === "yes") {
      bucket.cancelled += 1;
      const party = norm(row.cancelled_by);
      if (party === "buyer" || party === "seller" || party === "system") bucket[party] += 1;
    }
    if (row.in_ship_cohort === "yes") bucket.shipped += 1;
    if (row.is_rts === "yes") bucket.rts += 1;
  }
  return [...groups.entries()].map(([key, bucket]) => ({
    level,
    key,
    period: `${from}:${to}`,
    orders_created: String(bucket.created),
    cancelled: String(bucket.cancelled),
    cancel_rate: rate(bucket.cancelled, bucket.created),
    cancelled_buyer: String(bucket.buyer),
    cancelled_seller: String(bucket.seller),
    cancelled_system: String(bucket.system),
    shipped_out: String(bucket.shipped),
    rts: String(bucket.rts),
    rts_rate: rate(bucket.rts, bucket.shipped),
  }));
}

const rates = [
  ...rollup(classified, "sku", (row) => row.sku),
  ...rollup(classified, "product", (row) => row.product),
  ...rollup(classified, "category", (row) => row.category),
  ...rollup(classified, "store", (row) => row.store),
  ...rollup(classified, "platform", (row) => row.platform),
  ...rollup(classified, "market", (row) => row.market),
  ...rollup(classified, "staff", (row) => row.staff),
  ...rollup(classified, "period", () => `${from}:${to}`),
];

mkdirSync(outDir, { recursive: true });
csv(join(outDir, "rates.csv"), [
  "level", "key", "period", "orders_created", "cancelled", "cancel_rate",
  "cancelled_buyer", "cancelled_seller", "cancelled_system", "shipped_out", "rts", "rts_rate",
], rates);
csv(join(outDir, "order-qc.csv"), ["order_id", "field", "value_a", "value_b", "reason"], qc);
csv(join(outDir, "classified.csv"), [
  "order_id", "sku", "created_date", "courier_pickup_time", "status", "cancelled_by", "cancel_reason",
  "in_cancel_cohort", "is_cancelled", "in_ship_cohort", "is_rts", "exclude_reason",
], classified);

const offenders = rates.filter((row) => row.level === "sku" && row.rts_rate !== "").sort((a, b) => Number(b.rts_rate) - Number(a.rts_rate));
for (const row of offenders.slice(0, 5)) {
  console.log(`top_sku ${row.key} rts_rate ${row.rts_rate} rts ${row.rts} shipped_out ${row.shipped_out} cancel_rate ${row.cancel_rate || "undefined"}`);
}
for (const row of rates.filter((item) => item.level === "store")) {
  console.log(`store ${row.key} cancel_rate ${row.cancel_rate || "undefined"} created ${row.orders_created} cancelled ${row.cancelled} rts_rate ${row.rts_rate || "undefined"} shipped_out ${row.shipped_out} rts ${row.rts}`);
  if (cancelThreshold !== null && row.cancel_rate !== "" && Number(row.cancel_rate) > cancelThreshold) {
    console.log(`ALERT cancel_rate store ${row.key} rate ${row.cancel_rate} threshold ${cancelThreshold}`);
  }
  if (rtsThreshold !== null && row.rts_rate !== "" && Number(row.rts_rate) > rtsThreshold) {
    console.log(`ALERT rts_rate store ${row.key} rate ${row.rts_rate} threshold ${rtsThreshold}`);
  }
}
console.log(`qc_rows: ${qc.length}`);
console.log(`excluded_not_shipped: ${classified.filter((row) => row.exclude_reason === "excluded_not_shipped").length}`);
console.log(qcFail ? "result: QC_FAIL" : "result: OK");
if (qcFail) process.exit(1);
