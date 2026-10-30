#!/usr/bin/env node
/**
 * One task queue per store profile. Dedupe and the policy gate run before enqueue.
 * Does not open a seller site and does not print a profile id or an API key.
 *
 *   node task-queue.mjs --enqueue --store <STORE> --platform shopee --market VN --action report --target <REPORT> --minutes 10
 *   node task-queue.mjs --plan --store <STORE>
 *   node task-queue.mjs --summary --store <STORE> --date YYYY-MM-DD
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const LEVEL_OF = {
  captcha: "P0",
  handover: "P0",
  health: "P0",
  stockout: "P0",
  dispute: "P0",
  chat: "P0",
  orders: "P1",
  stock_sync: "P1",
  ads_guard: "P1",
  affiliate_invite: "P2",
  listing: "P2",
  campaign: "P2",
  report: "P3",
  kol_problem: "P0",
  kol_deadline: "P0",
  kol_sample: "P1",
  kol_question: "P2",
  kol_collaborate: "P3",
  kol_followup: "P4",
};

export const GATE_ACTION = {
  captcha: "read",
  handover: "read",
  health: "read",
  stockout: "read",
  dispute: "read",
  chat: "submit",
  orders: "read",
  stock_sync: "stock_write",
  ads_guard: "read",
  affiliate_invite: "submit",
  listing: "publish",
  campaign: "submit",
  report: "read",
  kol_problem: "submit",
  kol_deadline: "submit",
  kol_sample: "submit",
  kol_question: "submit",
  kol_collaborate: "submit",
  kol_followup: "submit",
};

const MUTATING = new Set(["publish", "price", "budget", "refund", "register", "delete", "stock_write", "submit"]);
const BLOCKS_MUTATION = new Set(["POLICY_PENDING", "STALE", "VIOLATION", "FLAG"]);

export const DEFAULTS = {
  dedupe_window_hours: 24,
  session_minutes: 40,
  chunk_minutes: 10,
  daily_sessions: 1,
  kol_messages_per_session: 30,
  kol_custom_invites_per_session: 10,
};

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

export function canonicalParams(params) {
  const source = params && typeof params === "object" ? params : {};
  const out = {};
  for (const key of Object.keys(source).sort()) out[key] = String(source[key]);
  return JSON.stringify(out);
}

export function splitMinutes(total, cap) {
  const size = Math.max(1, cap);
  const sizes = [];
  let left = Math.max(1, total);
  while (left > 0) {
    const slice = Math.min(size, left);
    sizes.push(slice);
    left -= slice;
  }
  return sizes;
}

function levelRank(level) {
  return { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 }[level] ?? 9;
}

export function compareTasks(a, b) {
  const pinA = Number(a.pin) || 0;
  const pinB = Number(b.pin) || 0;
  if ((pinA > 0) !== (pinB > 0)) return pinA > 0 ? -1 : 1;
  if (pinA !== pinB) return pinB - pinA;
  const level = levelRank(a.level) - levelRank(b.level);
  if (level !== 0) return level;
  const score = (Number(b.score) || 0) - (Number(a.score) || 0);
  if (score !== 0) return score;
  return String(a.created).localeCompare(String(b.created));
}

function withinWindow(created, now, hours) {
  const left = Date.parse(created);
  const right = Date.parse(now);
  if (Number.isNaN(left) || Number.isNaN(right)) return true;
  return Math.abs(right - left) <= hours * 3600000;
}

export function enqueueTask(queue, input, now, config, gateResult) {
  const action = input.action;
  if (!LEVEL_OF[action] && !input.level) return { error: "unknown action" };
  const level = input.level || LEVEL_OF[action];
  if (!["P0", "P1", "P2", "P3", "P4"].includes(level)) return { error: "level must be P0, P1, P2, P3, or P4" };
  if (String(action).startsWith("kol_")) {
    const open = queue.find((task) => task.target === input.target && String(task.action).startsWith("kol_") && (task.status === "pending" || task.status === "running"));
    if (open) {
      if (levelRank(level) < levelRank(open.level)) {
        open.level = level;
        open.action = action;
      }
      if (input.score != null && input.score !== "") open.score = Number(input.score);
      open.merged = (open.merged || 1) + 1;
      return { result: "MERGE", task: open };
    }
  }
  const params = canonicalParams(input.params);
  const windowHours = config.dedupe_window_hours;
  const sameTarget = queue.filter((task) => task.action === action && task.target === input.target && withinWindow(task.created, now, windowHours));
  const twin = sameTarget.find((task) => task.params === params && task.status !== "blocked");
  if (twin && (twin.status === "pending" || twin.status === "running")) {
    twin.merged = (twin.merged || 1) + 1;
    return { result: "MERGE", task: twin };
  }
  if (twin && twin.status === "done") return { result: "SKIP", task: twin };
  const clash = sameTarget.find((task) => task.params !== params && (task.status === "pending" || task.status === "running" || task.status === "conflict"));
  const sizes = splitMinutes(input.minutes || config.chunk_minutes, Math.min(config.chunk_minutes, config.session_minutes));
  const task = {
    id: input.id,
    store: input.store,
    platform: input.platform,
    market: input.market,
    action,
    target: input.target,
    params,
    module: input.module || "",
    level,
    pin: Number(input.pin) || 0,
    status: "pending",
    chunk_sizes: sizes,
    chunks: sizes.length,
    next_chunk: 1,
    checkpoint: "",
    conflict: "",
    gate: gateResult,
    created: now,
    score: input.score == null || input.score === "" ? 0 : Number(input.score),
    source: input.source || "owner",
    merged: 1,
    done_on: "",
  };
  const gateAction = GATE_ACTION[action] || "read";
  const blocked = gateResult === "VIOLATION" || (MUTATING.has(gateAction) && BLOCKS_MUTATION.has(gateResult));
  if (clash) {
    task.status = "conflict";
    task.conflict = clash.id;
    if (clash.status === "pending") clash.status = "conflict";
    queue.push(task);
    return { result: "CONFLICT", task };
  }
  if (blocked) {
    task.status = "blocked";
    queue.push(task);
    return { result: "BLOCKED", task };
  }
  queue.push(task);
  return { result: "QUEUED", task };
}

export function planDay(tasks, config) {
  const budget = config.session_minutes * config.daily_sessions;
  const items = tasks
    .filter((task) => task.status === "pending" || task.status === "running")
    .map((task) => ({ ...task, cursor: task.next_chunk || 1 }))
    .sort(compareTasks);
  const today = [];
  let left = budget;
  while (true) {
    let took = false;
    for (const task of items) {
      if (task.cursor > task.chunks) continue;
      const slice = task.chunk_sizes[task.cursor - 1];
      if (slice > left) continue;
      today.push({
        id: task.id,
        store: task.store,
        level: task.level,
        pin: task.pin || 0,
        action: task.action,
        target: task.target,
        minutes: slice,
        chunk: task.cursor,
        chunks: task.chunks,
        module: task.module,
      });
      task.cursor += 1;
      left -= slice;
      took = true;
    }
    if (!took) break;
  }
  const tomorrow = items
    .filter((task) => task.cursor <= task.chunks)
    .map((task) => ({
      id: task.id,
      store: task.store,
      level: task.level,
      action: task.action,
      target: task.target,
      chunk: task.cursor,
      chunks: task.chunks,
      minutes: task.chunk_sizes.slice(task.cursor - 1).reduce((sum, value) => sum + value, 0),
    }));
  const messageCap = Number(config.kol_messages_per_session) || 30;
  const inviteCap = Number(config.kol_custom_invites_per_session) || 10;
  let messages = 0;
  let invites = 0;
  const kept = [];
  const rolled = [];
  for (const row of today) {
    const kol = String(row.action).startsWith("kol_");
    const custom = row.action === "kol_collaborate";
    if ((kol && messages >= messageCap) || (custom && invites >= inviteCap)) {
      rolled.push(row);
      continue;
    }
    if (kol) messages += 1;
    if (custom) invites += 1;
    kept.push(row);
  }
  const seen = new Set(tomorrow.map((row) => row.id));
  for (const row of rolled) {
    if (!seen.has(row.id)) tomorrow.push({ ...row, minutes: row.minutes });
  }
  return { today: kept, tomorrow, minutes_left: left, budget };
}

export function summarize(tasks, date) {
  return {
    done: tasks.filter((task) => task.status === "done" && task.done_on === date).length,
    pending: tasks.filter((task) => task.status === "pending" || task.status === "running").length,
    blocked: tasks.filter((task) => task.status === "blocked").length,
    conflict: tasks.filter((task) => task.status === "conflict").length,
  };
}

function parseConfig(text) {
  if (!text.trim()) return {};
  if (text.trim().startsWith("{")) return JSON.parse(text);
  const out = {};
  for (const raw of text.split(/\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const split = line.indexOf(":");
    if (split < 0) continue;
    const key = line.slice(0, split).trim();
    const value = line.slice(split + 1).trim();
    out[key] = /^-?\d+$/.test(value) ? Number(value) : value;
  }
  return out;
}

export function loadConfig(text) {
  const parsed = parseConfig(text || "");
  const config = { ...DEFAULTS, ...parsed };
  if (config.session_minutes < 30 || config.session_minutes > 40) {
    return { error: "session_minutes must be from 30 to 40" };
  }
  if (config.chunk_minutes < 1 || config.chunk_minutes > config.session_minutes) {
    return { error: "chunk_minutes must fit in the session" };
  }
  if (config.daily_sessions < 1) return { error: "daily_sessions must be at least 1" };
  return { config };
}

function queuePath(dir, store) {
  if (!store || /[\\/]/.test(store) || store.includes("..")) return "";
  return join(dir, `${store}.json`);
}

function readQueue(file) {
  if (!existsSync(file)) return [];
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  return Array.isArray(parsed) ? parsed : [];
}

function writeQueue(file, tasks) {
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, `${JSON.stringify(tasks, null, 2)}\n`);
}

function lockFile(dir) {
  return join(dir, "session-store.txt");
}

function runningStore(dir) {
  const file = lockFile(dir);
  if (!existsSync(file)) return "";
  return readFileSync(file, "utf8").trim();
}

export function runGate(platform, market, action, text) {
  const gateAction = GATE_ACTION[action] || "read";
  const script = new URL("./policy-gate.mjs", import.meta.url);
  const args = [script.pathname, "--platform", platform, "--market", market, "--action", gateAction];
  if (text) args.push("--text", text);
  const result = spawnSync(process.execPath, args, { encoding: "utf8" });
  const lines = `${result.stdout || ""}\n${result.stderr || ""}`.split(/\n/).filter((line) => line.startsWith("result: "));
  return lines.length ? lines[lines.length - 1].slice("result: ".length).trim() : "POLICY_PENDING";
}

function exportCsv(tasks) {
  const header = ["store", "platform", "level", "pin", "action", "target", "status", "chunk", "chunks", "minutes", "gate", "day"];
  const lines = [header.join(",")];
  for (const task of tasks) {
    const day = task.status === "done" ? "done" : task.status === "conflict" || task.status === "blocked" ? "hold" : "pending";
    const minutes = (task.chunk_sizes || []).reduce((sum, value) => sum + value, 0);
    lines.push([
      task.store, task.platform, task.level, task.pin || 0, task.action, task.target, task.status,
      task.next_chunk || 1, task.chunks || 1, minutes, task.gate || "", day,
    ].map((value) => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    }).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function printPlan(plan) {
  plan.today.forEach((row, index) => {
    console.log(`today ${index + 1} ${row.level} ${row.action} ${row.store} ${row.target} ${row.minutes}m chunk ${row.chunk}/${row.chunks}`);
  });
  plan.tomorrow.forEach((row, index) => {
    console.log(`tomorrow ${index + 1} ${row.level} ${row.action} ${row.store} ${row.target} ${row.minutes}m from chunk ${row.chunk}/${row.chunks}`);
  });
  console.log(`fits_today: ${plan.today.length}`);
  console.log(`moves_tomorrow: ${plan.tomorrow.length}`);
  console.log(`minutes_left: ${plan.minutes_left}`);
  console.log(`budget: ${plan.budget}`);
}

function main() {
  const store = arg("--store");
  const dir = arg("--queue-dir") || join(homedir(), ".automate-ecom-store", "data", "queues");
  const configText = arg("--config") && existsSync(arg("--config")) ? readFileSync(arg("--config"), "utf8") : "";
  const loaded = loadConfig(configText);
  if (loaded.error) {
    console.error(loaded.error);
    process.exit(2);
  }
  const config = loaded.config;
  if (!store) {
    console.error("usage: node task-queue.mjs --store <STORE> (--enqueue | --plan | --summary --date YYYY-MM-DD | --reorder ids | --checkpoint --id id --note text | --done --id id)");
    process.exit(2);
  }
  const file = queuePath(dir, store);
  if (!file) {
    console.error("store label is not a single path segment");
    process.exit(2);
  }
  const tasks = readQueue(file);
  const other = runningStore(dir);

  if (process.argv.includes("--enqueue")) {
    const action = arg("--action");
    const platform = arg("--platform");
    const market = arg("--market");
    const target = arg("--target");
    if (!action || !platform || !market || !target) {
      console.error("enqueue needs --action --platform --market --target");
      process.exit(2);
    }
    let params = {};
    if (arg("--params")) {
      try { params = JSON.parse(arg("--params")); } catch (error) {
        console.error(`params_error: ${error.message}`);
        process.exit(2);
      }
    }
    const gateResult = process.env.TASK_QUEUE_TEST === "1" && arg("--gate-result")
      ? arg("--gate-result")
      : runGate(platform, market, action, arg("--text"));
    const outcome = enqueueTask(tasks, {
      id: arg("--id") || `t${tasks.length + 1}`,
      store,
      platform,
      market,
      action,
      target,
      params,
      module: arg("--module"),
      level: arg("--level"),
      pin: arg("--pin") || 0,
      score: arg("--score"),
      minutes: arg("--minutes") ? Number(arg("--minutes")) : config.chunk_minutes,
      source: arg("--source") || "owner",
    }, arg("--now") || new Date().toISOString(), config, gateResult);
    if (outcome.error) {
      console.error(outcome.error);
      process.exit(2);
    }
    writeQueue(file, tasks);
    console.log(`gate: ${outcome.task.gate}`);
    console.log(`id: ${outcome.task.id}`);
    console.log(`status: ${outcome.task.status}`);
    console.log(`result: ${outcome.result}`);
    if (outcome.result === "BLOCKED" || outcome.result === "CONFLICT") process.exit(1);
    return;
  }

  if (process.argv.includes("--reorder")) {
    const ids = arg("--ids").split(",").map((item) => item.trim()).filter(Boolean);
    ids.forEach((id, index) => {
      const task = tasks.find((item) => item.id === id);
      if (task) task.pin = ids.length - index;
    });
    writeQueue(file, tasks);
    console.log(`pins: ${ids.join(" ")}`);
    console.log("result: REORDERED");
    return;
  }

  if (process.argv.includes("--checkpoint") || process.argv.includes("--done")) {
    const task = tasks.find((item) => item.id === arg("--id"));
    if (!task) {
      console.error("id not found");
      process.exit(2);
    }
    task.checkpoint = arg("--note") || task.checkpoint;
    if (!process.argv.includes("--done")) task.next_chunk += 1;
    if (process.argv.includes("--done") || task.next_chunk > task.chunks) {
      task.status = "done";
      task.done_on = arg("--date") || new Date().toISOString().slice(0, 10);
      task.next_chunk = task.chunks + 1;
    } else {
      task.status = "pending";
    }
    const stillRunning = tasks.some((item) => item.status === "running");
    if (!stillRunning && existsSync(lockFile(dir)) && runningStore(dir) === store) writeFileSync(lockFile(dir), "");
    writeQueue(file, tasks);
    console.log(`checkpoint: ${task.checkpoint || "saved"}`);
    console.log(`status: ${task.status}`);
    console.log("result: SAVED");
    return;
  }

  if (process.argv.includes("--summary")) {
    const counts = summarize(tasks, arg("--date"));
    console.log(`done: ${counts.done}`);
    console.log(`pending: ${counts.pending}`);
    console.log(`blocked: ${counts.blocked}`);
    console.log(`conflict: ${counts.conflict}`);
    console.log("result: SUMMARY");
    return;
  }

  if (other && other !== store) {
    console.log(`busy_store: ${other}`);
    console.log("result: BUSY");
    process.exit(1);
  }
  if (process.argv.includes("--start")) {
    const preview = planDay(tasks, config);
    const first = preview.today[0];
    if (!first) {
      console.log("result: EMPTY");
      process.exit(1);
    }
    const task = tasks.find((item) => item.id === first.id);
    task.status = "running";
    writeFileSync(lockFile(dir), `${store}\n`);
    writeQueue(file, tasks);
    console.log(`id: ${task.id}`);
    console.log(`chunk: ${task.next_chunk}/${task.chunks}`);
    console.log("result: STARTED");
    return;
  }
  const plan = planDay(tasks, config);
  printPlan(plan);
  if (arg("--out")) writeFileSync(arg("--out"), exportCsv(tasks));
  console.log("result: PLAN");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
