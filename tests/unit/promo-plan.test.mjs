import assert from "node:assert/strict";
import test from "node:test";
import { planPromos } from "../../skills/automate-ecom-store/scripts/promo-plan.mjs";

test("a promotion is not saved until the owner approves it", () => {
  const held = planPromos([
    { name: "PROMO_1", start: "2026-11-01", end: "2026-11-07", discount: "10", items: "ITEM_1", budget: "none" },
    { name: "<PROMO_NAME>", start: "2026-11-01", end: "2026-11-07", discount: "10", items: "ITEM_1", budget: "none" },
    { name: "PROMO_3", start: "2026-11-01", end: "2026-11-07", discount: "10", items: "ITEM_1", budget: "coins" },
  ], { target: "", approved: false });
  assert.deepEqual(held.map((row) => row.decision), ["HOLD_APPROVAL", "REJECT", "HOLD_MONEY"]);
  const saved = planPromos([
    { name: "PROMO_1", start: "2026-11-01", end: "2026-11-07", discount: "10", items: "ITEM_1", budget: "none" },
  ], { target: "", approved: true });
  assert.equal(saved[0].decision, "APPLY");
});
