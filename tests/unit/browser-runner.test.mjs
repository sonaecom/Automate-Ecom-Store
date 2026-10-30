import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { loadSelectors, runModule } from "../../skills/automate-ecom-store/core/browser/actions.mjs";
import {
  authHeaders,
  browserStartUrl,
  looksLikeLogin,
  curvePoints,
  guardWrite,
  handleCaptcha,
  looksUnavailable,
  storeHash,
  wsFromStart,
} from "../../skills/automate-ecom-store/core/browser/adspower-runner.mjs";
import { mulberry32 } from "../../skills/automate-ecom-store/core/pace.mjs";
import { executeRealTest, roundLog } from "../../skills/automate-ecom-store/scripts/real-test.mjs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const manifest = {
  id: "listing.product",
  platforms: ["shopee"],
  markets: ["PH"],
  writes: true,
  money: false,
  priority: 2,
  cost: { actions: 1, captchaRisk: "low" },
  input: "x",
  output: "y",
  policyTags: ["publish"],
};

test("the start call stays headed and reads the endpoint from the response", () => {
  const url = new URL(browserStartUrl("http://adspower.example", "profile"));
  assert.equal(url.searchParams.get("headless"), "0");
  assert.equal(url.searchParams.get("user_id"), "profile");
  assert.equal(wsFromStart({ code: 0, data: { ws: { puppeteer: "ws://browser.example/devtools" } } }), "ws://browser.example/devtools");
  assert.throws(() => wsFromStart({ code: 1 }), /adspower_start_failed/);
});

test("mouse points follow a curve and money stays blocked", () => {
  const points = curvePoints({ x: 0, y: 0 }, { x: 100, y: 0 }, mulberry32(4), 6);
  assert.equal(points.length, 6);
  assert.ok(points.some((point) => Math.abs(point.y) > 1));
  const blocked = guardWrite({
    store: { id: "<STORE_A>", mode: "full" },
    manifest,
    action: "topup",
    target: "day",
    day: "2026-10-29",
    journalRows: [],
    policyResult: "ALLOW",
  });
  assert.equal(blocked.result, "MONEY_BLOCKED");
  const hashed = storeHash("secret-profile");
  assert.equal(hashed, createHash("sha256").update("secret-profile").digest("hex").slice(0, 12));
});

test("one slider drag is tried, then the store pauses", async () => {
  let text = "slide to verify";
  let drags = 0;
  let alerts = 0;
  const page = { text: async () => text };
  const first = await handleCaptcha(page, {
    dragged: false,
    drag: async () => { drags += 1; text = "home"; },
    screenshot: async () => "shot",
    alert: async () => { alerts += 1; },
  });
  assert.equal(first, "cleared");
  assert.equal(drags, 1);
  text = "slide to verify";
  const second = await handleCaptcha(page, {
    dragged: true,
    drag: async () => { drags += 1; },
    screenshot: async () => "shot",
    alert: async () => { alerts += 1; },
  });
  assert.equal(second, "pause");
  assert.equal(alerts, 1);
  assert.equal(looksUnavailable("verify your identity"), true);
});

