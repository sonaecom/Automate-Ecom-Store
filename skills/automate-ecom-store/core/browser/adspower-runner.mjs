/**
 * Open one AdsPower profile and drive a single tab with Playwright.
 * The API base and key come from the environment. Nothing here is hard-coded.
 * Money actions are refused. Writes still pass the read-only guard, policy, and journal.
 */

import { createHash } from "node:crypto";
import { clickGap, mulberry32, typePlan } from "../pace.mjs";
import { appendJournal, readJournal } from "../journal/action-key.mjs";
import { beginRun } from "../runner.mjs";

const MONEY = new Set(["topup", "withdraw", "pay", "budget"]);

export function adsPowerConfig(env = process.env) {
  const base = String(env.ADSPOWER_API_BASE || "").trim().replace(/\/$/, "");
  const apiKey = String(env.ADSPOWER_API_KEY || "").trim();
  if (!base || !apiKey) {
    const error = new Error("missing_adspower_env");
    error.code = "MISSING_ENV";
    throw error;
  }
  return { base, apiKey };
}

export function browserStartUrl(base, profileId) {
  const url = new URL("/api/v1/browser/start", `${base}/`);
  url.searchParams.set("user_id", profileId);
  url.searchParams.set("headless", "0");
  url.searchParams.set("ip_tab", "0");
  url.searchParams.set("last_opened_tabs", "0");
  return url.toString();
}

export function browserStopUrl(base, profileId) {
  const url = new URL("/api/v1/browser/stop", `${base}/`);
  url.searchParams.set("user_id", profileId);
  return url.toString();
}

export function wsFromStart(body) {
  if (!body || body.code !== 0) {
    const error = new Error("adspower_start_failed");
    error.code = "START_FAILED";
    throw error;
  }
  const ws = body.data?.ws?.puppeteer || body.data?.ws?.playwright || "";
  if (!ws) {
    const error = new Error("adspower_ws_missing");
    error.code = "WS_MISSING";
    throw error;
  }
  return ws;
}

export function curvePoints(from, to, random, steps = 8) {
  const cx = (from.x + to.x) / 2 + (random() - 0.5) * 120;
  const cy = (from.y + to.y) / 2 + (random() - 0.5) * 80;
  const points = [];
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    points.push({
      x: u * u * from.x + 2 * u * t * cx + t * t * to.x,
      y: u * u * from.y + 2 * u * t * cy + t * t * to.y,
    });
  }
  return points;
}

export function authHeaders(apiKey) {
  // The local API accepts a bearer token; the api-key header alone is refused.
  return { Authorization: `Bearer ${apiKey}`, "api-key": apiKey };
}

export function looksLikeLogin(url, text) {
  return /\/(account|seller)\/login|\/apps\/seller\/login|\/apps\/register\//i.test(String(url || ""));
}

function locate(page, spec) {
  if (typeof spec === "string") return page.locator(spec).first();
  if (spec.css) return page.locator(spec.css).first();
  const exact = spec.exact === true;
  if (spec.role === "text") return page.getByText(spec.name, { exact }).first();
  return page.getByRole(spec.role, { name: spec.name, exact }).first();
}

