#!/usr/bin/env node
/**
 * Append one captcha row, or review recent rows for one platform.
 *
 * CSV columns:
 *   logged_at,platform,skill,step,captcha_type,slider_used,outcome,note
 *
 * logged_at is the shop computer's local time as YYYY-MM-DDTHH:mm:ss.
 * Notes must not contain secrets, addresses, profile ids, or names.
 *
 * Usage:
 *   node captcha-log.mjs --csv path --platform shopee --skill <SKILL> --step <STEP> \
 *     --type slider --slider-used no --outcome stopped --note "left the screen"
 *   node captcha-log.mjs --csv path --review --platform shopee
 *
 * --review prints today's count for that platform. result REVIEW when the
 * count is 2 or more, otherwise OK. Exit 0 when the file was read or written.
 * Exit 2 on usage or file errors.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

const HEADER = "logged_at,platform,skill,step,captcha_type,slider_used,outcome,note";

function usage() {
  console.error(
    "usage: node captcha-log.mjs --csv path (--review --platform name | --platform name --skill name --step text --type text --slider-used yes|no --outcome text [--note text])",
  );
}

function parseArgs(argv) {
  const out = {
    csv: null,
    review: false,
    platform: null,
    skill: null,
    step: null,
    type: null,
    sliderUsed: null,
    outcome: null,
    note: "",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--csv") {
      out.csv = argv[i + 1];
      i += 1;
    } else if (arg === "--review") {
      out.review = true;
    } else if (arg === "--platform") {
      out.platform = argv[i + 1];
      i += 1;
    } else if (arg === "--skill") {
      out.skill = argv[i + 1];
      i += 1;
    } else if (arg === "--step") {
      out.step = argv[i + 1];
      i += 1;
    } else if (arg === "--type") {
      out.type = argv[i + 1];
      i += 1;
    } else if (arg === "--slider-used") {
      out.sliderUsed = argv[i + 1];
      i += 1;
    } else if (arg === "--outcome") {
      out.outcome = argv[i + 1];
      i += 1;
    } else if (arg === "--note") {
      out.note = argv[i + 1] ?? "";
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      return { help: true };
    } else {
      return { error: `unknown argument: ${arg}` };
    }
  }
  if (!out.csv) return { error: "--csv is required" };
  if (!out.platform) return { error: "--platform is required" };
  if (!out.review) {
    if (!out.skill || !out.step || !out.type || !out.outcome) {
      return { error: "append needs --skill --step --type --outcome" };
    }
    if (out.sliderUsed !== "yes" && out.sliderUsed !== "no") {
      return { error: "--slider-used must be yes or no" };
    }
  }
  return out;
}

function localStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function quote(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else inQuotes = false;
      } else field += char;
      continue;
    }
    if (char === '"') inQuotes = true;
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
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    usage();
    process.exit(0);
  }
  if (parsed.error) {
    console.error(parsed.error);
    usage();
    process.exit(2);
  }

  if (!parsed.review) {
    mkdirSync(dirname(parsed.csv), { recursive: true });
    const stamp = localStamp();
    const line = [
      stamp,
      parsed.platform,
      parsed.skill,
      parsed.step,
      parsed.type,
      parsed.sliderUsed,
      parsed.outcome,
      parsed.note,
    ].map(quote).join(",");
    let prefix = `${HEADER}\n`;
    if (existsSync(parsed.csv)) {
      const existing = readFileSync(parsed.csv, "utf8");
      if (existing.trim() !== "") {
        prefix = existing.endsWith("\n") ? "" : "\n";
      }
    }
    appendFileSync(parsed.csv, `${prefix}${line}\n`, "utf8");
    console.log(`csv_path: ${parsed.csv}`);
    console.log(`logged_at: ${stamp}`);
    console.log("result: LOGGED");
    return;
  }

  console.log(`csv_path: ${parsed.csv}`);
  console.log(`platform: ${parsed.platform}`);
  if (!existsSync(parsed.csv)) {
    console.log("today_count: 0");
    console.log("result: OK");
    return;
  }

  const rows = parseCsv(readFileSync(parsed.csv, "utf8"));
  const header = (rows[0] || []).map((cell) => cell.trim().toLowerCase());
  const platformIndex = header.indexOf("platform");
  const timeIndex = header.indexOf("logged_at");
  if (platformIndex === -1 || timeIndex === -1) {
    console.error("header_error: captcha log must include logged_at and platform");
    process.exit(2);
  }
  const today = localStamp().slice(0, 10);
  const matched = rows.slice(1).filter((row) => {
    const platform = (row[platformIndex] || "").trim().toLowerCase();
    const when = (row[timeIndex] || "").trim();
    return platform === parsed.platform.trim().toLowerCase() && when.startsWith(today);
  });
  console.log(`today: ${today}`);
  console.log(`today_count: ${matched.length}`);
  const recent = matched.slice(-10);
  for (const row of recent) {
    console.log(`ROW ${row.map((cell) => cell.trim()).join(" | ")}`);
  }
  console.log(matched.length >= 2 ? "result: REVIEW" : "result: OK");
}

main();
