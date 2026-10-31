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

function noteMissing(hooks, spec) {
  hooks.missing = [...(hooks.missing || []), spec?.name || spec?.path || String(spec)];
}

async function clickNamed(page, spec, hooks) {
  const box = await page.box(spec);
  if (!box) {
    noteMissing(hooks, spec);
    return false;
  }
  await hooks.move({ x: box.x + (box.width || 0) / 2, y: box.y + (box.height || 0) / 2 });
  await page.click(spec);
  hooks.actions += 1;
  return true;
}

async function openNav(page, spec, hooks, home) {
  if (spec?.path && typeof page.goto === "function") {
    const absolute = /^https?:/i.test(spec.path) ? spec.path : new URL(spec.path, home || page.url()).toString();
    await page.goto(absolute);
    hooks.actions += 1;
    const landed = typeof page.url === "function" ? page.url() : "";
    if (landed.includes(String(spec.path).replace(/^\//, ""))) return true;
  }
  if (!spec?.role && !spec?.css) {
    noteMissing(hooks, spec);
    return false;
  }
  return clickNamed(page, spec, hooks);
}

function withQuery(spec, query) {
  if (!spec) return null;
  if (!spec.css || !spec.css.includes("{query}")) return spec;
  if (!query) return null;
  return { ...spec, css: spec.css.replaceAll("{query}", String(query).replace(/["\\]/g, "")) };
}

function missing(hooks, actions) {
  return { result: "NAV_MISSING", actions, missing: hooks.missing };
}

async function typeInto(page, spec, text, hooks) {
  // Never type unless the box was really found and focused; otherwise the keys land wherever focus is.
  if (!spec || await page.fill(spec, "") === false) {
    noteMissing(hooks, spec);
    return false;
  }
  await hooks.type(text);
  hooks.actions += 1;
  // Some search boxes restore an old keyword while we type. Read it back and set the exact text if it drifted.
  if (page.value) {
    const typed = await page.value(spec);
    if (typeof typed === "string" && typed !== text) {
      await page.fill(spec, text);
      hooks.drift = (hooks.drift || 0) + 1;
    }
  }
  return true;
}

function norm(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** True when the query or the open page names a protected product or SKU. */
export function hitsProtected(text, protect = []) {
  const hay = norm(text);
  return protect.map(norm).filter(Boolean).find((token) => hay.includes(token)) || null;
}

/** The field must already hold the product we searched for, or we are on the wrong box. */
export function fieldMatches(previous, query) {
  const words = norm(query).split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
  if (!previous || !words.length) return Boolean(previous);
  const value = norm(previous);
  return words.some((w) => value.includes(w));
}

/** Type the text, then clear it again: a preview that sends nothing. */
async function previewOnly(page, spec, text, hooks, result, actionKey) {
  if (!await typeInto(page, spec, text, hooks)) return { result: "NAV_MISSING", actions: hooks.actions, missing: hooks.missing };
  await page.fill(spec, "");
  hooks.actions += 1;
  const left = page.value ? await page.value(spec) : "";
  // Our own text left in the box is a failed revert. Text the browser filled in by itself is only noted.
  if (left && norm(left).includes(norm(text))) return { result: "REVERT_FAILED", actions: hooks.actions, actionKey };
  return { result, actions: hooks.actions, actionKey, foreign: left ? true : undefined };
}

function unsafeText(text) {
  return /\b(refund|money back)\b/i.test(text)
    || /whatsapp|https?:\/\//i.test(text)
    || /\b5\s*stars?\b/i.test(text)
    || /voucher if you/i.test(text);
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
    if (!await openNav(page, selectors.affiliate.nav, hooks, selectors.home)) return missing(hooks, hooks.actions);
    if (hooks.actions >= limit) return { result: "LIMIT", actions: hooks.actions };
    if (request.handle && !await typeInto(page, selectors.affiliate.search, request.handle, hooks)) return missing(hooks, hooks.actions);
    if (request.mode !== "full" || !request.handle) return { result: "READ", actions: hooks.actions };
    const gate = write("submit", request.handle);
    if (gate.result !== "RUN") return { result: gate.result, actions: hooks.actions };
    if (hooks.actions >= limit) return { result: "LIMIT", actions: hooks.actions, actionKey: gate.actionKey };
    if (request.send === false) {
      if (!await page.box(selectors.affiliate.invite)) {
        noteMissing(hooks, selectors.affiliate.invite);
        return missing(hooks, hooks.actions);
      }
      return { result: "READY_NOT_SENT", actions: hooks.actions, actionKey: gate.actionKey };
    }
    if (!await clickNamed(page, selectors.affiliate.invite, hooks)) return missing(hooks, hooks.actions);
    return { result: "INVITED", actions: hooks.actions, actionKey: gate.actionKey };
  }

  if (request.module === "listing.edit") {
    const protect = request.protect || [];
    const blocked = hitsProtected(request.query, protect);
    if (blocked) return { result: "PROTECTED", actions: hooks.actions };
    if (!await openNav(page, selectors.listing.nav, hooks, selectors.home)) return missing(hooks, hooks.actions);
    if (request.query && selectors.listing.search) {
      if (!await typeInto(page, selectors.listing.search, request.query, hooks)) return missing(hooks, hooks.actions);
      if (page.keyboard?.press) await page.keyboard.press("Enter").catch(() => {});
      if (page.wait) await page.wait(4000);
    }
    if (hooks.actions >= limit) return { result: "LIMIT", actions: hooks.actions };
    // Writes only ever target a named product; without --query the module just reads.
    if (request.mode === "full" && !request.query) return { result: "READ", actions: hooks.actions };
    const byQuery = selectors.listing.row?.byQuery || "link";
    const row = request.query ? { role: byQuery, name: request.query } : selectors.listing.row;
    // A row whose own edit button opens the form needs no click on the name first.
    const edit = withQuery(selectors.listing.edit, request.query);
    const afterSearch = Boolean(selectors.listing.edit?.afterSearch && request.query);
    const rowHasEdit = afterSearch || Boolean(selectors.listing.edit?.css?.includes("{query}"));
    if (afterSearch && page.count) {
      // After the search only one product may be left, or we could open the wrong one.
      const rows = await page.count(edit);
      if (rows !== 1) return { result: rows ? "AMBIGUOUS" : "NAV_MISSING", actions: hooks.actions, missing: rows ? undefined : [edit.name || "Edit"] };
    }
    if (!rowHasEdit && (!row || !await clickNamed(page, row, hooks))) return missing(hooks, hooks.actions);
    if (edit && !await clickNamed(page, edit, hooks)) return missing(hooks, hooks.actions);
    if (protect.length && page.allText && hitsProtected(await page.allText(), protect)) return { result: "PROTECTED", actions: hooks.actions };
    const previous = await page.value(selectors.listing.field);
    if (previous == null) {
      noteMissing(hooks, selectors.listing.field?.name || "field");
      return missing(hooks, hooks.actions);
    }
    if (request.query && !fieldMatches(previous, request.query)) return { result: "FIELD_MISMATCH", actions: hooks.actions };
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
      const after = await page.value(selectors.listing.field);
      if (after !== previous) return { result: "REVERT_FAILED", actions: hooks.actions, actionKey: gate.actionKey, previous };
    }
    return { result: "EDITED", actions: hooks.actions, actionKey: gate.actionKey, previous };
  }

  if (request.module === "ads.read" || request.module === "ads.spend-topup") {
    if (!await openNav(page, selectors.ads.nav, hooks, selectors.home)) return missing(hooks, hooks.actions);
    const spend = await page.textOf(selectors.ads.spend);
    return { result: "READ", actions: hooks.actions, spend };
  }

  if (request.module === "ads.change") {
    if (!await openNav(page, selectors.ads.nav, hooks, selectors.home)) return missing(hooks, hooks.actions);
    if (request.mode !== "full") return { result: "READ", actions: hooks.actions };
    const gate = write("publish", request.day);
    if (gate.result !== "RUN") return { result: gate.result, actions: hooks.actions };
    if (hooks.actions + 2 > limit) return { result: "LIMIT", actions: hooks.actions, actionKey: gate.actionKey };
    const state = async () => (page.checked ? page.checked(selectors.ads.toggle) : null);
    // No running or paused campaign on the page means there is nothing to flip; that is not a broken menu.
    if (!await page.box(selectors.ads.toggle)) return { result: "NO_TOGGLE", actions: hooks.actions };
    const before = await state();
    if (!await clickNamed(page, selectors.ads.toggle, hooks)) return missing(hooks, hooks.actions);
    const flipped = await state();
    if (!await clickNamed(page, selectors.ads.toggle, hooks)) return { result: "REVERT_FAILED", actions: hooks.actions, actionKey: gate.actionKey, before, after: flipped };
    const after = await state();
    if (before !== null && after !== before) return { result: "REVERT_FAILED", actions: hooks.actions, actionKey: gate.actionKey, before, after };
    return { result: "REVERTED", actions: hooks.actions, actionKey: gate.actionKey, before, flipped, after };
  }

  if (request.module === "customers.chat") {
    if (!await openNav(page, selectors.chat.nav, hooks, selectors.home)) return missing(hooks, hooks.actions);
    const opened = selectors.chat.thread ? await clickNamed(page, selectors.chat.thread, hooks) : false;
    if (request.mode !== "full" || !request.value) return { result: "READ", actions: hooks.actions };
    // Reply only inside an existing buyer thread. No thread means nothing to answer.
    if (!opened) return { result: "NO_THREAD", actions: hooks.actions, missing: hooks.missing };
    if (unsafeText(request.value)) return { result: "BLOCK", actions: hooks.actions };
    const gate = write("submit", request.day);
    if (gate.result !== "RUN") return { result: gate.result, actions: hooks.actions };
    if (hooks.actions + 2 > limit) return { result: "LIMIT", actions: hooks.actions, actionKey: gate.actionKey };
    if (!selectors.chat.box || !selectors.chat.send) return missing(hooks, hooks.actions);
    if (request.send === false) return previewOnly(page, selectors.chat.box, request.value, hooks, "TYPED_NOT_SENT", gate.actionKey);
    if (!await typeInto(page, selectors.chat.box, request.value, hooks)) return missing(hooks, hooks.actions);
    if (!await clickNamed(page, selectors.chat.send, hooks)) return missing(hooks, hooks.actions);
    return { result: "SENT", actions: hooks.actions, actionKey: gate.actionKey };
  }

  if (request.module === "reviews.replies") {
    if (!await openNav(page, selectors.reviews.nav, hooks, selectors.home)) return missing(hooks, hooks.actions);
    if (request.mode !== "full" || !request.value) return { result: "READ", actions: hooks.actions };
    if (unsafeText(request.value)) return { result: "BLOCK", actions: hooks.actions };
    const gate = write("submit", request.day);
    if (gate.result !== "RUN") return { result: gate.result, actions: hooks.actions };
    if (hooks.actions + 3 > limit) return { result: "LIMIT", actions: hooks.actions, actionKey: gate.actionKey };
    if (!selectors.reviews.reply) return missing(hooks, hooks.actions);
    // No review waiting for an answer is a normal empty queue.
    if (!await page.box(selectors.reviews.reply)) return { result: "NO_REVIEW", actions: hooks.actions };
    if (!await clickNamed(page, selectors.reviews.reply, hooks)) return missing(hooks, hooks.actions);
    if (request.send === false) return previewOnly(page, selectors.reviews.box, request.value, hooks, "TYPED_NOT_SENT", gate.actionKey);
    if (!await typeInto(page, selectors.reviews.box, request.value, hooks)) return missing(hooks, hooks.actions);
    if (!await clickNamed(page, selectors.reviews.send, hooks)) return missing(hooks, hooks.actions);
    return { result: "REPLIED", actions: hooks.actions, actionKey: gate.actionKey };
  }

  if (request.module === "selling.promotion") {
    if (!await openNav(page, selectors.promo.nav, hooks, selectors.home)) return missing(hooks, hooks.actions);
    if (request.mode !== "full") return { result: "READ", actions: hooks.actions };
    const gate = write("submit", request.day);
    if (gate.result !== "RUN") return { result: gate.result, actions: hooks.actions };
    if (hooks.actions + 4 > limit) return { result: "LIMIT", actions: hooks.actions, actionKey: gate.actionKey };
    const name = request.value || "TEST DRAFT";
    if (!selectors.promo.create || !await clickNamed(page, selectors.promo.create, hooks)) return missing(hooks, hooks.actions);
    if (request.send === false) {
      // Fill the name, then leave the form unsaved: nothing is created on the shop.
      if (!selectors.promo.name) return { result: "OPENED_NOT_SAVED", actions: hooks.actions, actionKey: gate.actionKey };
      return previewOnly(page, selectors.promo.name, name, hooks, "TYPED_NOT_SAVED", gate.actionKey);
    }
    if (selectors.promo.name && !await typeInto(page, selectors.promo.name, name, hooks)) return missing(hooks, hooks.actions);
    if (!selectors.promo.save || !await clickNamed(page, selectors.promo.save, hooks)) return missing(hooks, hooks.actions);
    if (!selectors.promo.delete || !await clickNamed(page, selectors.promo.delete, hooks)) return missing(hooks, hooks.actions);
    return { result: "REVERTED", actions: hooks.actions, actionKey: gate.actionKey };
  }

  const key = GENERIC[request.module] || "report";
  const nav = selectors[key]?.nav || selectors.report.nav;
  const opened = await openNav(page, nav, hooks, selectors.home);
  if (!opened) return missing(hooks, hooks.actions);
  return { result: "READ", actions: hooks.actions, landed: page.url ? new URL(page.url()).pathname : undefined };
}
