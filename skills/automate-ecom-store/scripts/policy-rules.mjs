/**
 * Load the single policy list via core/policy.
 * This module does not fetch a page and does not change a seller setting.
 */

import { readFileSync } from "node:fs";
import { findForbidden } from "./review-phrases.mjs";
import { RULES_PATH } from "../core/policy/index.mjs";

const rulesPath = RULES_PATH;

export function canonicalPlatform(value) {
  const name = String(value || "").toLowerCase().replace(/[\s-]+/g, "");
  if (name === "tiktok_shop" || name === "tiktokshop") return "tiktokshop";
  return name;
}

function unquote(value) {
  const text = value.trim();
  if (text.length >= 2 && text[0] === text[text.length - 1] && (text[0] === "'" || text[0] === '"')) {
    return text.slice(1, -1).replace(/''/g, "'");
  }
  return text;
}

export function parseRules(text) {
  const rules = [];
  let current = null;
  for (const line of text.split(/\n/)) {
    const id = line.match(/^- id:\s*(.+)$/);
    if (id) {
      if (current) rules.push(current);
      current = { id: id[1].trim() };
      continue;
    }
    if (!current) continue;
    const field = line.match(/^  ([a-z_]+):\s*(.*)$/);
    if (!field) continue;
    current[field[1]] = unquote(field[2]);
  }
  if (current) rules.push(current);
  return rules;
}

export function loadRules() {
  return parseRules(readFileSync(rulesPath, "utf8"));
}

export function rulesFor(rules, platform, market) {
  const wantedPlatform = canonicalPlatform(platform);
  const wantedMarket = String(market || "").toLowerCase();
  return rules.filter((rule) => canonicalPlatform(rule.platform) === wantedPlatform && String(rule.market || "").toLowerCase() === wantedMarket);
}

export function ruleUnverified(rule) {
  const market = String(rule.market || "").toLowerCase();
  const url = rule.source_url || "";
  return market !== "sg" && /lazada\.sg/i.test(url);
}

function leadDays(rule) {
  const blob = `${rule.rule || ""} ${rule.threshold || ""}`;
  if (!/lead time|weeks?/i.test(blob)) return "";
  const paren = blob.match(/\((\d+)\)\s*weeks?/i);
  if (paren) return String(Number(paren[1]) * 7);
  const digits = blob.match(/(\d+)\s*weeks?/i);
  if (digits) return String(Number(digits[1]) * 7);
  return "";
}

export function healthThresholds(rules) {
  const out = [];
  for (const rule of rules) {
    const blob = `${rule.rule || ""} ${rule.threshold || ""}`;
    const base = {
      id: rule.id,
      action: rule.action || "warn",
      source_url: rule.source_url || "",
      unverified: ruleUnverified(rule),
      direction: "lower",
    };
    if (rule.category === "fulfilment" && /late shipment|\bLSR\b/i.test(rule.rule || "")) {
      const pct = blob.match(/below\s+(\d+(?:\.\d+)?)\s*%/i);
      if (pct) out.push({ ...base, metric: "late_shipment_rate", max: pct[1] });
    }
    if (rule.category === "fulfilment" && /non-fulfilment|non fulfilment|seller-fault cancellation|seller cancellations/i.test(rule.rule || "")) {
      const pct = blob.match(/below\s+(\d+(?:\.\d+)?)\s*%/i);
      if (pct) {
        out.push({ ...base, metric: "cancellation_rate", max: pct[1] });
        out.push({ ...base, metric: "non_fulfilment_rate", max: pct[1] });
      }
    }
    const hours = (rule.rule || "").match(/within\s+(\d+)\s*hours/i);
    if (rule.category === "chat" && hours) {
      out.push({ ...base, metric: "chat_reply_hours", max: hours[1] });
    }
    if (rule.category === "penalty" && /deactivation/i.test(blob)) {
      const points = (rule.threshold || "").match(/(\d+)\s*points/i) || blob.match(/(\d+)\s+non-compliance points/i);
      if (points) out.push({ ...base, metric: "penalty_points", max: points[1] });
    }
  }
  return out;
}

