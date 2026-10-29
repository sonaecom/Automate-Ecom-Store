#!/usr/bin/env node
/**
 * Queue finished videos for a later human publish. Does not open a browser,
 * does not generate a video, and does not start a livestream.
 *
 *   node video-post.mjs --intake DIR --source local --google no --out-dir DIR --daily-cap N --store <STORE> --day YYYY-MM-DD --mode full --journal file
 *   node video-post.mjs --status-a file --status-b file --out-dir DIR --store <STORE> --day YYYY-MM-DD --journal file
 *   node video-post.mjs --performance-a file --performance-b file --views-floor N --out-dir DIR --store <STORE> --day YYYY-MM-DD --journal file
 */

import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readJournal } from "../core/journal/action-key.mjs";
import { beginRun } from "../core/runner.mjs";

const MANIFEST = JSON.parse(readFileSync(new URL("../core/manifest/video-live.manifest.json", import.meta.url), "utf8"));
const LIMITS = JSON.parse(readFileSync(new URL("../modules/content/video-limits.json", import.meta.url), "utf8"));

export const PLACEMENTS = {
  shopee: ["product_video", "shopee_video"],
  tiktokshop: ["product_video", "shop_video"],
  lazada: ["product_video"],
};

function aspectLabel(width, height) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const divisor = gcd(width, height) || 1;
  return `${width / divisor}:${height / divisor}`;
}

export function hashBytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function postKey(videoHash, store, platform) {
  return `${videoHash}|${store}|${platform}`;
}

export function intakeSource(source, google) {
  if (source === "drive" && google !== "yes") return "SKIP_DRIVE";
  if (source !== "local" && source !== "drive") return "REJECT";
  return "OK";
}

export function checkFileLimits(probe, platform, placement) {
  const table = LIMITS[platform] && LIMITS[platform][placement];
  if (!table || !(PLACEMENTS[platform] || []).includes(placement)) return ["placement"];
  const reasons = [];
  const container = String(probe.container || "").toLowerCase();
  if (!table.formats.includes(container)) reasons.push("format");
  const duration = Number(probe.duration);
  if (!Number.isFinite(duration) || duration < table.min_seconds || duration > table.max_seconds) reasons.push("length");
  if (Number(probe.size) > table.max_bytes) reasons.push("size");
  if (Number(probe.width) < table.min_width || Number(probe.height) < 1) reasons.push("resolution");
  if (Number(probe.width) > 0 && Number(probe.height) > 0) {
    const ratio = aspectLabel(Number(probe.width), Number(probe.height));
    if (!table.aspects.includes(ratio)) reasons.push("aspect");
  }
  return reasons;
}

