#!/usr/bin/env node
/**
 * Check a KOL chat draft before send, and append kol_chat_log.csv.
 * Does not open a seller site.
 *
 *   node kol-chat.mjs --check --platform shopee --market PH --text "..."
 *   node kol-chat.mjs --can-send --csv log.csv --creator <CREATOR> --template no_invite --now 2026-10-29T09:00:00 [--follow-up]
 *   node kol-chat.mjs --log --csv log.csv --time ... --creator ... --thread ... --template no_invite --priority P3 --result sent
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const LOG_HEADER = ["time", "creator", "thread", "template_id", "priority", "result"];

const RULES = [
  ["email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ["url", /\b(?:https?:\/\/|www\.)\S+/i],
  ["phone", /(?:\+\d|\b0)\d[\d\s().-]{6,}\d|\b\d{8,}\b/],
  ["handle", /(^|\s)@[A-Za-z0-9_.]{2,}\b/],
  ["off_platform", /\b(?:whatsapp|zalo|telegram|facebook|instagram)\b/i],
];

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

export function forbiddenHits(text) {
  const hits = [];
  for (const [name, pattern] of RULES) {
    if (pattern.test(text || "")) hits.push(name);
  }
  return hits;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = String(text || "").replace(/^\uFEFF/, "").replace(/^(?:#[^\n]*\n)+/, "");
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

export function readLog(text) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  if (header.join(",") !== LOG_HEADER.join(",")) return { error: `header must be ${LOG_HEADER.join(",")}` };
  return rows.slice(1).map((cells) => {
    const record = {};
    header.forEach((key, index) => {
      record[key] = (cells[index] || "").trim();
    });
    return record;
  });
}

export function sendDecision(rows, { creator, templateId, now, followUp }) {
  const mine = rows.filter((row) => row.creator.toLowerCase() === String(creator || "").toLowerCase());
  const cutoff = Date.parse(now) - 24 * 3600000;
  if (mine.some((row) => row.template_id === templateId && row.result === "sent" && Date.parse(row.time) >= cutoff)) {
    return "SKIP_TEMPLATE";
  }
  const lastSent = [...mine].reverse().find((row) => row.result === "sent");
  const lastReceived = [...mine].reverse().find((row) => row.result === "received");
  if (lastSent && !followUp) {
    const sentAt = Date.parse(lastSent.time);
    const receivedAt = lastReceived ? Date.parse(lastReceived.time) : 0;
    if (!(receivedAt > sentAt)) return "HOLD_UNANSWERED";
  }
  return "SEND";
}

function policyResult(platform, market, text) {
  const script = new URL("./policy-gate.mjs", import.meta.url);
  const result = spawnSync(process.execPath, [
    script.pathname, "--platform", platform, "--market", market, "--action", "submit", "--text", text,
  ], { encoding: "utf8" });
  const lines = `${result.stdout || ""}\n${result.stderr || ""}`.split(/\n/).filter((line) => line.startsWith("result: "));
  return lines.length ? lines[lines.length - 1].slice("result: ".length).trim() : "POLICY_PENDING";
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function main() {
  if (process.argv.includes("--check")) {
    const text = arg("--text") || (arg("--file") ? readFileSync(arg("--file"), "utf8") : "");
    const platform = arg("--platform");
    const market = arg("--market");
    if (!text || !platform || !market) {
      console.error("check needs --platform --market and --text or --file");
      process.exit(2);
    }
    const hits = forbiddenHits(text);
    const gate = policyResult(platform, market, text);
    console.log(`forbidden: ${hits.join(" ") || "none"}`);
    console.log(`gate: ${gate}`);
    if (hits.length || ["VIOLATION", "POLICY_PENDING", "STALE", "FLAG"].includes(gate)) {
      console.log("result: BLOCKED");
      process.exit(1);
    }
    console.log("result: ALLOW");
    return;
  }
  const csv = arg("--csv");
  if (process.argv.includes("--can-send")) {
    if (!csv || !arg("--creator") || !arg("--template") || !arg("--now")) {
      console.error("can-send needs --csv --creator --template --now");
      process.exit(2);
    }
    const parsed = readLog(existsSync(csv) ? readFileSync(csv, "utf8") : "");
    if (parsed.error) {
      console.error(parsed.error);
      process.exit(2);
    }
    const decision = sendDecision(parsed, {
      creator: arg("--creator"),
      templateId: arg("--template"),
      now: arg("--now"),
      followUp: process.argv.includes("--follow-up"),
    });
    console.log(`result: ${decision}`);
    if (decision !== "SEND") process.exit(1);
    return;
  }
  if (!process.argv.includes("--log")) {
    console.error("usage: node kol-chat.mjs (--check | --can-send | --log) ...");
    process.exit(2);
  }
  const row = {
    time: arg("--time"),
    creator: arg("--creator"),
    thread: arg("--thread"),
    template_id: arg("--template"),
    priority: arg("--priority"),
    result: arg("--result"),
  };
  if (Object.values(row).some((value) => !String(value || "").trim()) || !csv) {
    console.error("log needs --csv --time --creator --thread --template --priority --result");
    process.exit(2);
  }
  const existing = existsSync(csv) ? readFileSync(csv, "utf8") : "";
  const parsed = readLog(existing);
  if (parsed.error) {
    console.error(parsed.error);
    process.exit(2);
  }
  mkdirSync(dirname(csv), { recursive: true });
  const lines = [LOG_HEADER.join(",")];
  for (const item of parsed) lines.push(LOG_HEADER.map((key) => csvEscape(item[key])).join(","));
  lines.push(LOG_HEADER.map((key) => csvEscape(row[key])).join(","));
  writeFileSync(csv, `${lines.join("\n")}\n`);
  console.log("result: LOGGED");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
