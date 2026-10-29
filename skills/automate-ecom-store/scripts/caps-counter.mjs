#!/usr/bin/env node
/**
 * Count session and daily actions for one store computer.
 *
 * The state file is JSON under data/ (gitignored). It stores counts, a local
 * day, session start/end, a pace multiplier, and an optional block time.
 * It must not store profile ids, addresses, keys, or names.
 *
 * Usage:
 *   node caps-counter.mjs --state path --new-session
 *   node caps-counter.mjs --state path --show --gap-hours 2
 *   node caps-counter.mjs --state path --action affiliate_invites --add 1 \
 *     --session-limit 30 --daily-limit 30
 *   node caps-counter.mjs --state path --check-duration --max-minutes 40
 *   node caps-counter.mjs --state path --set-multiplier 2
 *   node caps-counter.mjs --state path --end-session --block-minutes 30
 *
 * --add refuses, and does not change counts, when the add would pass a limit.
 * Exit 0: result OK, READY, LOGGED, or ENDED.
 * Exit 1: result CAP, TIME_UP, TOO_SOON, or BLOCKED.
 * Exit 2: usage or file error.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

function usage() {
  console.error(
    "usage: node caps-counter.mjs --state path [--new-session | --show --gap-hours n | --action name --add n --session-limit n --daily-limit n | --check-duration --max-minutes n | --set-multiplier n | --end-session [--block-minutes n]]",
  );
}

function parseArgs(argv) {
  const out = {
    state: null,
    command: null,
    gapHours: null,
    action: null,
    add: null,
    sessionLimit: null,
    dailyLimit: null,
    maxMinutes: null,
    multiplier: null,
    blockMinutes: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--state") {
      out.state = argv[i + 1];
      i += 1;
    } else if (arg === "--new-session") out.command = "new";
    else if (arg === "--show") out.command = "show";
    else if (arg === "--check-duration") out.command = "duration";
    else if (arg === "--end-session") out.command = "end";
    else if (arg === "--set-multiplier") {
      out.command = "multiplier";
      out.multiplier = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--gap-hours") {
      out.gapHours = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--action") {
      out.command = out.command || "add";
      out.action = argv[i + 1];
      i += 1;
    } else if (arg === "--add") {
      out.command = "add";
      out.add = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--session-limit") {
      out.sessionLimit = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--daily-limit") {
      out.dailyLimit = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--max-minutes") {
      out.maxMinutes = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--block-minutes") {
      out.blockMinutes = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--help" || arg === "-h") return { help: true };
    else return { error: `unknown argument: ${arg}` };
  }
  if (!out.state) return { error: "--state is required" };
  if (!out.command) return { error: "choose one command" };
  return out;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function localParts(date = new Date()) {
  return {
    day: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    stamp: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    ms: date.getTime(),
  };
}

function parseLocal(stamp) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(stamp || "");
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  return new Date(year, month - 1, day, hour, minute, second).getTime();
}

function blankState(now) {
  return {
    version: 1,
    day: now.day,
    session_id: "",
    started_at: "",
    ended_at: "",
    blocked_until: "",
    pace_multiplier: 1,
    session: {},
    daily: {},
  };
}

function load(path, now) {
  try {
    const text = readFileSync(path, "utf8");
    if (text.trim() === "") return blankState(now);
    const parsed = JSON.parse(text);
    parsed.session ||= {};
    parsed.daily ||= {};
    parsed.pace_multiplier = Number(parsed.pace_multiplier) || 1;
    return parsed;
  } catch (error) {
    if (error.code === "ENOENT") return blankState(now);
    throw error;
  }
}

function rollover(state, now) {
  if (state.day === now.day) return false;
  state.day = now.day;
  state.daily = {};
  return true;
}

function save(path, state) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function gate(state, now, gapHours) {
  const blockedMs = parseLocal(state.blocked_until);
  if (blockedMs !== null && blockedMs > now.ms) return "BLOCKED";
  if (gapHours === null) return "READY";
  const endedMs = parseLocal(state.ended_at);
  if (endedMs === null) return "READY";
  const gapMs = gapHours * 60 * 60 * 1000;
  if (now.ms - endedMs < gapMs) return "TOO_SOON";
  return "READY";
}

function printCounts(state) {
  const names = new Set([...Object.keys(state.session), ...Object.keys(state.daily)]);
  if (names.size === 0) console.log("counts: none");
  for (const name of [...names].sort()) {
    console.log(`count ${name} session=${state.session[name] || 0} daily=${state.daily[name] || 0}`);
  }
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

  const now = localParts();
  let state;
  try {
    state = load(parsed.state, now);
  } catch (error) {
    console.error(`read_error: ${error.message}`);
    process.exit(2);
  }
  const reset = rollover(state, now);
  console.log(`state_path: ${parsed.state}`);
  console.log(`day: ${state.day}`);
  console.log(`daily_reset: ${reset ? "yes" : "no"}`);

  if (parsed.command === "new") {
    state.session = {};
    state.started_at = now.stamp;
    state.ended_at = "";
    state.blocked_until = "";
    state.pace_multiplier = 1;
    state.session_id = `s${now.stamp.replaceAll(/[-:T]/g, "")}`;
    save(parsed.state, state);
    console.log(`session_id: ${state.session_id}`);
    console.log(`started_at: ${state.started_at}`);
    console.log("pace_multiplier: 1");
    console.log("result: OK");
    return;
  }

  if (parsed.command === "multiplier") {
    if (!Number.isInteger(parsed.multiplier) || parsed.multiplier < 1 || parsed.multiplier > 8) {
      console.error("--set-multiplier must be a whole number from 1 to 8");
      process.exit(2);
    }
    state.pace_multiplier = parsed.multiplier;
    save(parsed.state, state);
    console.log(`pace_multiplier: ${state.pace_multiplier}`);
    console.log("result: OK");
    return;
  }

  if (parsed.command === "end") {
    state.ended_at = now.stamp;
    if (parsed.blockMinutes !== null) {
      if (!Number.isInteger(parsed.blockMinutes) || parsed.blockMinutes < 1) {
        console.error("--block-minutes must be a positive whole number");
        process.exit(2);
      }
      const until = new Date(now.ms + parsed.blockMinutes * 60 * 1000);
      state.blocked_until = localParts(until).stamp;
    }
    save(parsed.state, state);
    console.log(`ended_at: ${state.ended_at}`);
    console.log(`blocked_until: ${state.blocked_until || "none"}`);
    console.log("result: ENDED");
    return;
  }

  if (parsed.command === "duration") {
    if (!Number.isInteger(parsed.maxMinutes) || parsed.maxMinutes < 1) {
      console.error("--max-minutes must be a positive whole number");
      process.exit(2);
    }
    const started = parseLocal(state.started_at);
    if (started === null) {
      console.error("duration_error: start a session before checking duration");
      process.exit(2);
    }
    const elapsed = Math.floor((now.ms - started) / 60000);
    console.log(`elapsed_minutes: ${elapsed}`);
    console.log(`max_minutes: ${parsed.maxMinutes}`);
    if (elapsed >= parsed.maxMinutes) {
      console.log("result: TIME_UP");
      process.exit(1);
    }
    console.log("result: OK");
    return;
  }

  if (parsed.command === "add") {
    if (!/^[a-z0-9_]+$/.test(parsed.action || "")) {
      console.error("--action must be lowercase letters, digits, or underscores");
      process.exit(2);
    }
    if (!Number.isInteger(parsed.add) || parsed.add < 1) {
      console.error("--add must be a positive whole number");
      process.exit(2);
    }
    if (!Number.isInteger(parsed.sessionLimit) || parsed.sessionLimit < 1) {
      console.error("--session-limit must be a positive whole number");
      process.exit(2);
    }
    if (!Number.isInteger(parsed.dailyLimit) || parsed.dailyLimit < 1) {
      console.error("--daily-limit must be a positive whole number");
      process.exit(2);
    }
    const sessionUsed = state.session[parsed.action] || 0;
    const dailyUsed = state.daily[parsed.action] || 0;
    console.log(`action: ${parsed.action}`);
    console.log(`add: ${parsed.add}`);
    console.log(`session_used: ${sessionUsed}`);
    console.log(`daily_used: ${dailyUsed}`);
    console.log(`session_limit: ${parsed.sessionLimit}`);
    console.log(`daily_limit: ${parsed.dailyLimit}`);
    if (sessionUsed + parsed.add > parsed.sessionLimit || dailyUsed + parsed.add > parsed.dailyLimit) {
      if (reset) save(parsed.state, state);
      console.log("result: CAP");
      process.exit(1);
    }
    state.session[parsed.action] = sessionUsed + parsed.add;
    state.daily[parsed.action] = dailyUsed + parsed.add;
    save(parsed.state, state);
    console.log(`session_used_after: ${state.session[parsed.action]}`);
    console.log(`daily_used_after: ${state.daily[parsed.action]}`);
    console.log("result: OK");
    return;
  }

  if (parsed.gapHours !== null && (!Number.isFinite(parsed.gapHours) || parsed.gapHours < 0)) {
    console.error("--gap-hours must be a number >= 0");
    process.exit(2);
  }
  if (reset) save(parsed.state, state);
  console.log(`started_at: ${state.started_at || "none"}`);
  console.log(`ended_at: ${state.ended_at || "none"}`);
  console.log(`blocked_until: ${state.blocked_until || "none"}`);
  console.log(`pace_multiplier: ${state.pace_multiplier}`);
  printCounts(state);
  const result = gate(state, now, parsed.gapHours);
  console.log(`result: ${result}`);
  if (result !== "READY") process.exit(1);
}

main();
