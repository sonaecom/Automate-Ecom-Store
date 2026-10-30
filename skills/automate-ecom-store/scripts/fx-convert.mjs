#!/usr/bin/env node
/**
 * Convert sales, ads, and wallet amounts into one base currency.
 * Keeps the native amount, the rate, the rate date or month, and the mode.
 * Does not invent a rate and does not average two rates that disagree.
 *
 *   node fx-convert.mjs --amounts file --out-dir DIR \
 *     [--base VND] [--mode custom|market] \
 *     [--market-rates file] [--market-rates-b file] \
 *     [--custom-rates file] [--custom-rates-b file] \
 *     [--previous file] [--import-json file] [--fetch]
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function has(name) {
  return process.argv.includes(name);
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

function formatNum(value, places) {
  if (!Number.isFinite(value)) return "";
  const fixed = value.toFixed(places);
  return fixed.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
}

function money(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function sameRate(a, b) {
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= 1e-8 * scale;
}

function monthOf(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.slice(0, 7) : "";
}

function blankQuote() {
  return {
    rate: "",
    rateDate: "",
    rateMonth: "",
    mode: "",
    fallback: "no_rate",
    source: "",
    amount: "",
    qc: "NO_RATE",
  };
}

function identityQuote(amount, date, month) {
  return {
    rate: "1",
    rateDate: date,
    rateMonth: month,
    mode: "identity",
    fallback: "none",
    source: "identity",
    amount: formatNum(amount, 4),
    qc: "OK",
  };
}

function quoteFrom(hit, native, mode) {
  if (!hit) return blankQuote();
  if (hit.qc === "RATE_MISMATCH") {
    return {
      rate: "",
      rateDate: hit.rateDate || "",
      rateMonth: hit.rateMonth || "",
      mode: "",
      fallback: "rate_mismatch",
      source: hit.source || "",
      amount: "",
      qc: "RATE_MISMATCH",
    };
  }
  const stored = Number(formatNum(hit.rate, 8));
  const amount = Number(formatNum(native * stored, 4));
  const drift = Math.abs(native * stored - amount);
  return {
    rate: formatNum(stored, 8),
    rateDate: hit.rateDate || "",
    rateMonth: hit.rateMonth || "",
    mode,
    fallback: hit.fallback,
    source: hit.source || "",
    amount: formatNum(amount, 4),
    qc: drift < 0.00005 ? "OK" : "QC_FAIL",
  };
}

function indexRates(rows, keyFn, rateFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    const rate = rateFn(row);
    if (!key || rate === null || rate <= 0) continue;
    const current = map.get(key);
    if (!current) {
      map.set(key, { rate, source: row.source || "", mismatch: false });
      continue;
    }
    if (!sameRate(current.rate, rate)) current.mismatch = true;
  }
  return map;
}

function mergeIndexes(left, right) {
  const map = new Map(left);
  for (const [key, value] of right) {
    const current = map.get(key);
    if (!current) {
      map.set(key, { ...value });
      continue;
    }
    if (current.mismatch || value.mismatch || !sameRate(current.rate, value.rate)) {
      map.set(key, { rate: current.rate, source: current.source, mismatch: true });
    }
  }
  return map;
}

function latestKey(keys, currency, base, end, kind) {
  let best = "";
  for (const key of keys) {
    const [stamp, code, rateBase] = key.split("|");
    if (code !== currency || rateBase !== base) continue;
    if (stamp >= end) continue;
    if (stamp > best) best = stamp;
  }
  return best ? `${best}|${currency}|${base}` : "";
}

function take(map, key, stampName) {
  if (!key || !map.has(key)) return null;
  const [stamp] = key.split("|");
  const row = map.get(key);
  if (row.mismatch) {
    return { qc: "RATE_MISMATCH", [stampName]: stamp, source: row.source || "" };
  }
  return { rate: row.rate, [stampName]: stamp, source: row.source || "", qc: "OK" };
}

function marketHit(map, currency, date, base) {
  const exactKey = `${date}|${currency}|${base}`;
  const exact = take(map, exactKey, "rateDate");
  if (exact) return exact.qc === "OK" ? { ...exact, fallback: "none" } : exact;
  const priorKey = latestKey(map.keys(), currency, base, date, "date");
  const prior = take(map, priorKey, "rateDate");
  if (!prior) return null;
  if (prior.qc !== "OK") return prior;
  return { ...prior, fallback: "market_on_or_before" };
}

function customHit(map, currency, month, base) {
  const exact = take(map, `${month}|${currency}|${base}`, "rateMonth");
  if (exact) return exact.qc === "OK" ? { ...exact, fallback: "none" } : exact;
  const priorKey = latestKey(map.keys(), currency, base, month, "month");
  const prior = take(map, priorKey, "rateMonth");
  if (!prior) return null;
  if (prior.qc !== "OK") return prior;
  return { ...prior, fallback: "earlier_custom_month" };
}

function monthlyMarketHit(map, currency, month, base) {
  const exact = take(map, `${month}|${currency}|${base}`, "rateMonth");
  if (!exact) return null;
  if (exact.qc !== "OK") return exact;
  return { ...exact, fallback: "monthly_market" };
}

function resolveMarket(daily, monthly, currency, date, month, base) {
  const dailyHit = marketHit(daily, currency, date, base);
  if (dailyHit) return dailyHit;
  return monthlyMarketHit(monthly, currency, month, base);
}

function resolveCustom(daily, monthly, custom, currency, date, month, base) {
  const owned = customHit(custom, currency, month, base);
  if (owned) return owned;
  const dailyHit = marketHit(daily, currency, date, base);
  if (dailyHit) {
    return {
      ...dailyHit,
      fallback: dailyHit.fallback === "none" ? "market_for_missing_custom" : dailyHit.fallback,
    };
  }
  return monthlyMarketHit(monthly, currency, month, base);
}

function applyQuote(native, hit, mode) {
  if (hit && hit.qc === "RATE_MISMATCH") return quoteFrom(hit, native, mode);
  return quoteFrom(hit, native, mode);
}

const amountsPath = arg("--amounts");
const outDir = arg("--out-dir");
const base = (arg("--base") || "VND").toUpperCase();
const mode = (arg("--mode") || "custom").toLowerCase();

if (!amountsPath || !outDir || (mode !== "custom" && mode !== "market")) {
  console.error("usage: node fx-convert.mjs --amounts file --out-dir DIR [--base VND] [--mode custom|market] [--market-rates file] [--market-rates-b file] [--custom-rates file] [--custom-rates-b file] [--previous file] [--import-json file] [--fetch]");
  process.exit(2);
}

function marketRows(path, rateBase) {
  return records(path)
    .map((row) => ({
      date: row.date,
      currency: (row.currency || "").toUpperCase(),
      base: (row.base || rateBase).toUpperCase(),
      rate: money(row.rate),
      source: row.source || "",
    }))
    .filter((row) => row.base === rateBase);
}

let ignoredFxRows = 0;
const customCache = new Map();

function customRows(path, rateBase) {
  const cacheKey = `${path}|${rateBase}`;
  if (customCache.has(cacheKey)) return customCache.get(cacheKey);
  const parsed = records(path).flatMap((row) => {
    const modeName = (row.mode || "").toLowerCase();
    const currency = (row.currency || "").toUpperCase();
    if (!row.month && !currency) return [];
    if (modeName !== "custom" && modeName !== "market") {
      ignoredFxRows += 1;
      return [];
    }
    return [{
      month: row.month,
      currency,
      base: rateBase,
      rate: money(row.rate),
      mode: modeName,
      source: "settings_fx",
    }];
  });
  customCache.set(cacheKey, parsed);
  return parsed;
}

function ratesFromApi(json, rateBase, wanted) {
  const bucket = json[rateBase.toLowerCase()];
  const rateDate = typeof json.date === "string" ? json.date : "";
  if (!bucket || typeof bucket !== "object" || !/^\d{4}-\d{2}-\d{2}$/.test(rateDate)) return [];
  const rows = [];
  for (const [code, raw] of Object.entries(bucket)) {
    const currency = code.toUpperCase();
    if (currency === rateBase) continue;
    if (wanted.size && !wanted.has(currency)) continue;
    const perBase = Number(raw);
    if (!Number.isFinite(perBase) || perBase <= 0) continue;
    rows.push({
      date: rateDate,
      currency,
      base: rateBase,
      rate: 1 / perBase,
      source: "currency-api",
    });
  }
  return rows;
}

let imported = [];
const importPath = arg("--import-json");
if (importPath) {
  const json = JSON.parse(readFileSync(importPath, "utf8"));
  if (!json.date && arg("--import-date")) json.date = arg("--import-date");
  imported = ratesFromApi(json, base, new Set());
}

const amounts = records(amountsPath);
const wanted = new Set(
  amounts
    .map((row) => (row.currency || "").toUpperCase())
    .filter((code) => code && code !== base),
);

const fetched = [];
if (has("--fetch")) {
  const dates = [...new Set(amounts.map((row) => row.date).filter((date) => monthOf(date)))].sort();
  for (const date of dates) {
    const urls = [
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${base.toLowerCase()}.min.json`,
      `https://${date}.currency-api.pages.dev/v1/currencies/${base.toLowerCase()}.min.json`,
    ];
    let loaded = null;
    for (const url of urls) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
        if (!response.ok) continue;
        loaded = await response.json();
        break;
      } catch {
        loaded = null;
      }
    }
    if (!loaded) {
      console.log(`fetch_failed: ${date}`);
      continue;
    }
    const rows = ratesFromApi(loaded, base, wanted);
    fetched.push(...rows);
    console.log(`fetched: ${loaded.date || date} rates ${rows.length}`);
  }
}

function buildSide(rows) {
  return indexRates(rows, (row) => `${row.date}|${row.currency}|${row.base}`, (row) => row.rate);
}

const dailyA = buildSide(marketRows(arg("--market-rates"), base).concat(imported));
for (const row of fetched) {
  const key = `${row.date}|${row.currency}|${row.base}`;
  if (!dailyA.has(key)) dailyA.set(key, { rate: row.rate, source: row.source, mismatch: false });
}
const dailyB = buildSide(marketRows(arg("--market-rates-b"), base));
const dailyMap = arg("--market-rates-b") ? mergeIndexes(dailyA, dailyB) : dailyA;

const customA = indexRates(
  customRows(arg("--custom-rates"), base).filter((row) => row.mode === "custom"),
  (row) => `${row.month}|${row.currency}|${row.base}`,
  (row) => row.rate,
);
const customB = indexRates(
  customRows(arg("--custom-rates-b"), base).filter((row) => row.mode === "custom"),
  (row) => `${row.month}|${row.currency}|${row.base}`,
  (row) => row.rate,
);
const customMap = arg("--custom-rates-b") ? mergeIndexes(customA, customB) : customA;

const monthlyA = indexRates(
  customRows(arg("--custom-rates"), base).filter((row) => row.mode === "market"),
  (row) => `${row.month}|${row.currency}|${row.base}`,
  (row) => row.rate,
);
const monthlyB = indexRates(
  customRows(arg("--custom-rates-b"), base).filter((row) => row.mode === "market"),
  (row) => `${row.month}|${row.currency}|${row.base}`,
  (row) => row.rate,
);
const monthlyMap = arg("--custom-rates-b") ? mergeIndexes(monthlyA, monthlyB) : monthlyA;

const facts = [];
for (const row of amounts) {
  const date = row.date || "";
  const month = monthOf(date);
  const currency = (row.currency || "").toUpperCase();
  const native = money(row.native_amount);
  const baseRow = {
    date,
    store: row.store || "",
    platform: row.platform || "",
    market: row.market || "",
    stream: row.stream || "",
    native_amount: row.native_amount || "",
    currency,
    base_currency: base,
    source: row.source || "",
    read_time: row.read_time || "",
  };
  if (!month || native === null) {
    const empty = blankQuote();
    empty.qc = !month ? "BAD_DATE" : "BAD_AMOUNT";
    empty.fallback = empty.qc.toLowerCase();
    facts.push(fill(baseRow, empty, empty, empty));
    console.log(`qc: ${date} ${currency} ${row.stream || ""} ${empty.qc}`);
    continue;
  }
  if (currency === base) {
    const same = identityQuote(native, date, month);
    facts.push(fill(baseRow, same, same, same));
    continue;
  }
  const marketQuote = applyQuote(native, resolveMarket(dailyMap, monthlyMap, currency, date, month, base), "market");
  const customQuote = applyQuote(native, resolveCustom(dailyMap, monthlyMap, customMap, currency, date, month, base), "custom");
  if (customQuote.mode === "market" || customQuote.fallback === "market_for_missing_custom" || customQuote.fallback === "market_on_or_before" || customQuote.fallback === "monthly_market") {
    customQuote.mode = customQuote.qc === "OK" ? "market" : customQuote.mode;
  }
  const applied = mode === "market" ? marketQuote : customQuote;
  facts.push(fill(baseRow, marketQuote, customQuote, applied));
  if (applied.qc !== "OK") console.log(`qc: ${date} ${currency} ${row.stream || ""} ${applied.qc} ${applied.fallback}`);
  if (marketQuote.qc === "RATE_MISMATCH") console.log(`rate_mismatch: market ${date} ${currency}`);
  if (customQuote.qc === "RATE_MISMATCH") console.log(`rate_mismatch: custom ${month} ${currency}`);
}

function fill(baseRow, marketQuote, customQuote, applied) {
  return {
    ...baseRow,
    market_rate: marketQuote.rate,
    market_rate_date: marketQuote.rateDate,
    market_rate_month: marketQuote.rateMonth,
    market_fallback: marketQuote.fallback,
    amount_market: marketQuote.amount,
    custom_rate: customQuote.rate,
    custom_rate_date: customQuote.rateDate,
    custom_rate_month: customQuote.rateMonth,
    custom_fallback: customQuote.fallback,
    amount_custom: customQuote.amount,
    rate_source: applied.source,
    applied_mode: applied.mode,
    applied_rate: applied.rate,
    applied_rate_date: applied.rateDate,
    applied_rate_month: applied.rateMonth,
    applied_fallback: applied.fallback,
    amount_base: applied.amount,
    qc: applied.qc,
  };
}

const used = new Map();
for (const row of facts) {
  if (row.qc !== "OK" || row.applied_rate === "") continue;
  const key = [row.applied_mode, row.applied_rate_date, row.applied_rate_month, row.currency, row.applied_rate, row.applied_fallback].join("|");
  if (used.has(key)) continue;
  used.set(key, {
    rate_date: row.applied_rate_date,
    rate_month: row.applied_rate_month,
    currency: row.currency,
    base,
    rate: row.applied_rate,
    mode: row.applied_mode,
    fallback: row.applied_fallback,
    source: row.rate_source || "",
  });
}

const totals = new Map();
for (const row of facts) {
  if (row.qc !== "OK") continue;
  const native = money(row.native_amount);
  const baseAmount = money(row.amount_base);
  const keys = [
    ["stream", row.stream, row.currency],
    ["market", row.market, row.currency],
    ["platform", row.platform, row.currency],
    ["store", row.store, row.currency],
  ];
  for (const [level, key, currency] of keys) {
    const id = `${level}|${key}|${currency}`;
    const bucket = totals.get(id) || { level, key, currency, native_amount: 0, amount_base: 0, rows: 0 };
    bucket.native_amount += native;
    bucket.amount_base += baseAmount;
    bucket.rows += 1;
    totals.set(id, bucket);
  }
}

const previous = records(arg("--previous"));
const previousRates = new Map();
for (const row of previous) {
  const month = monthOf(row.date || "") || row.month || "";
  const currency = (row.currency || "").toUpperCase();
  const rate = money(row.custom_rate);
  if (!month || !currency || rate === null) continue;
  previousRates.set(`${month}|${currency}`, rate);
}
const seenPairs = new Set();
for (const row of facts) {
  const pair = `${monthOf(row.date)}|${row.currency}`;
  if (seenPairs.has(pair) || !previousRates.has(pair)) continue;
  seenPairs.add(pair);
  const next = money(row.custom_rate);
  const old = previousRates.get(pair);
  if (next === null || !sameRate(old, next)) console.log(`recomputed: ${pair.replace("|", " ")}`);
}

mkdirSync(outDir, { recursive: true });
const factHeader = [
  "date", "store", "platform", "market", "stream", "native_amount", "currency", "base_currency",
  "market_rate", "market_rate_date", "market_rate_month", "market_fallback", "amount_market",
  "custom_rate", "custom_rate_date", "custom_rate_month", "custom_fallback", "amount_custom",
  "applied_mode", "applied_rate", "applied_rate_date", "applied_rate_month", "applied_fallback", "amount_base",
  "qc", "source", "read_time",
];
writeCsv(join(outDir, "converted.csv"), factHeader, facts);
writeCsv(join(outDir, "rates-used.csv"), ["rate_date", "rate_month", "currency", "base", "rate", "mode", "fallback", "source"], [...used.values()]);
writeCsv(
  join(outDir, "totals.csv"),
  ["level", "key", "currency", "native_amount", "amount_base", "rows"],
  [...totals.values()].map((row) => ({
    ...row,
    native_amount: formatNum(row.native_amount, 4),
    amount_base: formatNum(row.amount_base, 4),
    rows: String(row.rows),
  })),
);
writeCsv(
  join(outDir, "market-ledger.csv"),
  ["date", "currency", "base", "rate", "source"],
  [...dailyMap.entries()].filter(([, row]) => !row.mismatch).map(([key, row]) => {
    const [date, currency, rateBase] = key.split("|");
    return { date, currency, base: rateBase, rate: formatNum(row.rate, 8), source: row.source };
  }),
);

const bad = facts.filter((row) => row.qc !== "OK");
if (ignoredFxRows) console.log(`fx_row_ignored: ${ignoredFxRows}`);
console.log(`base: ${base}`);
console.log(`view: ${mode}`);
console.log(`rows: ${facts.length}`);
console.log(`no_rate: ${facts.filter((row) => row.qc === "NO_RATE").length}`);
const mismatches = facts.filter((row) => row.market_fallback === "rate_mismatch" || row.custom_fallback === "rate_mismatch");
console.log(`rate_mismatch: ${mismatches.length}`);
console.log("recompute: full");
console.log(bad.length || mismatches.length ? "result: INCOMPLETE" : "result: OK");
if (bad.length || mismatches.length) process.exit(1);
