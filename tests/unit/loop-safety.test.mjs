import test from "node:test";
import assert from "node:assert/strict";
import { runModule, hitsProtected, fieldMatches } from "../../skills/automate-ecom-store/core/browser/actions.mjs";
import { protectedList } from "../../skills/automate-ecom-store/scripts/real-test.mjs";

const manifest = {
  id: "loop.safety",
  platforms: ["shopee", "tiktokshop"],
  markets: ["PH"],
  writes: true,
  money: false,
  priority: 2,
  cost: { actions: 1, captchaRisk: "low" },
  input: "x",
  output: "y",
  policyTags: ["publish"],
};
const base = { maxActions: 12, mode: "full", store: { id: "s", mode: "full" }, manifest, day: "2026-01-01", journalRows: [], policyResult: "ALLOW" };

function fakePage(opts = {}) {
  const state = { values: {}, clicks: [], typed: [] };
  const key = (spec) => spec.css || spec.name;
  const page = {
    state,
    url: () => "https://seller.example/portal",
    goto: async () => {},
    text: async () => "dashboard",
    allText: async () => opts.allText || "dashboard",
    box: async (spec) => (opts.hide?.includes(spec.name) ? null : { x: 1, y: 1, width: 2, height: 2 }),
    count: async () => opts.count ?? 1,
    click: async (spec) => { state.clicks.push(spec.name); return true; },
    fill: async (spec, value) => { if (opts.noFill?.includes(spec.name)) return false; state.values[key(spec)] = value; state.focus = key(spec); return true; },
    value: async (spec) => (opts.value !== undefined ? opts.value : state.values[key(spec)] ?? ""),
  };
  const hooks = { move: async () => {}, type: async (t) => { state.typed.push(t); if (state.focus) state.values[state.focus] = (state.values[state.focus] || "") + t; }, alert: async () => {} };
  return { page, hooks, state };
}

for (const [module, platform] of [["customers.chat", "shopee"], ["reviews.replies", "tiktokshop"]]) {
  test(`${module} preview types the text, clears it, and never presses send`, async () => {
    const { page, hooks, state } = fakePage();
    const out = await runModule(page, { ...base, platform, module, value: "Thank you!", send: false }, hooks);
    assert.equal(out.result, "TYPED_NOT_SENT");
    assert.deepEqual(state.typed, ["Thank you!"]);
    assert.ok(!state.clicks.includes("Send") && !state.clicks.includes("Submit"), state.clicks.join(","));
  });
}

test("promotion preview fills the name and saves nothing", async () => {
  const { page, hooks, state } = fakePage();
  const out = await runModule(page, { ...base, platform: "tiktokshop", module: "selling.promotion", value: "TEST DRAFT", send: false }, hooks);
  assert.equal(out.result, "TYPED_NOT_SAVED");
  assert.ok(!state.clicks.some((c) => /save|delete/i.test(c)), state.clicks.join(","));
});

test("a protected SKU or product blocks the listing edit before and after opening it", async () => {
  const protect = protectedList(" SKU-A.100G , Protected Mango ");
  assert.deepEqual(protect, ["SKU-A.100G", "Protected Mango"]);
  const first = fakePage();
  const before = await runModule(first.page, { ...base, platform: "shopee", module: "listing.edit", query: "protected mango 100g", value: "X", protect }, first.hooks);
  assert.equal(before.result, "PROTECTED");
  assert.deepEqual(first.state.typed, []);
  const second = fakePage({ allText: "variation sku-a.100g", value: "Tea pack" });
  const after = await runModule(second.page, { ...base, platform: "shopee", module: "listing.edit", query: "Tea pack", value: "X", protect }, second.hooks);
  assert.equal(after.result, "PROTECTED");
  assert.deepEqual(second.state.typed, ["Tea pack"]);
});

test("a field that does not hold the searched product is not edited", async () => {
  const { page, hooks, state } = fakePage({ value: "" });
  const out = await runModule(page, { ...base, platform: "tiktokshop", module: "listing.edit", query: "Tea pack", value: "X" }, hooks);
  assert.equal(out.result, "FIELD_MISMATCH");
  assert.ok(!state.typed.includes("X"));
  assert.equal(fieldMatches("Value Pack Tea", "tea bundle"), true);
  assert.equal(fieldMatches("", "tea"), false);
  assert.equal(hitsProtected("abc", []), null);
});

test("Shopee edit after search needs exactly one row", async () => {
  const { page, hooks } = fakePage({ count: 2, value: "Tea pack" });
  const out = await runModule(page, { ...base, platform: "shopee", module: "listing.edit", query: "Tea", value: "X" }, hooks);
  assert.equal(out.result, "AMBIGUOUS");
});

test("a search box that is not found gets no keystrokes", async () => {
  const { page, hooks, state } = fakePage({ noFill: ["Search Product Name"] });
  const out = await runModule(page, { ...base, platform: "shopee", module: "listing.edit", query: "Tea", value: "X" }, hooks);
  assert.equal(out.result, "NAV_MISSING");
  assert.deepEqual(state.typed, []);
});

test("no campaign switch and no review to answer are empty queues, not broken menus", async () => {
  const ads = fakePage({ hide: ["Campaign"] });
  assert.equal((await runModule(ads.page, { ...base, platform: "shopee", module: "ads.change" }, ads.hooks)).result, "NO_TOGGLE");
  const rev = fakePage({ hide: ["Reply"] });
  assert.equal((await runModule(rev.page, { ...base, platform: "shopee", module: "reviews.replies", value: "Thanks!", send: false }, rev.hooks)).result, "NO_REVIEW");
});

test("an invite preview finds the button and does not press it", async () => {
  const { page, hooks, state } = fakePage();
  const out = await runModule(page, { ...base, platform: "shopee", module: "affiliate.invite", handle: "creator_x", send: false }, hooks);
  assert.equal(out.result, "READY_NOT_SENT");
  assert.ok(!state.clicks.includes("Invite"));
});
