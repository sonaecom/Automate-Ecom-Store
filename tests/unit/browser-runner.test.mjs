import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { runModule } from "../../skills/automate-ecom-store/core/browser/actions.mjs";
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
import { roundLog } from "../../skills/automate-ecom-store/scripts/real-test.mjs";

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
    revert: true,
  }, hooks);
  assert.equal(edited.result, "EDITED");
  assert.equal(edited.previous, "Original title");
  assert.deepEqual(events.filter((event) => event[0] === "fill").map((event) => event[1]), ["", "Original title"]);
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
