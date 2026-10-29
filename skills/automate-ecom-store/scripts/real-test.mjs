#!/usr/bin/env node
/**
 * Run one module against one store with a tiny action limit.
 * The round log stores a hash of the store id, never the id itself.
 *
 *   node real-test.mjs --store <PROFILE_ID> --module listing.edit --round 1 --max-actions 3 --platform shopee --day YYYY-MM-DD --journal file
 *
 * Set ADSPOWER_API_BASE and ADSPOWER_API_KEY in the environment. Do not put them in the repo.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { adsPowerConfig, connectOverCDP, finishWrite, moveMouse, wrapPage, readKeys, scrollBy, startProfile, stopProfile, storeHash, typeWithJitter } from "../core/browser/adspower-runner.mjs";
import { runModule } from "../core/browser/actions.mjs";

const MANIFESTS = {
  "affiliate.invite": "affiliate-invite.manifest.json",
  "listing.edit": "shopee-listing-update.manifest.json",
  "ads.read": "spend-topup.manifest.json",
  "ads.spend-topup": "spend-topup.manifest.json",
  "ads.change": "ads-change.manifest.json",
  "customers.chat": "customer-chat.manifest.json",
  "selling.promotion": "promotion.manifest.json",
  "orders.handling": "order-handling.manifest.json",
  "reviews.replies": "review-reply.manifest.json",
  "ops.daily-report": "daily-report.manifest.json",
  "homepage.decoration": "shop-decoration.manifest.json",
  "content.video-live": "video-live.manifest.json",
  "affiliate.post-invite": "kol-follow.manifest.json",
  "inventory.stock-price": "stock-price.manifest.json",
  "listing.product": "product-listing.manifest.json",
};

export function roundLog(options, result) {
  return {
    round: Number(options.round),
    module: options.module,
    platform: options.platform,
    max_actions: Number(options.maxActions),
    actions: result.actions || 0,
    result: result.result,
    missing: result.missing?.length ? result.missing : undefined,
    error: result.error || undefined,
    landed: result.landed || undefined,
    store_hash: storeHash(options.store),
    at: options.now || new Date().toISOString(),
  };
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

function loadManifest(moduleName) {
  const file = MANIFESTS[moduleName];
  if (!file) return null;
  return JSON.parse(readFileSync(new URL(`../core/manifest/${file}`, import.meta.url), "utf8"));
}

export async function executeRealTest(options, deps) {
  const manifest = deps.manifest || loadManifest(options.module);
  const logPath = options.log;
  const write = (body) => {
    if (!logPath) return;
    mkdirSync(dirname(logPath), { recursive: true });
    writeFileSync(logPath, `${JSON.stringify(body, null, 2)}\n`);
  };
  if (!manifest) {
    const body = roundLog(options, { result: "UNKNOWN_MODULE", actions: 0 });
    write(body);
    return { code: 2, log: body };
  }
  let config;
  try {
    config = adsPowerConfig(deps.env || process.env);
  } catch (error) {
    const body = roundLog(options, { result: error.code || "MISSING_ENV", actions: 0 });
    write(body);
    return { code: 2, log: body };
  }
  let started;
  let connected;
  try {
    started = await startProfile({ ...config, profileId: options.store, fetchImpl: deps.fetchImpl });
    connected = await connectOverCDP(started.ws, deps);
  } catch (error) {
    if (started) await stopProfile({ ...config, profileId: options.store, fetchImpl: deps.fetchImpl }).catch(() => {});
    const body = roundLog(options, {
      result: "ERROR",
      actions: 0,
      error: String(error.message || "adspower_start_failed").replace(/ws:\/\/\S+/g, "ws").slice(0, 200),
    });
    write(body);
    return { code: 1, log: body };
  }
  const page = deps.wrap === false ? connected.page : wrapPage(connected.page);
  const random = deps.random || Math.random;
  const hooks = {
    actions: 0,
    dragged: false,
    move: (box) => moveMouse(page, { x: 0, y: 0 }, box, random, deps.sleep),
    type: (text) => typeWithJitter(page, text, random, deps.sleep),
    drag: () => deps.drag ? deps.drag(page) : page.drag(),
    screenshot: () => page.screenshot(options.shot || undefined),
    alert: (payload) => deps.alert ? deps.alert(payload) : undefined,
  };
  let outcome;
  try {
    await scrollBy(page, random, deps.sleep);
    outcome = await runModule(page, {
      platform: options.platform,
      module: options.module,
      maxActions: Number(options.maxActions),
      mode: options.mode || "read_only",
      store: { id: options.store, mode: options.mode || "read_only" },
      manifest,
      day: options.day,
      journalRows: readKeys(options.journal),
      policyResult: options.policyResult || "ALLOW",
      handle: options.handle || "",
      query: options.query || "",
      value: options.value || "",
      revert: options.revert !== false,
    }, hooks);
  } catch (error) {
    outcome = { result: "ERROR", actions: hooks.actions, error: String(error.message || error).slice(0, 200) };
  } finally {
    if (options.shot) await page.screenshot(options.shot).catch(() => {});
    await connected.browser.close().catch(() => {});
    await stopProfile({ ...config, profileId: options.store, fetchImpl: deps.fetchImpl }).catch(() => {});
  }
  if (outcome.actionKey && options.journal) finishWrite(options.journal, outcome.actionKey, outcome.result === "PAUSE" ? "pending" : "done");
  outcome.missing = outcome.missing || hooks.missing;
  const body = roundLog(options, outcome);
  write(body);
  const failed = ["PAUSE", "LOGIN_REQUIRED", "ERROR", "NAV_MISSING", "BLOCK"].includes(outcome.result);
  return { code: failed ? 1 : 0, log: body };
}

async function main() {
  const store = arg("--store");
  const moduleName = arg("--module");
  const round = arg("--round");
  const maxActions = arg("--max-actions");
  if (!store || !moduleName || !round || !maxActions) {
    console.error("usage: node real-test.mjs --store <PROFILE_ID> --module <name> --round <n> --max-actions <k> --platform shopee|tiktokshop|lazada --day YYYY-MM-DD --journal file");
    process.exit(2);
  }
  const log = arg("--log") || join(homedir(), ".automate-ecom-store", "data", "rounds", `round-${round}.json`);
  const outcome = await executeRealTest({
    store,
    module: moduleName,
    round,
    maxActions,
    platform: arg("--platform") || "shopee",
    day: arg("--day") || new Date().toISOString().slice(0, 10),
    journal: arg("--journal") || join(homedir(), ".automate-ecom-store", "data", "journal", "round.jsonl"),
    mode: arg("--mode") || "read_only",
    log,
    handle: arg("--handle"),
    query: arg("--query"),
    value: arg("--value"),
    policyResult: arg("--policy") || "ALLOW",
    shot: arg("--shot"),
  }, { env: process.env, fetchImpl: fetch });
  console.log(`round: ${outcome.log.round}`);
  console.log(`module: ${outcome.log.module}`);
  console.log(`result: ${outcome.log.result}`);
  console.log(`actions: ${outcome.log.actions}`);
  if (outcome.log.missing) console.log(`missing: ${outcome.log.missing.join(", ")}`);
  if (outcome.log.landed) console.log(`landed: ${outcome.log.landed}`);
  if (outcome.log.error) console.log(`error: ${outcome.log.error}`);
  console.log(`store_hash: ${outcome.log.store_hash}`);
  process.exit(outcome.code);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
