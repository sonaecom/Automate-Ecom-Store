#!/usr/bin/env node
/**
 * Day plan for up to 10 stores. Does not open AdsPower.
 * A captcha pauses only that store. A hung profile is restarted.
 * A done action key is not run again.
 *
 *   node orchestrator.mjs --stores file --now HH:MM --out-dir DIR
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { CEILINGS } from "../core/targets.mjs";

export function inNight(nowMinutes, nightStart, hours) {
  const span = hours * 60;
  const end = (nightStart + span) % 1440;
  if (nightStart < end) return nowMinutes >= nightStart && nowMinutes < end;
  return nowMinutes >= nightStart || nowMinutes < end;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function tickStores(stores, options) {
  const now = options.nowMinutes;
  const night = inNight(now, options.nightStart, CEILINGS.nightOffHours);
  const accepted = stores.slice(0, CEILINGS.maxStores);
  const overflow = stores.slice(CEILINGS.maxStores);
  const rows = overflow.map((store) => ({
    store: store.id,
    action: "REJECT_STORE",
    detail: "max_10",
  }));
  let opened = false;
  accepted.forEach((store, index) => {
    const batch = clamp(store.batchMinutes || 45, CEILINGS.batchMinutesMin, CEILINGS.batchMinutesMax);
    const pause = clamp(store.breakMinutes || 15, CEILINGS.breakMinutesMin, CEILINGS.breakMinutesMax);
    const start = (options.dayStart + index * (options.staggerMinutes || 20)) % 1440;
    if (night) {
      rows.push({ store: store.id, action: "WAIT", detail: "night_off" });
      return;
    }
    if (store.captcha) {
      rows.push({ store: store.id, action: "CAPTCHA_PAUSE", detail: "this_store_only" });
      return;
    }
    if (store.hung) {
      rows.push({ store: store.id, action: "RESTART", detail: "hung_profile" });
      return;
    }
    if (store.pendingKey && !store.doneKeys?.includes(store.pendingKey)) {
      rows.push({ store: store.id, action: "RESUME", detail: store.pendingKey });
      return;
    }
    if (store.doneKeys?.includes(store.pendingKey)) {
      rows.push({ store: store.id, action: "SKIP", detail: store.pendingKey || "" });
      return;
    }
    const sinceStart = (now - start + 1440) % 1440;
    if (sinceStart < batch && !opened) {
      rows.push({ store: store.id, action: store.open ? "WORK" : "OPEN", detail: `batch_${batch}` });
      opened = true;
      return;
    }
    if (sinceStart < batch + pause) {
      rows.push({ store: store.id, action: "CLOSE", detail: `break_${pause}` });
      return;
    }
    rows.push({ store: store.id, action: "WAIT", detail: "next_stagger" });
  });
  return rows;
}

export function profileStep(action) {
  if (action === "OPEN" || action === "RESTART") {
    return { tool: "open-browser", headless: "0", close_first: action === "RESTART" ? "yes" : "no" };
  }
  if (action === "CLOSE") return { tool: "close-browser", headless: "0" };
  return { tool: "none", headless: "0" };
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function minutes(hhmm) {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm || "");
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function main() {
  const file = arg("--stores");
  const outDir = arg("--out-dir");
  const now = minutes(arg("--now"));
  if (!file || !outDir || now === null) {
    console.error("usage: node orchestrator.mjs --stores file --now HH:MM --out-dir DIR [--night-start HH:MM]");
    process.exit(2);
  }
  const stores = JSON.parse(readFileSync(file, "utf8"));
  const nightStart = minutes(arg("--night-start") || "01:00");
  const rows = tickStores(stores, { nowMinutes: now, nightStart, dayStart: minutes(arg("--day-start") || "08:00"), staggerMinutes: Number(arg("--stagger") || 20) });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "orchestrator-plan.csv"), `store,action,detail\n${rows.map((row) => `${row.store},${row.action},${row.detail}`).join("\n")}\n`);
  for (const row of rows) {
    const step = profileStep(row.action);
    console.log(`${row.action} ${row.store} ${row.detail} tool=${step.tool} headless=${step.headless}`);
  }
  console.log(`stores: ${Math.min(stores.length, CEILINGS.maxStores)}`);
  console.log("result: PLAN");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
