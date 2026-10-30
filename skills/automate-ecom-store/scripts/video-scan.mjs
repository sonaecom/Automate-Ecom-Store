#!/usr/bin/env node
/**
 * Pre-publish scan for one product video. Does not upload and does not post.
 * Policy text comes only from policies/rules.yaml.
 *
 *   node video-scan.mjs --spec file --platform shopee --market PH --out report.json
 *
 * PASS is the only publish result. BLOCK and REVIEW both mean do not post.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { loadRules, rulesFor, textHits } from "./policy-rules.mjs";

const MEDICAL = /\b(cures?|clinically proven|miracle (?:cure|results)|guaranteed weight|before and after|before\/after|treats? (?:cancer|diabetes))\b/i;
const EXAGGERATED = /\b(100\s*%|guaranteed results|miracle|instant results|lose \d+\s?kg)\b/i;
const VISUAL = ["nudity", "violence", "weapons", "minors", "other_logo", "qr", "before_after"];

function exampleTerms(rule) {
  const match = String(rule.rule || "").match(/e\.g\.\s*([^)]+)\)/i);
  if (!match) return [];
  return match[1].split(",").map((item) => item.trim().toLowerCase()).filter((item) => item.length >= 4);
}

function contentRule(rules) {
  return rules.find((rule) => rule.action === "block" && /content|listing|livestream/.test(rule.category || "")) || null;
}

function pricingRule(rules) {
  return rules.find((rule) => rule.action === "block" && rule.category === "pricing") || null;
}

function claimedPrices(text) {
  const found = [];
  const pattern = /(?:^|[^\d])(\d{1,7}(?:\.\d{1,2})?)(?!\s*%)/g;
  let match = pattern.exec(text);
  while (match) {
    found.push(Number(match[1]));
    match = pattern.exec(text);
  }
  return found;
}

function claimedDiscount(text) {
  const match = text.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : null;
}

function aspectLabel(width, height) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const divisor = gcd(width, height) || 1;
  return `${width / divisor}:${height / divisor}`;
}

function add(reasons, status, check, reason, rule, at) {
  reasons.push({
    status,
    check,
    reason,
    rule: rule || "",
    at: at || "00:00:00",
  });
}

export function scanVideo(input) {
  const rules = input.rules || [];
  const reasons = [];
  const parts = [
    { name: "title", text: input.title || "", at: "00:00:00" },
    { name: "caption", text: input.caption || "", at: "00:00:00" },
    { name: "hashtags", text: Array.isArray(input.hashtags) ? input.hashtags.join(" ") : (input.hashtags || ""), at: "00:00:00" },
    { name: "on_screen", text: input.on_screen || "", at: "00:00:00" },
    { name: "transcript", text: input.transcript || "", at: "00:00:00" },
  ];
  for (const cue of input.cues || []) {
    parts.push({ name: "transcript", text: cue.text || "", at: cue.at || "00:00:00" });
  }
  if (input.transcript_available !== "yes" && !input.transcript) {
    add(reasons, "REVIEW", "text.transcript", "local speech-to-text is not available", "", "00:00:00");
  }
  for (const part of parts) {
    if (!part.text.trim()) continue;
    for (const hit of textHits(part.text, rules)) {
      add(reasons, hit.status === "block" ? "BLOCK" : "REVIEW", `text.${part.name}`, hit.why, hit.id, part.at);
    }
    const lower = part.text.toLowerCase();
    for (const rule of rules) {
      if (rule.action !== "block") continue;
      for (const term of exampleTerms(rule)) {
        if (lower.includes(term)) add(reasons, "BLOCK", `text.${part.name}`, `prohibited_or_restricted:${term}`, rule.id, part.at);
      }
    }
    if (MEDICAL.test(part.text)) {
      const rule = contentRule(rules);
      add(reasons, rule ? "BLOCK" : "REVIEW", `text.${part.name}`, "medical_or_health_claim", rule ? rule.id : "", part.at);
    }
    if (EXAGGERATED.test(part.text)) {
      const rule = pricingRule(rules) || contentRule(rules);
      add(reasons, rule ? "BLOCK" : "REVIEW", `text.${part.name}`, "exaggerated_or_false_claim", rule ? rule.id : "", part.at);
    }
  }
  const blob = parts.map((part) => part.text).join("\n");
  if (input.competitors_confirmed !== "yes") {
    add(reasons, "REVIEW", "text.trademark", "competitor list was not confirmed by the owner", "", "00:00:00");
  } else {
    const lower = blob.toLowerCase();
    const rule = contentRule(rules);
    for (const name of input.competitors || []) {
      const needle = String(name || "").trim().toLowerCase();
      if (needle && lower.includes(needle)) {
        add(reasons, rule ? "BLOCK" : "REVIEW", "text.trademark", `competitor:${name}`, rule ? rule.id : "", "00:00:00");
      }
    }
  }
  const prices = claimedPrices(`${input.title || ""} ${input.caption || ""} ${input.on_screen || ""}`);
  const discount = claimedDiscount(`${input.title || ""} ${input.caption || ""} ${input.on_screen || ""}`);
  if ((prices.length || discount !== null) && (input.listing_price === undefined || input.listing_price === "")) {
    add(reasons, "REVIEW", "text.price", "listing price is missing, so the claim cannot be checked", "", "00:00:00");
  } else if (prices.length && prices.some((price) => Math.abs(price - Number(input.listing_price)) > 0.001)) {
    const rule = pricingRule(rules);
    add(reasons, rule ? "BLOCK" : "REVIEW", "text.price", "price_does_not_match_listing", rule ? rule.id : "", "00:00:00");
  } else if (discount !== null && (input.listing_discount === undefined || input.listing_discount === "")) {
    add(reasons, "REVIEW", "text.price", "discount claim has no listing discount to match", "", "00:00:00");
  } else if (discount !== null && Math.abs(discount - Number(input.listing_discount)) > 0.001) {
    const rule = pricingRule(rules);
    add(reasons, rule ? "BLOCK" : "REVIEW", "text.price", "discount_does_not_match_listing", rule ? rule.id : "", "00:00:00");
  }

  const limits = input.limits || {};
  const probe = input.probe;
  if (!probe) {
    add(reasons, "REVIEW", "video.details", "ffprobe output is missing", "", "00:00:00");
  } else {
    const needed = ["formats", "min_seconds", "max_seconds", "min_width", "aspects", "max_bytes"];
    if (needed.some((key) => limits[key] === undefined || limits[key] === "")) {
      add(reasons, "REVIEW", "video.limits", "owner has not set format, length, resolution, aspect, or size limits", "", "00:00:00");
    } else {
      const container = String(probe.container || "").toLowerCase();
      if (!limits.formats.map((item) => String(item).toLowerCase()).includes(container)) {
        add(reasons, "BLOCK", "video.format", `format ${container || "unknown"} is outside the owner limit`, "", "00:00:00");
      }
      const duration = Number(probe.duration);
      if (!Number.isFinite(duration) || duration < Number(limits.min_seconds) || duration > Number(limits.max_seconds)) {
        add(reasons, "BLOCK", "video.length", `length ${duration}s is outside ${limits.min_seconds}-${limits.max_seconds}s`, "", "00:00:00");
      }
      if (Number(probe.width) < Number(limits.min_width) || Number(probe.height) < 1) {
        add(reasons, "BLOCK", "video.resolution", `resolution ${probe.width}x${probe.height} is below ${limits.min_width}`, "", "00:00:00");
      }
      if (Number(probe.width) > 0 && Number(probe.height) > 0) {
        const ratio = aspectLabel(Number(probe.width), Number(probe.height));
        if (!limits.aspects.includes(ratio)) add(reasons, "BLOCK", "video.aspect", `aspect ${ratio} is outside the owner limit`, "", "00:00:00");
      }
      if (Number(probe.size) > Number(limits.max_bytes)) {
        add(reasons, "BLOCK", "video.size", `file size ${probe.size} is above ${limits.max_bytes}`, "", "00:00:00");
      }
    }
    if (Number(probe.duration) > 0 && Number(probe.duration) < 1) {
      add(reasons, "BLOCK", "video.still", "video is still or blank", "", "00:00:00");
    } else if (Number(probe.nb_frames) === 1) {
      add(reasons, "BLOCK", "video.still", "video has a single frame", "", "00:00:00");
    }
    if (probe.other_platform_logo === "yes") {
      const rule = contentRule(rules);
      add(reasons, "BLOCK", "video.watermark", "other platform logo or watermark", rule ? rule.id : "", "00:00:00");
    } else if (probe.other_platform_logo !== "no") {
      add(reasons, "REVIEW", "video.watermark", "other-platform watermark was not checked locally", "", "00:00:00");
    }
    if (!probe.hasAudio && input.silent_ok !== "yes") {
      add(reasons, "REVIEW", "video.audio", "no audio stream", "", "00:00:00");
    }
  }
  if (input.music_rights !== "licensed" && input.music_rights !== "owned") {
    add(reasons, "REVIEW", "video.copyright", "music or copyright rights were not confirmed", "", "00:00:00");
  }

  const visual = input.visual;
  if (!visual) {
    add(reasons, "REVIEW", "image.cover", "cover and keyframes were not checked locally", "", "00:00:00");
  } else {
    for (const key of VISUAL) {
      if (visual[key] === "yes") {
        const rule = contentRule(rules);
        add(reasons, rule ? "BLOCK" : "REVIEW", `image.${key}`, key, rule ? rule.id : "", visual.at || "00:00:00");
      } else if (visual[key] !== "no") {
        add(reasons, "REVIEW", `image.${key}`, `${key} was not decided by a local check`, "", visual.at || "00:00:00");
      }
    }
    if (visual.ocr_available !== "yes") {
      add(reasons, "REVIEW", "image.ocr", "local OCR is not available", "", "00:00:00");
    } else if (visual.ocr_text) {
      for (const hit of textHits(visual.ocr_text, rules)) {
        add(reasons, hit.status === "block" ? "BLOCK" : "REVIEW", "image.ocr", hit.why, hit.id, visual.at || "00:00:00");
      }
    }
  }

  const seen = new Set();
  const unique = reasons.filter((row) => {
    const key = `${row.status}|${row.check}|${row.reason}|${row.at}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const result = unique.some((row) => row.status === "BLOCK") ? "BLOCK" : unique.some((row) => row.status === "REVIEW") ? "REVIEW" : "PASS";
  return {
    video_id: input.video_id || "",
    platform: input.platform || "",
    market: input.market || "",
    result,
    publish: result === "PASS" ? "yes" : "no",
    upload: "disabled",
    scanned_at: input.now || new Date().toISOString(),
    reasons: unique,
  };
}

export function probeFromFfprobe(raw) {
  const streams = raw.streams || [];
  const video = streams.find((stream) => stream.codec_type === "video") || {};
  const audio = streams.find((stream) => stream.codec_type === "audio");
  const format = raw.format || {};
  const container = String(format.format_name || "").split(",")[0];
  return {
    container: container === "mov" ? "mov" : container,
    duration: Number(format.duration || video.duration || 0),
    width: Number(video.width || 0),
    height: Number(video.height || 0),
    size: Number(format.size || 0),
    hasAudio: Boolean(audio),
    nb_frames: Number(video.nb_frames || 0),
    other_platform_logo: "unknown",
  };
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function main() {
  const specPath = arg("--spec");
  const platform = arg("--platform");
  const market = arg("--market");
  const out = arg("--out");
  if (!specPath || !platform || !market || !out) {
    console.error("usage: node video-scan.mjs --spec file --platform name --market CODE --out report.json [--video file]");
    process.exit(2);
  }
  if (arg("--enable-upload") === "yes") {
    console.error("external upload is not used by this scan");
    process.exit(2);
  }
  const spec = JSON.parse(readFileSync(specPath, "utf8"));
  let probe = spec.probe;
  const video = arg("--video");
  if (video) {
    const ran = spawnSync("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", video], { encoding: "utf8" });
    if (ran.status === 0 && ran.stdout) probe = { ...probeFromFfprobe(JSON.parse(ran.stdout)), other_platform_logo: spec.probe?.other_platform_logo || "unknown" };
    else probe = probe || null;
  }
  const report = scanVideo({
    ...spec,
    platform,
    market,
    probe,
    rules: rulesFor(loadRules(), platform, market),
  });
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`video_id: ${report.video_id}`);
  console.log(`result: ${report.result}`);
  console.log(`publish: ${report.publish}`);
  console.log("upload: disabled");
  for (const row of report.reasons) console.log(`${row.status} ${row.check} ${row.reason} rule=${row.rule || "none"} at=${row.at}`);
  if (report.result !== "PASS") {
    console.log("alert: owner");
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