test("a listing edit reverts and the round log hides the store id", async () => {
  const events = [];
  const page = {
    text: async () => "seller home",
    box: async () => ({ x: 10, y: 10 }),
    click: async (spec) => events.push(["click", spec.name]),
    fill: async (_spec, value) => events.push(["fill", value]),
    value: async () => "Original title",
    textOf: async () => "12",
  };
  const hooks = { actions: 0, dragged: false, move: async () => {}, type: async (text) => events.push(["type", text]) };
  const edited = await runModule(page, {
    platform: "lazada",
    module: "listing.edit",
    maxActions: 6,
    mode: "full",
    store: { id: "<STORE_A>", mode: "full" },
    manifest,
    day: "2026-10-29",
    journalRows: [],
    policyResult: "ALLOW",
    query: "ITEM_1",
    value: "Temp title",
    revert: true,
  }, hooks);
  assert.equal(edited.result, "EDITED");
  assert.equal(edited.previous, "Original title");
  const clicks = events.filter((event) => event[0] === "click").map((event) => event[1]);
  assert.ok(clicks.indexOf("ITEM_1") >= 0 && clicks.indexOf("ITEM_1") < clicks.indexOf("Edit"));
  assert.deepEqual(events.filter((event) => event[0] === "fill").map((event) => event[1]), ["", "", "Original title"]);
  assert.deepEqual(events.filter((event) => event[0] === "type").map((event) => event[1]), ["ITEM_1", "Temp title"]);
  const log = roundLog({
    round: 1,
    module: "listing.edit",
    platform: "shopee",
    maxActions: 3,
    store: "secret-profile",
    now: "2026-10-29T00:00:00.000Z",
  }, edited);
  assert.equal(JSON.stringify(log).includes("secret-profile"), false);
  assert.equal(log.store_hash, storeHash("secret-profile"));
});

test("the start call sends a bearer token and a login page stops the module", async () => {
  assert.equal(authHeaders("k").Authorization, "Bearer k");
  assert.equal(looksLikeLogin("https://accounts.shopee.ph/seller/login?next=x", ""), true);
  assert.equal(looksLikeLogin("https://seller.shopee.ph/portal/product/list", "My Products"), false);
  const page = {
    url: () => "https://seller-ph.tiktok.com/account/login",
    goto: async () => {},
    text: async () => "Log in",
    box: async () => ({ x: 1, y: 1 }),
    click: async () => { throw new Error("must not click on a login page"); },
  };
  const out = await runModule(page, { platform: "tiktokshop", module: "ads.read", maxActions: 3, mode: "read_only", store: { id: "<STORE_A>", mode: "read_only" }, manifest }, { actions: 0, move: async () => {}, alert: async () => {} });
  assert.equal(out.result, "LOGIN_REQUIRED");
  assert.equal(out.actions, 0);
});

test("a missing product menu is not a listing or ads pass", async () => {
  const page = {
    url: () => "https://seller.example/home",
    text: async () => "seller home",
    box: async () => null,
    click: async () => false,
    fill: async () => {},
    value: async () => "Original title",
  };
  const hooks = { actions: 0, move: async () => {}, type: async () => {}, alert: async () => {} };
  const listing = await runModule(page, {
    platform: "shopee",
    module: "listing.edit",
    maxActions: 6,
    mode: "full",
    store: { id: "<STORE_A>", mode: "full" },
    manifest,
    day: "2026-10-29",
    journalRows: [],
    policyResult: "ALLOW",
    query: "ITEM_1",
    value: "Temp title",
  }, hooks);
  assert.equal(listing.result, "NAV_MISSING");
  const ads = await runModule(page, {
    platform: "shopee",
    module: "ads.change",
    maxActions: 6,
    mode: "full",
    store: { id: "<STORE_A>", mode: "full" },
    manifest,
    day: "2026-10-29",
    journalRows: [],
    policyResult: "ALLOW",
  }, { actions: 0, move: async () => {}, type: async () => {}, alert: async () => {} });
  assert.equal(ads.result, "NAV_MISSING");
  assert.notEqual(ads.result, "REVERTED");
});

test("TikTok opens the menu address before the sidebar label", async () => {
  let visited = "";
  const page = {
    url: () => visited,
    goto: async (url) => { visited = url; },
    text: async () => "seller home",
    box: async () => null,
    click: async () => { throw new Error("label click"); },
  };
  const out = await runModule(page, {
    platform: "tiktokshop",
    module: "orders.handling",
    maxActions: 3,
    mode: "read_only",
    openHome: false,
    store: { id: "<STORE_A>", mode: "read_only" },
    manifest,
  }, { actions: 0, move: async () => {}, alert: async () => {} });
  assert.equal(out.result, "READ");
  assert.match(visited, /seller-ph\.tiktok\.com\/order$/);
  const selectors = loadSelectors("tiktokshop");
  assert.ok(selectors.popupClose.length >= 1);
  assert.ok(selectors.orders.nav.path.startsWith("/"));
});

