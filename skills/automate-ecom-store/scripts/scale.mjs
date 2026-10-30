#!/usr/bin/env node
/**
 * Read-only checks for a store that is already selling.
 * Prints proposals. Does not change a budget, a price, or a payout.
 *
 *   node scale.mjs --margin file
 *   node scale.mjs --ads file [--step-percent n]
 *   node scale.mjs --stock file [--cover-days n]
 *   node scale.mjs --health file [--warn-fraction 0.9] [--platform name --market CODE]
 *   node scale.mjs --expand file
 *   node scale.mjs --repeat file --as-of YYYY-MM-DD [--min-orders 2]
 *   node scale.mjs --sla file --as-of YYYY-MM-DDTHH:MM:SSZ
 *   node scale.mjs --mall file
 */

import { readFileSync } from "node:fs";
import { healthMetricKey, healthThresholds, loadRules, rulesFor } from "./policy-rules.mjs";

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
  if (value === undefined || value === "" || String(value).includes("<")) return null;
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function show(value) {
  if (value === null || !Number.isFinite(value)) return "";
  return String(Math.round(value * 10000) / 10000);
}

function configValue(key) {
  const path = arg("--config");
  if (!path) return null;
  let section = "";
  for (const raw of readFileSync(path, "utf8").split(/\n/)) {
    const line = raw.replace(/\s+#.*$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const top = line.match(/^([A-Za-z0-9_]+):\s*$/);
    if (top && !line.startsWith(" ")) {
      section = top[1];
      continue;
    }
    const pair = line.match(/^\s*([A-Za-z0-9_]+):\s*(.*)$/);
    if (!pair) continue;
    const name = section ? `${section}.${pair[1]}` : pair[1];
    if (name === key) return pair[2].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

function optionNumber(flag, configKey) {
  const fromFlag = arg(flag);
  if (fromFlag) return num(fromFlag);
  return num(configValue(configKey) || "");
}

function margin(path) {
  for (const row of records(path)) {
    const revenue = num(row.revenue);
    const priorRevenue = num(row.prior_revenue);
    const costs = ["platform_fee", "ads", "shipping", "returns_cost"].map((key) => num(row[key]));
    const priorPct = num(row.prior_margin_pct);
    if (revenue === null || revenue <= 0 || costs.some((value) => value === null) || priorRevenue === null || priorPct === null) {
      console.log(`sku ${row.sku || ""} result: MISSING_COST`);
      continue;
    }
    const profit = revenue - costs.reduce((sum, value) => sum + value, 0);
    const marginPct = profit / revenue;
    console.log(`sku ${row.sku || ""} revenue ${show(revenue)} profit ${show(profit)} margin_pct ${show(marginPct)} currency ${row.currency || ""}`);
    if (revenue > priorRevenue && marginPct < priorPct) console.log("result: ALERT");
    else console.log("result: OK");
  }
}

function ads(path) {
  const step = optionNumber("--step-percent", "ads.step_percent");
  for (const row of records(path)) {
    const roas = num(row.roas);
    const target = num(row.target_roas);
    const budget = num(row.current_budget);
    console.log(`sku ${row.sku || ""} roas ${show(roas)} target ${show(target)} budget ${show(budget)}`);
    if (roas === null || target === null) {
      console.log("result: UNSET");
      continue;
    }
    if (roas < target) {
      console.log("result: PROPOSE_PAUSE");
      continue;
    }
    if (budget === null || step === null) {
      console.log("result: PROPOSE_STEP");
      console.log("next_budget: unset");
      continue;
    }
    console.log("result: PROPOSE_STEP");
    console.log(`next_budget: ${show(budget * (1 + step / 100))}`);
  }
}

function stock(path) {
  const coverAlert = optionNumber("--cover-days", "stock.cover_days_alert");
  for (const row of records(path)) {
    const sold = num(row.units_sold);
    const days = num(row.days);
    const onHand = num(row.on_hand);
    const inbound = num(row.inbound) ?? 0;
    const lead = num(row.lead_days);
    if (sold === null || days === null || days <= 0 || onHand === null) {
      console.log(`sku ${row.sku || ""} result: MISSING`);
      continue;
    }
    const daily = sold / days;
    const cover = daily === 0 ? null : (onHand + inbound) / daily;
    const limit = lead ?? coverAlert;
    console.log(`sku ${row.sku || ""} daily ${show(daily)} days_cover ${show(cover)} on_hand ${show(onHand)}`);
    if (cover === null) {
      console.log("reorder_qty: 0");
      console.log("result: OK");
      continue;
    }
    const reorder = Math.max(0, Math.ceil((limit ?? 0) * daily - onHand - inbound));
    console.log(`reorder_qty: ${reorder}`);
    if (limit !== null && cover < limit) console.log("result: ALERT");
    else console.log("result: OK");
  }
}

function health(path) {
  const warn = optionNumber("--warn-fraction", "health.warn_fraction") ?? 0.9;
  const platform = arg("--platform");
  const market = arg("--market");
  const policy = platform && market ? healthThresholds(rulesFor(loadRules(), platform, market)) : [];
  const byMetric = new Map(policy.map((item) => [item.metric, item]));
  for (const row of records(path)) {
    const value = num(row.value);
    let threshold = num(row.threshold);
    const fromPolicy = threshold === null ? byMetric.get(healthMetricKey(row.metric)) : null;
    if (threshold === null && fromPolicy) threshold = Number(fromPolicy.max);
    const direction = (row.direction || "lower").toLowerCase();
    if (value === null) {
      console.log(`metric ${row.metric || ""} result: MISSING`);
      continue;
    }
    if (threshold === null) {
      console.log(`metric ${row.metric || ""} value ${show(value)} result: UNSET`);
      continue;
    }
    let result = "OK";
    if (direction === "higher") {
      if (value < threshold) result = "BREACH";
      else if (value < threshold * (2 - warn)) result = "EARLY";
    } else if (value >= threshold) result = "BREACH";
    else if (value >= threshold * warn) result = "EARLY";
    const cited = fromPolicy ? ` rule ${fromPolicy.id} unverified=${fromPolicy.unverified ? "yes" : "no"}` : "";
    console.log(`metric ${row.metric || ""} value ${show(value)} threshold ${show(threshold)} result: ${result}${cited}`);
  }
}

function expand(path) {
  for (const row of records(path)) {
    const price = num(row.price);
    const unit = num(row.unit_cost);
    const sourceFee = num(row.source_fee_rate);
    const destFee = num(row.dest_fee_rate);
    const shipping = num(row.shipping_net);
    const other = num(row.other_cost);
    const compliant = (row.compliant || "").toLowerCase() === "yes";
    console.log(`sku ${row.sku || ""} to ${row.dest_platform || ""} ${row.dest_market || ""}`);
    if (!compliant) {
      console.log("result: HOLD");
      continue;
    }
    if ([price, unit, sourceFee, destFee, shipping, other].some((value) => value === null) || destFee >= 1) {
      console.log("result: MISSING_COST");
      continue;
    }
    const contribution = price - unit - price * sourceFee - shipping - other;
    if (contribution <= 0) {
      console.log("result: LOSS");
      continue;
    }
    const destPrice = (contribution + unit + shipping + other) / (1 - destFee);
    console.log(`propose_price: ${show(destPrice)} currency ${row.currency || ""}`);
    console.log("result: PROPOSE_PRICE");
  }
}

function daysBetween(from, to) {
  const left = Date.parse(`${from}T00:00:00Z`);
  const right = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(left) || Number.isNaN(right)) return null;
  return Math.floor((right - left) / 86400000);
}

function repeat(path) {
  const asOf = arg("--as-of");
  const minimum = optionNumber("--min-orders", "repeat.min_orders") ?? 2;
  if (!asOf) {
    console.error("--as-of is required");
    process.exit(2);
  }
  for (const row of records(path)) {
    const orders = num(row.orders);
    const cycle = num(row.cycle_days);
    const age = daysBetween(row.last_order_date, asOf);
    if (orders === null || age === null) {
      console.log(`buyer ${row.buyer_key || ""} result: MISSING`);
      continue;
    }
    const segment = orders >= minimum ? "repeat" : "once";
    const due = segment === "repeat" && cycle !== null && age >= cycle;
    console.log(`buyer ${row.buyer_key || ""} segment ${segment} days_since ${age} follower ${(row.follower || "").toLowerCase() === "yes" ? "yes" : "no"}`);
    console.log(due ? "result: REMIND" : "result: OK");
  }
}

function sla(path) {
  const asOf = Date.parse(arg("--as-of"));
  if (Number.isNaN(asOf)) {
    console.error("--as-of is required");
    process.exit(2);
  }
  for (const row of records(path)) {
    const opened = Date.parse(row.opened_at);
    const dueHours = num(row.due_hours);
    if (Number.isNaN(opened) || dueHours === null) {
      console.log(`task ${row.task_id || ""} result: MISSING`);
      continue;
    }
    const open = (row.status || "").toLowerCase() === "open";
    const overdue = open && asOf > opened + dueHours * 3600000;
    console.log(`task ${row.task_id || ""} assignee ${row.assignee || ""} type ${row.type || ""}`);
    console.log(overdue ? "result: OVERDUE" : "result: OK");
  }
}

function mall(path) {
  const groups = new Map();
  for (const row of records(path)) {
    const program = row.program || "";
    const bucket = groups.get(program) || [];
    bucket.push(row);
    groups.set(program, bucket);
  }
  for (const [program, rows] of groups) {
    const required = rows.filter((row) => (row.required || "").toLowerCase() !== "no");
    const unmet = required.filter((row) => (row.met || "").toLowerCase() === "no");
    const unknown = required.filter((row) => (row.met || "").toLowerCase() !== "yes" && (row.met || "").toLowerCase() !== "no");
    let result = "READY";
    if (unmet.length) result = "NOT_READY";
    else if (unknown.length) result = "HOLD";
    console.log(`program ${program} result: ${result}`);
  }
}

const modes = ["--margin", "--ads", "--stock", "--health", "--expand", "--repeat", "--sla", "--mall"];
const chosen = modes.filter((flag) => process.argv.includes(flag));
if (chosen.length !== 1) {
  console.error(`usage: node scale.mjs (${modes.join(" | ")}) file`);
  process.exit(2);
}
const file = arg(chosen[0]);
if (!file) {
  console.error("a csv path is required");
  process.exit(2);
}
if (chosen[0] === "--margin") margin(file);
else if (chosen[0] === "--ads") ads(file);
else if (chosen[0] === "--stock") stock(file);
else if (chosen[0] === "--health") health(file);
else if (chosen[0] === "--expand") expand(file);
else if (chosen[0] === "--repeat") repeat(file);
else if (chosen[0] === "--sla") sla(file);
else mall(file);
console.log("done");