/** Give actions.mjs the small page surface it needs on top of a Playwright page. */
export function wrapPage(page, timeout = 8000) {
  const visible = async (spec) => {
    const target = locate(page, spec);
    try { await target.waitFor({ state: "visible", timeout }); return target; } catch { return null; }
  };
  return {
    raw: page,
    mouse: page.mouse,
    keyboard: page.keyboard,
    url: () => page.url(),
    wait: (ms) => page.waitForTimeout(ms),
    goto: async (url) => { await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }); await page.waitForTimeout(5000); },
    text: async () => (await page.innerText("body").catch(() => "")).slice(0, 20000),
    box: async (spec) => { const t = await visible(spec); return t ? t.boundingBox() : null; },
    click: async (spec) => { const t = await visible(spec); if (!t) return false; await t.scrollIntoViewIfNeeded().catch(() => {});
      // Seller centres open product edit pages in a new tab. Keep one tab: move that address into this tab and close the extra one.
      const context = typeof page.context === "function" ? page.context() : null;
      const popup = context ? context.waitForEvent("page", { timeout: 4000 }).catch(() => null) : Promise.resolve(null);
      try {
        await t.click({ timeout: 10000 });
        const extra = await popup;
        if (extra && extra !== page) {
          // A new tab starts on about:blank and only then moves to the real address.
          await extra.waitForURL(/^https?:/i, { timeout: 20000 }).catch(() => {});
          await extra.waitForLoadState("domcontentloaded").catch(() => {});
          const target = extra.url();
          await extra.close().catch(() => {});
          if (/^https?:/i.test(target)) { await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 }); await page.waitForTimeout(6000); }
        }
      } catch (error) {
        // A queued promo modal can sit over the sidebar with no close button. Follow the link the way a person would open it.
        const href = await t.getAttribute("href").catch(() => null);
        if (!href) throw error;
        await page.goto(new URL(href, page.url()).toString(), { waitUntil: "domcontentloaded", timeout: 60000 });
      } await page.waitForLoadState("domcontentloaded").catch(() => {}); await page.waitForTimeout(2500); return true; },
    fill: async (spec, value) => { const t = await visible(spec); if (!t) return false; await t.fill(value); return true; },
    value: async (spec) => { const t = await visible(spec); return t ? t.inputValue().catch(() => null) : null; },
    checked: async (spec) => { const t = await visible(spec); if (!t) return null; const v = await t.getAttribute("aria-checked").catch(() => null); return v ?? String(await t.isChecked().catch(() => null)); },
    count: async (spec) => { const t = await visible(spec); if (!t) return 0; return (typeof spec === "string" ? page.locator(spec) : spec.css ? page.locator(spec.css) : null)?.count() ?? 1; },
    allText: async () => {
      // Body text plus form values, so a SKU that only sits inside an input is still seen.
      const body = (await page.innerText("body").catch(() => "")).slice(0, 40000);
      const values = await page.evaluate(() => [...document.querySelectorAll("input,textarea")].map((e) => e.value || "").join("\n")).catch(() => "");
      return `${body}\n${values}`;
    },
    textOf: async (spec) => { const t = await visible(spec); return t ? (await t.innerText()).slice(0, 200) : null; },
    screenshot: (path) => page.screenshot(path ? { path } : {}),
    dismiss: async (closers = []) => {
      // Promo pop-ups cover the sidebar and swallow clicks. Close them, never press their call to action.
      let closed = 0;
      for (const css of closers) {
        const t = page.locator(css).first();
        if (await t.isVisible().catch(() => false)) { await t.click({ timeout: 3000 }).catch(() => {}); closed += 1; await page.waitForTimeout(800); }
      }
      if (!closed) await page.keyboard.press("Escape").catch(() => {});
      return closed;
    },
    drag: async () => {
      const handle = await visible({ css: ".secsdk-captcha-drag-icon, [class*=slider] [class*=btn], [class*=captcha] [draggable]" });
      if (!handle) return false;
      const b = await handle.boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.down();
      await page.mouse.move(b.x + 180, b.y + b.height / 2, { steps: 25 });
      await page.mouse.up();
      await page.waitForTimeout(3000);
      return true;
    },
  };
}

export function storeHash(storeId) {
  return createHash("sha256").update(String(storeId)).digest("hex").slice(0, 12);
}

export async function startProfile({ base, apiKey, profileId, fetchImpl = fetch }) {
  const response = await fetchImpl(browserStartUrl(base, profileId), { headers: authHeaders(apiKey) });
  const body = await response.json();
  return { ws: wsFromStart(body) };
}

export async function stopProfile({ base, apiKey, profileId, fetchImpl = fetch }) {
  await fetchImpl(browserStopUrl(base, profileId), { headers: authHeaders(apiKey) });
}

export async function connectOverCDP(ws, deps = {}) {
  const playwright = deps.playwright || await import("playwright");
  const browser = await playwright.chromium.connectOverCDP(ws);
  const context = browser.contexts()[0] || await browser.newContext();
  const pages = context.pages();
  const page = pages[0] || await context.newPage();
  for (const extra of pages.slice(1)) await extra.close();
  return { browser, context, page };
}

export async function moveMouse(page, from, to, random, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))) {
  const points = curvePoints(from, to, random);
  for (const point of points) {
    await page.mouse.move(point.x, point.y);
    await sleep(12 + Math.floor(random() * 28));
  }
}

export async function typeWithJitter(page, text, random, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))) {
  const plan = typePlan("normal", text, random, 1);
  const chars = [...String(text)];
  for (let i = 0; i < chars.length; i += 1) {
    await page.keyboard.type(chars[i]);
    await sleep(plan.perChar[i]);
  }
}

export async function scrollBy(page, random, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))) {
  const delta = 120 + Math.floor(random() * 280);
  await page.mouse.wheel(0, delta);
  await sleep(clickGap("normal", random, null, 1));
  return delta;
}

export function looksLikeCaptcha(text) {
  return /captcha|verify you are human|slide to|drag the slider|unusual traffic/i.test(String(text || ""));
}

export function looksUnavailable(text) {
  return /page unavailable|verify your identity|access denied|account restricted/i.test(String(text || ""));
}

export async function handleCaptcha(page, hooks) {
  const text = await page.text();
  if (!looksLikeCaptcha(text)) return "clear";
  if (!hooks.dragged) {
    hooks.dragged = true;
    await hooks.drag();
    if (!looksLikeCaptcha(await page.text())) return "cleared";
  }
  const shot = await hooks.screenshot();
  await hooks.alert({ kind: "captcha", screenshot: shot });
  return "pause";
}

export function guardWrite({ store, manifest, action, target, day, journalRows, policyResult }) {
  if (manifest.money || MONEY.has(action)) return { result: "MONEY_BLOCKED" };
  return beginRun({ store, manifest, action, target, day, journalRows, policyResult });
}

export function finishWrite(journalPath, actionKey, status) {
  appendJournal(journalPath, { actionKey, status, module: "browser" });
}

export function readKeys(journalPath) {
  return readJournal(journalPath);
}
