import test from "node:test";
import assert from "node:assert/strict";
import { runModule } from "../../skills/automate-ecom-store/core/browser/actions.mjs";

const manifest = { action: "x", money: false, writes: true };
function page() {
  return {
    url: () => "https://seller.example/portal",
    goto: async () => {},
    text: async () => "dashboard",
    box: async () => ({ x: 1, y: 1, width: 2, height: 2 }),
    click: async () => true,
    fill: async () => true,
    value: async () => "old",
  };
}

for (const module of ["customers.chat", "reviews.replies", "selling.promotion"]) {
  test(`${module} stops at the action cap before writing`, async () => {
    const typed = [];
    const hooks = { move: async () => {}, type: async (t) => { typed.push(t); }, drag: async () => {}, screenshot: async () => "", alert: async () => {} };
    const out = await runModule(page(), { platform: "shopee", module, maxActions: 2, mode: "full", store: { id: "s", mode: "full" }, manifest, day: "2026-01-01", journalRows: [], policyResult: "ALLOW", value: "Thanks for your message" }, hooks);
    assert.ok(!["SENT", "REPLIED", "REVERTED"].includes(out.result), out.result);
    assert.deepEqual(typed, []);
  });
}

test("TikTok listing edit opens the named row's own edit button, and full mode without a product only reads", async () => {
  const clicks = [];
  const pg = { ...page(), click: async (spec) => { clicks.push(spec.css || spec.name); return true; } };
  const hooks = { move: async () => {}, type: async () => {}, alert: async () => {} };
  const base = { platform: "tiktokshop", module: "listing.edit", maxActions: 8, mode: "full", store: { id: "s", mode: "full" }, manifest, day: "2026-01-01", journalRows: [], policyResult: "ALLOW" };
  const read = await runModule(pg, base, { ...hooks });
  assert.equal(read.result, "READ");
  await runModule(pg, { ...base, query: "Tea \"Pack\"" }, { ...hooks });
  assert.ok(clicks.some((c) => c.includes(':has-text("Tea Pack")')), clicks.join(" "));
});

test("chat in full mode with no buyer thread sends nothing", async () => {
  const typed = [];
  const pg = { ...page(), box: async (spec) => (spec.name === "Conversation" ? null : { x: 1, y: 1, width: 2, height: 2 }) };
  const out = await runModule(pg, { platform: "shopee", module: "customers.chat", maxActions: 8, mode: "full", store: { id: "s", mode: "full" }, manifest, day: "2026-01-01", journalRows: [], policyResult: "ALLOW", value: "Thank you!" }, { move: async () => {}, type: async (t) => typed.push(t), alert: async () => {} });
  assert.equal(out.result, "NO_THREAD");
  assert.deepEqual(typed, []);
});
