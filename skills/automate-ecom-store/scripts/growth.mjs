#!/usr/bin/env node
/**
 * Score a new store, name the funnel bottleneck, pick hero SKUs,
 * and compute break-even. Does not change a listing, a price, or a budget.
 *
 *   node growth.mjs --scorecard file
 *   node growth.mjs --funnel file
 *   node growth.mjs --hero file
 *   node growth.mjs --break-even file
 *   node growth.mjs --ab file
 */

import { readFileSync } from "node:fs";

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

function num(value) {
  if (value === undefined || value === "") return null;
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function rate(part, whole) {
  if (part === null || whole === null || whole === 0) return null;
  return part / whole;
}

function show(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  return String(Math.round(value * 10000) / 10000);
}

function scorecard(path) {
  const ranked = records(path).flatMap((row) => {
    const ours = num(row.ours);
    const competitor = num(row.competitor);
    const impact = num(row.impact);
    const effort = num(row.effort);
    const direction = (row.direction || "higher").toLowerCase();
    if (ours === null || competitor === null || impact === null || effort === null) return [];
    const behind = direction === "lower" ? ours - competitor : competitor - ours;
    if (behind <= 0) return [];
    return [{ metric: row.metric, behind, impact, effort, fix: row.fix || "" }];
  }).sort((a, b) => b.impact - a.impact || a.effort - b.effort || b.behind - a.behind);
  ranked.slice(0, 5).forEach((row, index) => {
    console.log(`rank ${index + 1} metric ${row.metric} gap ${show(row.behind)} impact ${row.impact} effort ${row.effort} fix ${row.fix}`);
  });
  console.log(`fixes: ${Math.min(5, ranked.length)}`);
  console.log("result: OK");
}

function funnel(path) {
  for (const row of records(path)) {
    const impressions = num(row.impressions);
    const clicks = num(row.clicks);
    const atc = num(row.add_to_cart);
    const orders = num(row.orders);
    const ctr = rate(clicks, impressions);
    const atcRate = rate(atc, clicks);
    const cvr = rate(orders, atc);
    const steps = [
      { name: "impressions", value: impressions, bench: num(row.bench_impressions), playbook: "category_and_keywords" },
      { name: "clicks", value: ctr, bench: num(row.bench_ctr), playbook: "cover_and_title" },
      { name: "add_to_cart", value: atcRate, bench: num(row.bench_atc), playbook: "price_variation_shipping" },
      { name: "orders", value: cvr, bench: num(row.bench_cvr), playbook: "stock_and_checkout" },
    ];
    const withBench = steps.filter((step) => step.value !== null && step.bench !== null && step.bench > 0);
    let bottleneck = null;
    let basis = "steepest_step";
    if (withBench.length) {
      basis = "below_benchmark";
      bottleneck = withBench.slice().sort((a, b) => (a.value / a.bench) - (b.value / b.bench))[0];
    } else {
      const rates = steps.filter((step) => step.name !== "impressions" && step.value !== null);
      bottleneck = rates.slice().sort((a, b) => a.value - b.value)[0] || null;
    }
    console.log(`store ${row.store || ""} ctr ${show(ctr)} atc_rate ${show(atcRate)} cvr ${show(cvr)}`);
    if (!bottleneck) {
      console.log("bottleneck: undefined");
      continue;
    }
    console.log(`bottleneck: ${bottleneck.name}`);
    console.log(`basis: ${basis}`);
    console.log(`playbook: ${bottleneck.playbook}`);
  }
  console.log("result: OK");
}

function hero(path) {
  const eligible = records(path).flatMap((row) => {
    const margin = num(row.margin_pct);
    const stock = num(row.stock);
    const orders = num(row.orders) ?? 0;
    if ((row.compliant || "").toLowerCase() !== "yes") return [];
    if ((row.photo_ready || "").toLowerCase() !== "yes") return [];
    if (margin === null || margin <= 0 || stock === null || stock <= 0) return [];
    return [{ sku: row.sku, name: row.name || row.sku, margin, stock, orders, score: margin + Math.min(orders, 50) }];
  }).sort((a, b) => b.score - a.score);
  eligible.slice(0, 3).forEach((row, index) => {
    console.log(`hero ${index + 1} sku ${row.sku} margin_pct ${row.margin} stock ${row.stock} orders ${row.orders}`);
  });
  console.log(`heroes: ${Math.min(3, eligible.length)}`);
  console.log(eligible.length ? "result: OK" : "result: NONE");
  if (!eligible.length) process.exit(1);
}

function money(path) {
  for (const row of records(path)) {
    const price = num(row.price);
    const costs = ["unit_cost", "platform_fee", "shipping_net", "other_cost"].map((key) => num(row[key]));
    if (price === null || costs.some((value) => value === null)) {
      console.log(`sku ${row.sku || ""} result: MISSING_COST`);
      continue;
    }
    const contribution = price - costs.reduce((sum, value) => sum + value, 0);
    console.log(`sku ${row.sku || ""} price ${price} contribution ${contribution} currency ${row.currency || ""}`);
    if (contribution <= 0) {
      console.log("result: LOSS");
      continue;
    }
    console.log(`max_ads ${contribution}`);
    console.log(`breakeven_roas ${show(price / contribution)}`);
    console.log("result: OK");
  }
}

function ab(path) {
  for (const row of records(path)) {
    const beforeImp = num(row.before_impressions);
    const beforeOrders = num(row.before_orders);
    const afterImp = num(row.after_impressions);
    const afterOrders = num(row.after_orders);
    const minimum = num(row.min_orders);
    const beforeRate = rate(beforeOrders, beforeImp);
    const afterRate = rate(afterOrders, afterImp);
    let result = "INCONCLUSIVE";
    if (beforeRate !== null && afterRate !== null && minimum !== null && beforeOrders >= minimum && afterOrders >= minimum) {
      result = afterRate > beforeRate ? "WIN" : "LOSS";
    }
    console.log(`test ${row.test_id || ""} variable ${row.variable || ""} before_rate ${show(beforeRate)} after_rate ${show(afterRate)} result: ${result}`);
  }
}

const scorecardPath = arg("--scorecard");
const funnelPath = arg("--funnel");
const heroPath = arg("--hero");
const breakEvenPath = arg("--break-even");
const abPath = arg("--ab");
const chosen = [scorecardPath, funnelPath, heroPath, breakEvenPath, abPath].filter(Boolean);
if (chosen.length !== 1) {
  console.error("usage: node growth.mjs (--scorecard | --funnel | --hero | --break-even | --ab) file");
  process.exit(2);
}
if (scorecardPath) scorecard(scorecardPath);
else if (funnelPath) funnel(funnelPath);
else if (heroPath) hero(heroPath);
else if (breakEvenPath) money(breakEvenPath);
else ab(abPath);
