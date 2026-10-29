import assert from "node:assert/strict";
import test from "node:test";
import { guardReadOnly } from "../../skills/automate-ecom-store/core/safety/read-only.mjs";
import { adsRoom, topupDecision } from "../../skills/automate-ecom-store/scripts/ads-plan.mjs";

test("ten ads changes an hour is a ceiling, not a target", () => {
  assert.equal(adsRoom(2, 0, "").allowed, 2);
  assert.equal(adsRoom(12, 0, "").allowed, 10);
  assert.equal(adsRoom(4, 0, "3").allowed, 3);
  assert.equal(adsRoom(2, 10, "").allowed, 0);
});

test("a top-up uses the saved card only after approval", () => {
  assert.equal(topupDecision({ addCard: true, savedCard: true, approved: true }), "BLOCK_ADD_CARD");
  assert.equal(topupDecision({ savedCard: false, approved: true }), "BLOCK_NO_SAVED_CARD");
  assert.equal(topupDecision({ savedCard: true, approved: false, standing: false }), "HOLD_APPROVAL");
  assert.equal(topupDecision({ savedCard: true, standing: true }), "ALLOW_SAVED_CARD");
  assert.equal(guardReadOnly({ mode: "full" }, { writes: true, money: false, action: "topup" }).result, "MONEY_BLOCKED");
  assert.equal(guardReadOnly({ mode: "full" }, {
    writes: true,
    money: false,
    action: "topup",
    savedCard: true,
    approved: true,
  }).result, "ALLOW");
  assert.equal(guardReadOnly({ mode: "read_only" }, {
    writes: true,
    money: false,
    action: "topup",
    savedCard: true,
    approved: true,
  }).result, "READ_ONLY");
});
