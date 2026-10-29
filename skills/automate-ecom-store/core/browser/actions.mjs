/**
 * Page actions for seller centres. Selectors live in JSON so a label change
 * does not require a code change. Does not open AdsPower by itself.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { guardWrite, handleCaptcha, looksLikeLogin, looksUnavailable } from "./adspower-runner.mjs";

const here = dirname(fileURLToPath(import.meta.url));

const GENERIC = {
  "customers.chat": "chat",
  "selling.promotion": "promo",
  "orders.handling": "orders",
  "reviews.replies": "reviews",
  "ops.daily-report": "report",
  "homepage.decoration": "shop",
  "content.video-live": "video",
  "affiliate.post-invite": "affiliate",
  "inventory.stock-price": "listing",
  "listing.product": "listing",
};

export function loadSelectors(platform) {
  const name = String(platform || "").toLowerCase();
  if (!["shopee", "tiktokshop", "lazada"].includes(name)) {
    throw new Error("platform must be shopee, tiktokshop, or lazada");
  }
  return JSON.parse(readFileSync(join(here, "selectors", `${name}.json`), "utf8"));
}

async function gatePage(page, hooks) {
  const text = await page.text();
  if (looksLikeLogin(page.url ? page.url() : "", text)) {
    await hooks.alert({ kind: "login" });
    return "login";
  }
  if (looksUnavailable(text)) {
    await hooks.alert({ kind: "unavailable" });
    return "pause";
  }
  const captcha = await handleCaptcha(page, hooks);
  if (captcha === "pause") return "pause";
  return "ok";
}

async function clickNamed(page, spec, hooks) {
  const box = await page.box(spec);
  if (!box) {
    hooks.missing = [...(hooks.missing || []), spec.name || String(spec)];
    return false;
  }
  await hooks.move({ x: box.x + (box.width || 0) / 2, y: box.y + (box.height || 0) / 2 });
  await page.click(spec);
  hooks.actions += 1;
  return true;
}

export async function runModule(page, request, hooks) {
  const selectors = loadSelectors(request.platform);
  hooks.actions = hooks.actions || 0;
  hooks.dragged = false;
  if (page.goto && selectors.home && request.openHome !== false) await page.goto(request.home || selectors.home);
  const status = await gatePage(page, hooks);
  if (status === "ok" && page.dismiss) await page.dismiss(selectors.popupClose || []);
  if (status === "login") return { result: "LOGIN_REQUIRED", actions: hooks.actions };
  if (status === "pause") return { result: "PAUSE", actions: hooks.actions };
  const limit = request.maxActions;
  const write = (action, target) => guardWrite({
    store: request.store,
    manifest: request.manifest,
    action,
    target,
    day: request.day,
    journalRows: request.journalRows,
    policyResult: request.policyResult,
  });

  if (request.module === "affiliate.invite") {
    await clickNamed(page, selectors.affiliate.nav, hooks);
    if (hooks.actions >= limit) return { result: "LIMIT", actions: hooks.actions };
    if (request.handle) {
      await page.fill(selectors.affiliate.search, "");
      await hooks.type(request.handle);
      hooks.actions += 1;
    }
    if (request.mode !== "full" || !request.handle) return { result: "READ", actions: hooks.actions };
    const gate = write("submit", request.handle);
    if (gate.result !== "RUN") return { result: gate.result, actions: hooks.actions };
    if (hooks.actions >= limit) return { result: "LIMIT", actions: hooks.actions, actionKey: gate.actionKey };
    await clickNamed(page, selectors.affiliate.invite, hooks);
    return { result: "INVITED", actions: hooks.actions, actionKey: gate.actionKey };
  }

  if (request.module === "listing.edit") {
    await clickNamed(page, selectors.listing.nav, hooks);
    if (request.query) {
      await hooks.type(request.query);
      hooks.actions += 1;
    }
    if (hooks.actions >= limit) return { result: "LIMIT", actions: hooks.actions };
    await clickNamed(page, selectors.listing.edit, hooks);
    const previous = await page.value(selectors.listing.field);
    if (request.mode !== "full") return { result: "READ", actions: hooks.actions, previous };
    const gate = write("publish", request.query || request.day);
    if (gate.result !== "RUN") return { result: gate.result, actions: hooks.actions, previous };
    if (hooks.actions + 1 > limit) return { result: "LIMIT", actions: hooks.actions, actionKey: gate.actionKey, previous };
    await page.fill(selectors.listing.field, "");
    await hooks.type(request.value || "");
    hooks.actions += 1;
    if (request.revert !== false) {
      await page.fill(selectors.listing.field, previous);
      hooks.actions += 1;
    }
    return { result: "EDITED", actions: hooks.actions, actionKey: gate.actionKey, previous };
  }

  if (request.module === "ads.read" || request.module === "ads.spend-topup") {
    if (!await clickNamed(page, selectors.ads.nav, hooks)) return { result: "NAV_MISSING", actions: hooks.actions, missing: hooks.missing };
    const spend = await page.textOf(selectors.ads.spend);
    return { result: "READ", actions: hooks.actions, spend };
  }

  if (request.module === "ads.change") {
    await clickNamed(page, selectors.ads.nav, hooks);
    if (request.mode !== "full") return { result: "READ", actions: hooks.actions };
    const gate = write("publish", request.day);
    if (gate.result !== "RUN") return { result: gate.result, actions: hooks.actions };
    if (hooks.actions + 2 > limit) return { result: "LIMIT", actions: hooks.actions, actionKey: gate.actionKey };
    await clickNamed(page, selectors.ads.toggle, hooks);
    await clickNamed(page, selectors.ads.toggle, hooks);
    return { result: "REVERTED", actions: hooks.actions, actionKey: gate.actionKey };
  }

  const key = GENERIC[request.module] || "report";
  const nav = selectors[key]?.nav || selectors.report.nav;
  const opened = await clickNamed(page, nav, hooks);
  if (!opened) return { result: "NAV_MISSING", actions: hooks.actions, missing: hooks.missing };
  return { result: "READ", actions: hooks.actions, landed: page.url ? new URL(page.url()).pathname : undefined };
}
