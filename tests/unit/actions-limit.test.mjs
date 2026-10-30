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
