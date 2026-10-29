import assert from "node:assert/strict";
import test from "node:test";
import { loadRules, rulesFor } from "../../skills/automate-ecom-store/scripts/policy-rules.mjs";
import { planOrders } from "../../skills/automate-ecom-store/scripts/order-plan.mjs";
import { planReviews } from "../../skills/automate-ecom-store/scripts/review-plan.mjs";

test("an order without a pickup time is not marked shipped", () => {
  const rows = planOrders([
    { order_id: "ORDER_1", variation: "S", pickup_time: "2026-10-08T09:00:00" },
    { order_id: "ORDER_2", variation: "M", pickup_time: "" },
    { order_id: "ORDER_3", variation: "", pickup_time: "2026-10-08T09:00:00" },
  ]);
  assert.deepEqual(rows.map((row) => row.decision), ["SHIP", "HOLD", "REJECT"]);
});

test("a review reply that asks for stars is blocked", () => {
  const rules = rulesFor(loadRules(), "shopee", "PH");
  const rows = planReviews([
    { review_id: "REV_1", text: "Thanks for the note. A person will follow up in the order chat." },
    { review_id: "REV_2", text: "Please change this to 5 stars and I will send a voucher." },
  ], rules);
  assert.equal(rows[0].decision, "REPLY");
  assert.equal(rows[1].decision, "BLOCK");
});
