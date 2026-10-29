#!/usr/bin/env node
/**
 * Score creators before an affiliate invite, and read results after one.
 * Does not open a seller site and does not send an invite.
 *
 *   node creator-score.mjs --creators file --out-dir DIR [--config file] [--invited file] [--as-of YYYY-MM-DD] [--top N]
 *   node creator-score.mjs --results file --out-dir DIR [--creators file] [--config file] [--tune]
 *
 * A shortlist ranks only creators who pass. The owner approves before any invite.
 * --tune proposes new weights. It does not write the live config.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const WEIGHT_KEYS = [
  "gmv",
  "items_sold",
  "followers",
  "avg_video_views",
  "engagement_rate",
  "activity_recency",
  "category_match",
  "audience_fit",
  "creator_level",
  "past_collab",
  "commission_fit",
];

export const DEFAULTS = {
  weights: {
    gmv: 15,
    items_sold: 10,
    followers: 8,
    avg_video_views: 12,
    engagement_rate: 15,
    activity_recency: 10,
    category_match: 10,
    audience_fit: 8,
    creator_level: 4,
    past_collab: 4,
    commission_fit: 4,
  },
  thresholds: {
    min_engagement: 0.02,
    active_within_days: 30,
    min_views_per_follower: 0.01,
    min_gmv: 0,
    invite_cooldown_days: 90,
    category_required: true,
    commission_tolerance: 5,
  },
  categories: "",
  offered_commission: "",
  audience: { gender: "any", age: "any", region: "any" },
};

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

function coerce(value) {
  if (value === "yes" || value === "true") return true;
  if (value === "no" || value === "false") return false;
  if (value === "any") return "any";
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

export function parseConfig(text) {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed) return {};
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const root = {};
  let section = null;
  for (const raw of trimmed.split(/\n/)) {
    const line = raw.replace(/\r$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const indented = /^\s+/.test(line);
    const content = line.trim();
    const splitAt = content.indexOf(":");
    if (splitAt < 0) throw new Error("config_error: line needs a key");
    const key = content.slice(0, splitAt).trim();
    const value = content.slice(splitAt + 1).trim().replace(/^["']|["']$/g, "");
    if (!indented) {
      if (value === "") {
        root[key] = {};
        section = root[key];
      } else {
        root[key] = coerce(value);
        section = null;
      }
    } else if (section && typeof section === "object") {
      section[key] = coerce(value);
    } else {
      throw new Error("config_error: nested key without a section");
    }
  }
  return root;
}

export function mergeConfig(fileConfig = {}) {
  const weights = { ...DEFAULTS.weights, ...(fileConfig.weights || {}) };
  const thresholds = { ...DEFAULTS.thresholds, ...(fileConfig.thresholds || {}) };
  if (typeof thresholds.category_required === "string") {
    thresholds.category_required = thresholds.category_required !== "no" && thresholds.category_required !== "false";
  }
  const audience = { ...DEFAULTS.audience, ...(fileConfig.audience || {}) };
  return {
    weights,
    thresholds,
    categories: fileConfig.categories == null ? "" : String(fileConfig.categories),
    offered_commission: fileConfig.offered_commission == null ? "" : fileConfig.offered_commission,
    audience,
  };
}

function blank(value) {
  const text = String(value ?? "").trim();
  return text === "" || text === "-" || text.toLowerCase() === "n/a";
}

function looseNumber(value) {
  if (blank(value)) return null;
  const text = String(value).trim().toLowerCase().replace(/,/g, "").replace(/%$/, "");
  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  let number = Number(match[0]);
  const suffix = text.slice(match.index + match[0].length).trim();
  if (suffix.startsWith("k")) number *= 1000;
  else if (suffix.startsWith("m")) number *= 1_000_000;
  return Number.isFinite(number) ? number : null;
}

function engagementRate(value) {
  const number = looseNumber(value);
  if (number === null) return null;
  if (String(value).includes("%") || number > 1) return number / 100;
  return number;
}

function yesNo(value) {
  if (blank(value)) return "";
  const text = String(value).trim().toLowerCase();
  if (["yes", "y", "true", "collab", "collaborated", "previous", "past"].includes(text)) return "yes";
  if (["no", "n", "false", "none", "new"].includes(text)) return "no";
  return "";
}

function dayNumber(value) {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(parsed) ? null : parsed / 86400000;
}

function logPoints(value, scale) {
  if (value === null || value <= 0) return 0;
  return Math.min(1, Math.log10(value + 1) / scale);
}

function round(value, places) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function categoryList(config) {
  return String(config.categories || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item && item !== "any" && !item.includes("<"));
}

function audienceTargets(config) {
  const targets = {};
  for (const key of ["gender", "age", "region"]) {
    const value = String(config.audience[key] ?? "any").trim().toLowerCase();
    if (value && value !== "any" && !value.includes("<")) targets[key] = value;
  }
  return targets;
}

function textHas(haystack, needle) {
  return String(haystack || "").toLowerCase().includes(needle);
}

function gmvAmount(row) {
  const direct = looseNumber(row.gmv);
  if (direct !== null) return direct;
  return looseNumber(row.gmv_tier);
}

function levelPoints(value) {
  if (blank(value)) return null;
  const number = looseNumber(value);
  if (number === null) return 0.5;
  return Math.min(1, number / 5);
}

export function scoreRows(rows, config, invited, asOf) {
  const seen = new Set();
  const scored = [];
  const cooldown = Number(config.thresholds.invite_cooldown_days);
  const asOfDay = dayNumber(asOf);
  for (const row of rows) {
    const handle = String(row.handle || "").trim();
    const key = handle.toLowerCase();
    const reasons = [];
    if (!handle) {
      scored.push(blankRow(row, "EXCLUDE", "missing_handle"));
      continue;
    }
    if (seen.has(key)) {
      scored.push(finish(row, "EXCLUDE", ["duplicate"], 0, config));
      continue;
    }
    seen.add(key);

    const followers = looseNumber(row.followers);
    const views = looseNumber(row.avg_video_views);
    const engagement = engagementRate(row.engagement_rate);
    const activity = looseNumber(row.last_activity_days);
    const items = looseNumber(row.items_sold);
    const gmv = gmvAmount(row);
    const level = levelPoints(row.creator_level);
    const collab = yesNo(row.past_collab);
    const usual = looseNumber(row.usual_commission);
    const usualPoints = usual === null ? null : (usual > 1 || String(row.usual_commission).includes("%") ? usual : usual * 100);
    const samples = looseNumber(row.samples_sent);
    const sampleOrders = looseNumber(row.sample_orders);
    const sampleGmv = looseNumber(row.sample_gmv);
    const matchFlag = yesNo(row.category_match);
    const categories = categoryList(config);
    let categoryOk = matchFlag === "yes" ? true : matchFlag === "no" ? false : null;
    if (categoryOk === null && categories.length && !blank(row.category)) {
      categoryOk = categories.some((item) => textHas(row.category, item));
    }

    const excludes = [];
    if (activity === null || activity > Number(config.thresholds.active_within_days)) excludes.push("inactive");
    if (config.thresholds.category_required && categoryOk === false) excludes.push("off_category");
    if (followers !== null && followers > 0 && views !== null) {
      const ratio = views / followers;
      if (ratio < Number(config.thresholds.min_views_per_follower)) excludes.push(`suspicious_ratio ${round(ratio, 4)}`);
    }
    const prior = invited.get(key);
    if (prior) {
      const invitedDay = dayNumber(prior);
      const inside = invitedDay === null || asOfDay === null || asOfDay - invitedDay <= cooldown;
      if (inside) excludes.push("invited_90d");
    }
    if (samples !== null && samples > 0 && ((sampleOrders !== null && sampleOrders <= 0) || (sampleGmv !== null && sampleGmv <= 0))) {
      excludes.push("sample_no_sales");
    }
    if (engagement !== null && engagement < Number(config.thresholds.min_engagement)) excludes.push("low_engagement");
    if (gmv !== null && gmv <= Number(config.thresholds.min_gmv)) excludes.push("gmv_zero");

    const missing = [];
    if (gmv === null) missing.push("missing_gmv");
    if (items === null) missing.push("missing_items_sold");
    if (followers === null) missing.push("missing_followers");
    if (views === null) missing.push("missing_views");
    if (engagement === null) missing.push("missing_engagement");
    if (categoryOk === null) missing.push("missing_category");
    if (blank(row.audience_gender) || blank(row.audience_age) || blank(row.audience_region)) missing.push("missing_audience");
    if (level === null) missing.push("missing_level");
    if (!collab) missing.push("missing_past_collab");
    if (usualPoints === null) missing.push("missing_commission");
    if (followers === 0) missing.push("followers_zero");

    let status = "PASS";
    if (excludes.length) status = "EXCLUDE";
    else if (missing.length) status = "HOLD";
    reasons.push(...excludes, ...(status === "HOLD" ? missing : []));
    scored.push(finish(row, status, reasons, components(row, config, {
      followers, views, engagement, activity, items, gmv, level, collab, usualPoints, categoryOk,
    }), config));
  }

  const ranked = scored.filter((row) => row.status === "PASS").sort((a, b) => b.score - a.score || a.handle.localeCompare(b.handle));
  ranked.forEach((row, index) => {
    row.rank = String(index + 1);
  });
  const rest = scored.filter((row) => row.status !== "PASS").sort((a, b) => a.status.localeCompare(b.status) || a.handle.localeCompare(b.handle));
  return ranked.concat(rest);
}

function components(row, config, parsed) {
  const windowDays = Number(config.thresholds.active_within_days) || 30;
  const activity = parsed.activity === null ? 0 : Math.max(0, (windowDays - parsed.activity) / windowDays);
  const targets = audienceTargets(config);
  const keys = Object.keys(targets);
  let audience = 1;
  if (keys.length) {
    const hits = keys.filter((key) => textHas(row[`audience_${key}`], targets[key])).length;
    audience = hits / keys.length;
  }
  const offered = looseNumber(config.offered_commission);
  let commission = 1;
  if (offered !== null && parsed.usualPoints !== null) {
    const gap = Math.abs(parsed.usualPoints - offered);
    const tolerance = Number(config.thresholds.commission_tolerance);
    commission = gap <= tolerance ? 1 : Math.max(0, 1 - (gap - tolerance) / 20);
  }
  return {
    gmv: logPoints(parsed.gmv, 6),
    items_sold: logPoints(parsed.items, 5),
    followers: logPoints(parsed.followers, 6),
    avg_video_views: logPoints(parsed.views, 6),
    engagement_rate: parsed.engagement === null ? 0 : Math.min(1, parsed.engagement / 0.05),
    activity_recency: Math.min(1, activity),
    category_match: parsed.categoryOk ? 1 : 0,
    audience_fit: audience,
    creator_level: parsed.level === null ? 0 : parsed.level,
    past_collab: parsed.collab === "yes" ? 1 : parsed.collab === "no" ? 0.4 : 0,
    commission_fit: commission,
  };
}

function weighted(parts, weights) {
  let total = 0;
  let used = 0;
  for (const key of WEIGHT_KEYS) {
    const weight = Number(weights[key]);
    if (!Number.isFinite(weight) || weight < 0) continue;
    total += weight * parts[key];
    used += weight;
  }
  if (!used) return 0;
  return round((total / used) * 100, 2);
}

function finish(row, status, reasons, parts, config) {
  const followers = looseNumber(row.followers);
  const views = looseNumber(row.avg_video_views);
  const engagement = engagementRate(row.engagement_rate);
  return {
    rank: "",
    handle: String(row.handle || "").trim(),
    score: status === "PASS" ? weighted(parts, config.weights) : "",
    status,
    reasons: reasons.join("|"),
    proposed: "",
    gmv_tier: row.gmv_tier || "",
    gmv: row.gmv || "",
    items_sold: row.items_sold || "",
    followers: row.followers || "",
    avg_video_views: row.avg_video_views || "",
    engagement_rate: engagement === null ? (row.engagement_rate || "") : String(round(engagement, 4)),
    views_per_follower: followers > 0 && views !== null ? String(round(views / followers, 4)) : "",
    last_activity_days: row.last_activity_days || "",
    category: row.category || "",
    category_match: row.category_match || "",
    audience_gender: row.audience_gender || "",
    audience_age: row.audience_age || "",
    audience_region: row.audience_region || "",
    creator_level: row.creator_level || "",
    past_collab: row.past_collab || "",
    usual_commission: row.usual_commission || "",
    samples_sent: row.samples_sent || "",
    sample_orders: row.sample_orders || "",
    sample_gmv: row.sample_gmv || "",
    read_time: row.read_time || "",
    _parts: parts,
  };
}

function blankRow(row, status, reason) {
  return finish(row, status, [reason], emptyParts(), { weights: DEFAULTS.weights });
}

function emptyParts() {
  return Object.fromEntries(WEIGHT_KEYS.map((key) => [key, 0]));
}

function markProposed(rows, top) {
  if (!Number.isFinite(top) || top < 1) return rows;
  let left = top;
  for (const row of rows) {
    if (row.status === "PASS" && left > 0) {
      row.proposed = "yes";
      left -= 1;
    } else row.proposed = "no";
  }
  return rows;
}

const RESULT_HEADER = [
  "handle", "accepted", "content_posted", "orders", "gmv", "sample_cost", "commission_cost", "cost", "roi", "currency", "read_time",
];

export function resultRows(rows) {
  return rows.map((row) => {
    const gmv = looseNumber(row.gmv);
    const sample = looseNumber(row.sample_cost);
    const commission = looseNumber(row.commission_cost);
    const costKnown = sample !== null || commission !== null;
    const cost = costKnown ? (sample || 0) + (commission || 0) : null;
    let roi = "";
    if (gmv !== null && cost !== null && cost > 0) roi = String(round((gmv - cost) / cost, 4));
    return {
      handle: row.handle || "",
      accepted: row.accepted || "",
      content_posted: row.content_posted || "",
      orders: row.orders || "",
      gmv: row.gmv || "",
      sample_cost: row.sample_cost || "",
      commission_cost: row.commission_cost || "",
      cost: cost === null ? "" : String(cost),
      roi,
      currency: row.currency || "",
      read_time: row.read_time || "",
    };
  });
}

export function tuneWeights(creatorRows, resultInput, config) {
  const byHandle = new Map();
  for (const row of creatorRows) {
    const key = String(row.handle || "").trim().toLowerCase();
    if (key) byHandle.set(key, row);
  }
  const winners = [];
  const losers = [];
  for (const result of resultInput) {
    const key = String(result.handle || "").trim().toLowerCase();
    const source = byHandle.get(key) || result;
    const parsed = {
      followers: looseNumber(source.followers),
      views: looseNumber(source.avg_video_views),
      engagement: engagementRate(source.engagement_rate),
      activity: looseNumber(source.last_activity_days),
      items: looseNumber(source.items_sold),
      gmv: gmvAmount(source),
      level: levelPoints(source.creator_level),
      collab: yesNo(source.past_collab),
      usualPoints: (() => {
        const usual = looseNumber(source.usual_commission);
        if (usual === null) return null;
        return usual > 1 || String(source.usual_commission || "").includes("%") ? usual : usual * 100;
      })(),
      categoryOk: yesNo(source.category_match) !== "no",
    };
    const parts = components(source, config, parsed);
    const gmv = looseNumber(result.gmv);
    const orders = looseNumber(result.orders);
    const posted = yesNo(result.content_posted) === "yes";
    const accepted = yesNo(result.accepted) === "yes";
    const samples = looseNumber(result.samples_sent ?? source.samples_sent);
    if (posted && gmv !== null && gmv > 0) winners.push(parts);
    else if ((accepted || (samples !== null && samples > 0)) && ((gmv !== null && gmv <= 0) || (orders !== null && orders <= 0))) losers.push(parts);
  }
  if (winners.length < 2 || losers.length < 2) {
    return { ok: false, weights: { ...config.weights }, winners: winners.length, losers: losers.length };
  }
  const mean = (group, key) => group.reduce((sum, parts) => sum + parts[key], 0) / group.length;
  const next = {};
  for (const key of WEIGHT_KEYS) {
    const delta = mean(winners, key) - mean(losers, key);
    const shift = Math.max(-5, Math.min(5, Math.round(delta * 10)));
    next[key] = Math.max(1, Number(config.weights[key]) + shift);
  }
  const sum = WEIGHT_KEYS.reduce((total, key) => total + next[key], 0);
  const scaled = {};
  let running = 0;
  WEIGHT_KEYS.forEach((key, index) => {
    if (index === WEIGHT_KEYS.length - 1) scaled[key] = round(100 - running, 2);
    else {
      scaled[key] = round((next[key] / sum) * 100, 2);
      running += scaled[key];
    }
  });
  return { ok: true, weights: scaled, winners: winners.length, losers: losers.length };
}

function loadInvited(path) {
  const map = new Map();
  if (!path) return map;
  for (const row of records(path)) {
    const key = String(row.handle || "").trim().toLowerCase();
    if (!key) continue;
    const date = row.invited_date || row.date || "";
    const previous = map.get(key);
    if (!previous || (date && date > previous)) map.set(key, date);
  }
  return map;
}

function printScore(rows, top) {
  const pass = rows.filter((row) => row.status === "PASS").length;
  const excluded = rows.filter((row) => row.status === "EXCLUDE").length;
  const held = rows.filter((row) => row.status === "HOLD").length;
  console.log(`pass: ${pass}`);
  console.log(`exclude: ${excluded}`);
  console.log(`hold: ${held}`);
  console.log(`proposed: ${rows.filter((row) => row.proposed === "yes").length}`);
  if (Number.isFinite(top)) console.log(`top: ${top}`);
  console.log(pass ? "result: OK" : "result: EMPTY");
  return pass > 0;
}

const SHORTLIST_HEADER = [
  "rank", "handle", "score", "status", "reasons", "proposed",
  "gmv_tier", "gmv", "items_sold", "followers", "avg_video_views", "engagement_rate", "views_per_follower",
  "last_activity_days", "category", "category_match", "audience_gender", "audience_age", "audience_region",
  "creator_level", "past_collab", "usual_commission", "samples_sent", "sample_orders", "sample_gmv", "read_time",
];

function main() {
  const outDir = arg("--out-dir");
  const creatorsPath = arg("--creators");
  const resultsPath = arg("--results");
  if (!outDir || (!creatorsPath && !resultsPath)) {
    console.error("usage: node creator-score.mjs --creators file --out-dir DIR [--config file --invited file --as-of YYYY-MM-DD --top N]");
    console.error("   or: node creator-score.mjs --results file --out-dir DIR [--creators file --config file --tune]");
    process.exit(2);
  }
  let fileConfig = {};
  if (arg("--config")) {
    try {
      fileConfig = parseConfig(readFileSync(arg("--config"), "utf8"));
    } catch (error) {
      console.error(error.message);
      process.exit(2);
    }
  }
  const config = mergeConfig(fileConfig);
  if (arg("--category")) config.categories = arg("--category");
  if (arg("--offered-commission")) config.offered_commission = arg("--offered-commission");
  mkdirSync(outDir, { recursive: true });

  if (resultsPath) {
    const results = resultRows(records(resultsPath));
    writeCsv(join(outDir, "creator-results.csv"), RESULT_HEADER, results);
    const withRoi = results.filter((row) => row.roi !== "").length;
    const undefinedRoi = results.length - withRoi;
    console.log(`rows: ${results.length}`);
    console.log(`roi: ${withRoi}`);
    console.log(`roi_undefined: ${undefinedRoi}`);
    if (process.argv.includes("--tune")) {
      const creators = creatorsPath ? records(creatorsPath) : records(resultsPath);
      const proposal = tuneWeights(creators, records(resultsPath), config);
      console.log(`winners: ${proposal.winners}`);
      console.log(`losers: ${proposal.losers}`);
      if (!proposal.ok) {
        console.log("result: NEED_MORE");
        return;
      }
      const lines = WEIGHT_KEYS.map((key) => ({
        metric: key,
        current: config.weights[key],
        proposed: proposal.weights[key],
      }));
      writeCsv(join(outDir, "weight-proposal.csv"), ["metric", "current", "proposed"], lines);
      for (const line of lines) console.log(`proposed_weight ${line.metric} ${line.current} ${line.proposed}`);
      console.log("result: PROPOSAL");
      return;
    }
    console.log("result: OK");
    return;
  }

  const topText = arg("--top");
  const top = topText ? Number(topText) : null;
  if (topText && (!Number.isInteger(top) || top < 1)) {
    console.error("top must be a positive integer");
    process.exit(2);
  }
  const asOf = arg("--as-of") || new Date().toISOString().slice(0, 10);
  if (dayNumber(asOf) === null) {
    console.error("as-of must be YYYY-MM-DD");
    process.exit(2);
  }
  const rows = markProposed(scoreRows(records(creatorsPath), config, loadInvited(arg("--invited")), asOf), top);
  for (const row of rows) delete row._parts;
  writeCsv(join(outDir, "shortlist.csv"), SHORTLIST_HEADER, rows);
  console.log(`as_of: ${asOf}`);
  const ok = printScore(rows, top);
  if (!ok) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
