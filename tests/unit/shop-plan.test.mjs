import assert from "node:assert/strict";
import test from "node:test";
import { planShop } from "../../skills/automate-ecom-store/scripts/shop-plan.mjs";

test("an unverified banner size is not uploaded", () => {
  const rows = planShop([
    { slot: "header", size: "verify" },
    { slot: "banner", size: "1200x400" },
    { slot: "<SLOT>", size: "100x100" },
  ], { approved: true });
  assert.deepEqual(rows.map((row) => row.decision), ["HOLD_VERIFY", "APPLY", "REJECT"]);
  assert.equal(planShop([{ slot: "banner", size: "1200x400" }], { approved: false })[0].decision, "HOLD_APPROVAL");
});