export function healthMetricKey(name) {
  const key = String(name || "").toLowerCase().replace(/[\s-]+/g, "_");
  if (/late|lsr/.test(key)) return "late_shipment_rate";
  if (/non_fulfil/.test(key)) return "non_fulfilment_rate";
  if (/cancel/.test(key)) return "cancellation_rate";
  if (/penalt/.test(key)) return "penalty_points";
  if (/chat/.test(key) && /hour|reply/.test(key)) return "chat_reply_hours";
  return key;
}

export function discountRules(rules) {
  return rules.filter((rule) => rule.category === "pricing").map((rule) => ({
    id: rule.id,
    action: rule.action || "block",
    source_url: rule.source_url || "",
    lead_days: leadDays(rule),
    unverified: ruleUnverified(rule),
  }));
}

function hit(rule, why) {
  return {
    id: rule.id,
    status: rule.action === "block" ? "block" : "flag",
    verify: ruleUnverified(rule) ? "yes" : "no",
    source: rule.source_url || "policies/rules.yaml",
    why,
  };
}

function firstRule(rules, predicate) {
  return rules.find((rule) => rule.action === "block" && predicate(rule)) || rules.find(predicate) || null;
}

export function textHits(text, rules) {
  const hits = [];
  const phrases = findForbidden(text);
  if (phrases.length) {
    const rule = firstRule(rules, (item) => item.category === "reviews" && /star|reward|solicit|positive/i.test(item.rule || ""));
    if (rule) hits.push(hit(rule, phrases.join(" ")));
    else hits.push({ id: "review_no_star_ask", status: "block", verify: "no", source: "policies/rules.yaml", why: phrases.join(" ") });
  }
  if (/brush/i.test(text)) {
    const rule = firstRule(rules, (item) => item.category === "reviews" && /brush/i.test(item.rule || ""));
    if (rule) hits.push(hit(rule, "brush"));
  }
  const urls = text.match(/https?:\/\/|www\./gi) || [];
  const contact = /whatsapp|wa\.me|telegram|t\.me\/|zalo|wechat|line\.me|off[- ]platform/i.test(text)
    || /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)
    || urls.length > 0
    || /\+\d{8,15}/.test(text);
  if (contact) {
    const rule = firstRule(rules, (item) => /chat|privacy/.test(item.category || "") && /url|contact|off-platform|outside|phone|link/i.test(item.rule || ""));
    if (rule) hits.push(hit(rule, "contact_or_url"));
    else hits.push({ id: "chat_off_platform", status: "block", verify: "no", source: "policies/rules.yaml", why: "contact_or_url" });
  }
  const flood = /scrap(?:e|ing)|crawl(?:ing)?|headless|request flood|scrape flood/i.test(text) || urls.length >= 8;
  if (flood) {
    const rule = firstRule(rules, (item) => item.category === "automation");
    if (rule) hits.push(hit(rule, "scrape_or_flood"));
    else hits.push({ id: "automation_pace", status: "block", verify: "no", source: "policies/rules.yaml", why: "scrape_or_flood" });
  }
  const fakeDiscount = (/rais(?:e|ing) (?:the )?(?:original )?price/i.test(text) && /discount|promotion|sale/i.test(text))
    || /misleading discount|fake discount|exaggerate the discount/i.test(text);
  if (fakeDiscount) {
    const rule = firstRule(rules, (item) => item.category === "pricing");
    if (rule) hits.push(hit(rule, "fake_discount"));
    else hits.push({ id: "pricing_lead_time", status: "block", verify: "no", source: "policies/rules.yaml", why: "fake_discount" });
  }
  if (/ask(?:ing)? (?:the )?(?:customer|buyer)s? to cancel|please cancel (?:the |your )?order|hủy đơn|batalkan pesanan/i.test(text)) {
    const rule = firstRule(rules, (item) => item.category === "chat" && /cancel orders/i.test(item.rule || ""));
    if (rule) hits.push(hit(rule, "cancel_ask"));
  }
  const seen = new Map();
  for (const item of hits) {
    const previous = seen.get(item.id);
    if (!previous || (previous.status !== "block" && item.status === "block")) seen.set(item.id, item);
  }
  return [...seen.values()];
}