function minutesOf(hhmm) {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm || "");
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function clock(minutes) {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function planPosts(videos, postedKeys, options) {
  const cap = options.dailyCap;
  const gap = options.gapMinutes;
  let cursor = minutesOf(options.firstSlot) ?? 9 * 60;
  let used = 0;
  const rows = [];
  const ordered = [...videos].sort((a, b) => String(a.schedule || "").localeCompare(String(b.schedule || "")) || String(a.video_id).localeCompare(String(b.video_id)));
  for (const video of ordered) {
    const base = {
      video_id: video.video_id || "",
      store: video.store || "",
      platform: video.platform || "",
      placement: video.placement || "",
      product: video.product || "",
      variation: video.variation || "",
      slot: "",
    };
    if (!video.product || !video.variation) {
      rows.push({ ...base, decision: "LINK" });
      continue;
    }
    if (video.scan_result !== "PASS") {
      rows.push({ ...base, decision: "SCAN" });
      continue;
    }
    const limits = checkFileLimits(video.probe || {}, video.platform, video.placement);
    if (limits.length) {
      rows.push({ ...base, decision: "LIMIT", detail: limits.join(",") });
      continue;
    }
    const key = postKey(video.hash, video.store, video.platform);
    if (postedKeys.has(key)) {
      rows.push({ ...base, decision: "SKIP_DUP" });
      continue;
    }
    if (used >= cap) {
      rows.push({ ...base, decision: "OVER_CAP" });
      continue;
    }
    const wanted = minutesOf(video.schedule);
    if (wanted !== null && wanted > cursor) cursor = wanted;
    rows.push({ ...base, decision: "POST", slot: clock(cursor) });
    cursor += gap;
    used += 1;
  }
  return rows;
}

function blank(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

export function reconcileStatus(rowsA, rowsB) {
  const other = new Map(rowsB.map((row) => [`${row.video_id}|${row.store}|${row.platform}`, row]));
  return rowsA.map((row) => {
    const key = `${row.video_id}|${row.store}|${row.platform}`;
    const pair = other.get(key);
    if (!pair) return { ...row, status_b: "", reason_b: "", qc: "QC_FAIL", detail: "missing_b" };
    const same = row.status === pair.status && (row.reason || "") === (pair.reason || "");
    return {
      ...row,
      status_b: pair.status || "",
      reason_b: pair.reason || "",
      qc: same ? "OK" : "QC_FAIL",
      detail: same ? "" : `a=${row.status}/${row.reason || ""} b=${pair.status}/${pair.reason || ""}`,
    };
  });
}

const METRICS = ["views", "likes", "clicks", "orders", "gmv"];

export function reconcilePerformance(rowsA, rowsB) {
  const other = new Map(rowsB.map((row) => [`${row.video_id}|${row.store}|${row.platform}`, row]));
  return rowsA.map((row) => {
    const pair = other.get(`${row.video_id}|${row.store}|${row.platform}`);
    const out = { ...row, qc: "OK", detail: "" };
    if (!pair) return { ...out, qc: "QC_FAIL", detail: "missing_b" };
    const parts = [];
    for (const metric of METRICS) {
      const left = blank(row[metric]);
      const right = blank(pair[metric]);
      if (left === null && right === null) continue;
      if (left === null || right === null || Math.abs(left - right) > 0.001) {
        parts.push(`${metric} a=${row[metric] || ""} b=${pair[metric] || ""}`);
        out[metric] = "";
      }
    }
    if (parts.length) {
      out.qc = "QC_FAIL";
      out.detail = parts.join("; ");
    }
    return out;
  });
}

export function videoAlerts(rows, viewsFloor) {
  const alerts = [];
  for (const row of rows) {
    if (row.status === "rejected" && row.qc === "OK") {
      alerts.push({ video_id: row.video_id, kind: "rejected", detail: row.reason || "rejected" });
    }
    if (row.qc === "QC_FAIL") alerts.push({ video_id: row.video_id, kind: "qc", detail: row.detail || "two sources disagree" });
    const views = blank(row.views);
    if (row.status === "live" && viewsFloor !== null && row.qc === "OK" && views !== null && views < viewsFloor) {
      alerts.push({ video_id: row.video_id, kind: "underperform", detail: `views ${views} below ${viewsFloor}` });
    }
  }
  return alerts;
}

export function postedKeysFromJournal(rows) {
  const keys = new Set();
  for (const row of rows) {
    if (row.status === "posted" && row.videoHash && row.store && row.platform) {
      keys.add(postKey(row.videoHash, row.store, row.platform));
    }
  }
  return keys;
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function parseCsv(text) {
  const lines = String(text || "").replace(/^\uFEFF/, "").replace(/^(?:#[^\n]*\n)+/, "").trim().split(/\n/);
  if (!lines.length || !lines[0]) return [];
  const header = lines[0].split(",").map((cell) => cell.trim().toLowerCase());
  return lines.slice(1).filter(Boolean).map((line) => {
    const cells = line.split(",");
    const record = {};
    header.forEach((key, index) => {
      record[key] = (cells[index] || "").trim();
    });
    return record;
  });
}

function writeCsv(path, header, rows) {
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(header.map((key) => {
      const text = row[key] == null ? "" : String(row[key]);
      return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    }).join(","));
  }
  writeFileSync(path, `${lines.join("\n")}\n`);
}

function gate(read) {
  const store = arg("--store");
  const day = arg("--day");
  const journalPath = arg("--journal");
  const mode = arg("--mode") || "read_only";
  if (!store || !day || !journalPath) return { error: "store, day, and journal are required" };
  const decision = beginRun({
    store: { id: store, mode },
    manifest: read ? { ...MANIFEST, writes: false } : MANIFEST,
    action: read ? "read" : "publish",
    target: day,
    day,
    journalRows: readJournal(journalPath),
    policyResult: arg("--policy") || "ALLOW",
  });
  return { decision };
}

function main() {
  const outDir = arg("--out-dir");
  if (!outDir) {
    console.error("usage: node video-post.mjs --out-dir DIR (--intake DIR | --status-a file --status-b file | --performance-a file --performance-b file)");
    process.exit(2);
  }
  mkdirSync(outDir, { recursive: true });
  const source = arg("--source") || "local";
  const google = arg("--google") || "no";
  if (arg("--intake")) {
    const opened = intakeSource(source, google);
    console.log(`source: ${source}`);
    console.log(`google: ${google}`);
    if (opened !== "OK") {
      console.log("result: SKIP_DRIVE");
      process.exit(1);
    }
    const gated = gate(false);
    if (gated.error) {
      console.error(gated.error);
      process.exit(2);
    }
    console.log("classification: write");
    console.log(`runner: ${gated.decision.result}`);
    if (gated.decision.result !== "RUN") {
      console.log(`result: ${gated.decision.result}`);
      process.exit(1);
    }
    const cap = Number(arg("--daily-cap"));
    if (!Number.isInteger(cap) || cap < 1) {
      console.error("--daily-cap is required and is a ceiling, not a target");
      process.exit(2);
    }
    const videos = readdirSync(arg("--intake")).filter((name) => name.endsWith(".json")).map((name) => JSON.parse(readFileSync(join(arg("--intake"), name), "utf8")));
    const journal = arg("--post-journal") && readFileSync(arg("--post-journal"), "utf8")
      ? readFileSync(arg("--post-journal"), "utf8").split(/\n/).filter(Boolean).map((line) => JSON.parse(line))
      : [];
    const planned = planPosts(videos, postedKeysFromJournal(journal), {
      dailyCap: cap,
      firstSlot: arg("--first-slot") || "09:00",
      gapMinutes: Number(arg("--gap-minutes") || 90),
    });
    writeCsv(join(outDir, "video-queue.csv"), ["video_id", "store", "platform", "placement", "product", "variation", "slot", "decision", "detail"], planned);
    for (const row of planned) console.log(`${row.decision} ${row.video_id} ${row.platform} ${row.placement} ${row.slot}`);
    console.log(`post_count: ${planned.filter((row) => row.decision === "POST").length}`);
    console.log(`ceiling: ${cap}`);
    console.log("cap_is: ceiling");
    console.log("livestream: not_developed");
    console.log("generate: no");
    console.log("result: PLAN");
    return;
  }
  const gated = gate(true);
  if (gated.error) {
    console.error(gated.error);
    process.exit(2);
  }
  console.log("classification: read");
  console.log(`runner: ${gated.decision.result}`);
  if (gated.decision.result !== "RUN") {
    console.log(`result: ${gated.decision.result}`);
    process.exit(1);
  }
  if (arg("--status-a")) {
    const reconciled = reconcileStatus(parseCsv(readFileSync(arg("--status-a"), "utf8")), parseCsv(readFileSync(arg("--status-b"), "utf8")));
    writeCsv(join(outDir, "video-status.csv"), ["video_id", "store", "platform", "status", "reason", "status_b", "reason_b", "qc", "detail"], reconciled);
    const alerts = videoAlerts(reconciled, null);
    writeCsv(join(outDir, "video-alerts.csv"), ["video_id", "kind", "detail"], alerts);
    console.log(`qc_fail: ${reconciled.filter((row) => row.qc === "QC_FAIL").length}`);
    console.log(`alerts: ${alerts.length}`);
    console.log("result: STATUS");
    return;
  }
  const floorRaw = arg("--views-floor");
  const viewsFloor = floorRaw === "" ? null : Number(floorRaw);
  if (viewsFloor !== null && !Number.isFinite(viewsFloor)) {
    console.error("--views-floor must be a number or omitted");
    process.exit(2);
  }
  const reconciled = reconcilePerformance(parseCsv(readFileSync(arg("--performance-a"), "utf8")), parseCsv(readFileSync(arg("--performance-b"), "utf8")));
  writeCsv(join(outDir, "video-performance.csv"), ["video_id", "date", "store", "platform", "market", "product", "variation", "placement", "status", "reason", "views", "likes", "clicks", "orders", "gmv", "currency", "qc", "detail", "read_time"], reconciled);
  const alerts = videoAlerts(reconciled, viewsFloor);
  writeCsv(join(outDir, "video-alerts.csv"), ["video_id", "kind", "detail"], alerts);
  console.log(`qc_fail: ${reconciled.filter((row) => row.qc === "QC_FAIL").length}`);
  console.log(`alerts: ${alerts.length}`);
  console.log("result: PERFORMANCE");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
