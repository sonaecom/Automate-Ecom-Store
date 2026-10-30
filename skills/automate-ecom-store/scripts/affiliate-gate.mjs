#!/usr/bin/env node
/**
 * Apply affiliate rules from policies/rules.yaml before an invite.
 * Does not open a seller site and does not send an invite.
 *
 *   node affiliate-gate.mjs --platform shopee --market MY --offer targeted --store-wide no
 *   node affiliate-gate.mjs --platform tiktokshop --market PH --store-rating 2 --counterfeit-60d 0 --products file
 */

import { readFileSync } from "node:fs";
import { loadRules, rulesFor } from "./policy-rules.mjs";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function num(value) {
  if (value === undefined || value === "" || String(value).includes("<")) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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

const platform = arg("--platform");
const market = arg("--market");
if (!platform || !market) {
  console.error("usage: node affiliate-gate.mjs --platform name --market CODE [--offer targeted|store-wide] [--store-wide yes|no] [--commission n] [--product-line general|el] [--store-rating n] [--counterfeit-60d n] [--deactivated yes|no] [--products file]");
  process.exit(2);
}

const rules = rulesFor(loadRules(), platform, market);
const affiliate = rules.filter((rule) => rule.category === "affiliate");
console.log(`platform: ${platform}`);
console.log(`market: ${market}`);
console.log(`affiliate_rules: ${affiliate.length}`);
console.log("gap vouchers: not captured");
console.log("gap invite_limits: not captured");
if (platform.toLowerCase() === "lazada") console.log("gap lazada_coverage: incomplete");
if (platform.toLowerCase().startsWith("tiktok")) console.log("marker: applicability to PH/MY/ID unconfirmed");

const blocks = [];
const warns = [];
function block(rule, detail) {
  blocks.push(rule.id);
  console.log(`BLOCK ${rule.id} ${detail}`);
}
function warn(rule, detail) {
  warns.push(rule.id);
  console.log(`WARN ${rule.id} ${detail}`);
}

const offer = (arg("--offer") || "").toLowerCase();
const storeWide = (arg("--store-wide") || "").toLowerCase();
const commission = num(arg("--commission"));
const productLine = (arg("--product-line") || "general").toLowerCase();
const storeRule = affiliate.find((rule) => /store-wide AMS campaign/i.test(rule.rule || ""));
if (storeRule && offer === "targeted" && storeWide !== "yes") {
  block(storeRule, "targeted offer needs an ongoing store-wide campaign");
}
const rateRule = affiliate.find((rule) => /at least 3%/i.test(rule.rule || ""));
if (rateRule && commission !== null) {
  const minimum = productLine === "el" ? 0.5 : 3;
  if (commission < minimum) block(rateRule, `commission ${commission} minimum ${minimum}`);
}
const phRate = affiliate.find((rule) => /at least 1%/i.test(rule.rule || ""));
if (phRate && commission !== null && commission < 1) warn(phRate, `commission ${commission} minimum 1`);

const rating = num(arg("--store-rating"));
const counterfeit = num(arg("--counterfeit-60d"));
const deactivated = (arg("--deactivated") || "").toLowerCase() === "yes";
const useRule = affiliate.find((rule) => /Store Rating ≥ 2/i.test(rule.rule || "") && /60 days/i.test(rule.rule || ""));
const banRule = affiliate.find((rule) => /Store Rating < 1\.5/i.test(rule.rule || ""));
if (useRule || banRule) {
  if (deactivated && banRule) block(banRule, "shop deactivated");
  else if (counterfeit !== null && counterfeit >= 3 && banRule) block(banRule, `counterfeit_60d ${counterfeit}`);
  else if (rating !== null && rating < 1.5 && banRule) block(banRule, `store_rating ${rating}`);
  else if (useRule && ((rating !== null && rating < 2) || (counterfeit !== null && counterfeit > 0))) {
    block(useRule, `store_rating ${rating === null ? "" : rating} counterfeit_60d ${counterfeit === null ? "" : counterfeit}`);
  }
}

const productRule = affiliate.find((rule) => /negative review rate/i.test(rule.rule || ""));
const productsPath = arg("--products");
let eligible = 0;
let skipped = 0;
if (productRule && productsPath) {
  for (const row of records(productsPath)) {
    const group = (row.category_group || "").toLowerCase();
    const negative = num(row.negative_review_rate);
    const returns = num(row.seller_fault_return_rate);
    const fmcg = /fmcg|lifestyle/.test(group);
    const negMax = fmcg ? 0.6 : 1;
    const returnMax = fmcg ? 1.8 : 2;
    if (!group || negative === null || returns === null) {
      skipped += 1;
      console.log(`SKIP ${row.sku || ""} ${productRule.id} missing_metric`);
      continue;
    }
    if (negative >= negMax || returns >= returnMax) {
      skipped += 1;
      console.log(`SKIP ${row.sku || ""} ${productRule.id} negative ${negative} max ${negMax} returns ${returns} max ${returnMax}`);
      continue;
    }
    eligible += 1;
    console.log(`ALLOW ${row.sku || ""} ${productRule.id}`);
  }
}

const cps = affiliate.find((rule) => /Sponsored Affiliate is CPS/i.test(rule.rule || ""));
if (cps) warn(cps, "commission after delivery only");

console.log(`eligible: ${eligible}`);
console.log(`skipped: ${skipped}`);
if (blocks.length) {
  console.log("result: BLOCK");
  process.exit(1);
}
if (productsPath && eligible === 0 && skipped > 0) {
  console.log("result: SKIP_ALL");
  process.exit(1);
}
console.log(warns.length ? "result: WARN" : "result: OK");