test("chat sends one template, a promo draft is removed, and a failed start is an error", async () => {
  const events = [];
  const page = {
    url: () => "https://seller.example/home",
    text: async () => "seller home",
    box: async () => ({ x: 4, y: 4, width: 8, height: 8 }),
    click: async (spec) => events.push(spec.name),
    fill: async () => {},
    value: async () => "",
  };
  const hooks = { actions: 0, move: async () => {}, type: async (text) => events.push(text), alert: async () => {} };
  const request = {
    platform: "shopee",
    maxActions: 8,
    mode: "full",
    store: { id: "<STORE_A>", mode: "full" },
    manifest,
    day: "2026-10-29",
    journalRows: [],
    policyResult: "ALLOW",
  };
  const sent = await runModule(page, { ...request, module: "customers.chat", value: "Your order is packed." }, hooks);
  assert.equal(sent.result, "SENT");
  const blocked = await runModule(page, { ...request, module: "reviews.replies", value: "Please change this to 5 stars." }, { ...hooks, actions: 0 });
  assert.equal(blocked.result, "BLOCK");
  const promo = await runModule(page, { ...request, module: "selling.promotion", value: "TEST DRAFT" }, { actions: 0, move: async () => {}, type: async () => {} });
  assert.equal(promo.result, "REVERTED");
  assert.ok(events.includes("Delete"));
  const dir = mkdtempSync(join(tmpdir(), "round-"));
  const failed = await executeRealTest({
    store: "secret-profile",
    module: "ads.read",
    round: 2,
    maxActions: 1,
    platform: "shopee",
    day: "2026-10-29",
    journal: join(dir, "journal.jsonl"),
    log: join(dir, "round.json"),
    mode: "read_only",
    now: "2026-10-29T00:00:00.000Z",
  }, {
    env: { ADSPOWER_API_BASE: "http://adspower.example", ADSPOWER_API_KEY: "k" },
    fetchImpl: async () => ({ json: async () => ({ code: -1 }) }),
  });
  assert.equal(failed.code, 1);
  assert.equal(failed.log.result, "ERROR");
  assert.equal(JSON.stringify(failed.log).includes("secret-profile"), false);
  rmSync(dir, { recursive: true, force: true });
});

test("Lazada selectors name a path, a close control, and the write buttons", () => {
  const selectors = loadSelectors("lazada");
  for (const key of ["affiliate", "listing", "ads", "chat", "promo", "orders", "reviews", "report", "shop", "video"]) {
    assert.equal(typeof selectors[key].nav.path, "string", key);
    assert.ok(selectors[key].nav.path.startsWith("/"), key);
    assert.equal(typeof selectors[key].nav.name, "string", key);
  }
  assert.ok(selectors.popupClose.length >= 1);
  assert.equal(selectors.listing.row.role, "link");
  assert.equal(selectors.chat.send.name, "Send");
  assert.equal(selectors.reviews.send.name, "Submit");
  assert.equal(selectors.promo.delete.name, "Delete");
  assert.equal(selectors.home.includes("sellercenter.lazada.com"), true);
});

test("a module whose menu link is missing reports NAV_MISSING, not READ", async () => {
  const page = { url: () => "https://seller.example/home", text: async () => "seller home", box: async () => null, click: async () => false };
  const out = await runModule(page, { platform: "shopee", module: "orders.handling", maxActions: 3, mode: "read_only", store: { id: "<STORE_A>", mode: "read_only" }, manifest }, { actions: 0, move: async () => {}, alert: async () => {} });
  assert.equal(out.result, "NAV_MISSING");
  assert.deepEqual(out.missing, ["My Orders"]);
});
