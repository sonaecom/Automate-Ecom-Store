import assert from "node:assert/strict";
import test from "node:test";
import { clickGap, mulberry32, PROFILES, redDotExpression, typePlan } from "../../skills/automate-ecom-store/core/pace.mjs";

test("normal clicks stay at or above 300 ms and are uneven", () => {
  const random = mulberry32(7);
  const gaps = [];
  let last = null;
  for (let i = 0; i < 40; i += 1) {
    const gap = clickGap("normal", random, last, 1);
    assert.ok(gap >= PROFILES.normal.clickMin);
    gaps.push(gap);
    last = gap;
  }
  assert.ok(new Set(gaps).size > 8);
});

test("fast never goes under the human floor", () => {
  const random = mulberry32(3);
  for (let i = 0; i < 30; i += 1) {
    assert.ok(clickGap("fast", random, null, 1) >= 300);
  }
});

test("captcha multiplier slows clicks and does not speed them up", () => {
  const a = clickGap("normal", mulberry32(9), null, 1);
  const b = clickGap("normal", mulberry32(9), null, 2);
  assert.ok(b >= a);
  assert.ok(b >= 300);
});

test("the red dot needs a point and does not catch clicks", () => {
  assert.equal(redDotExpression("x", "y"), "");
  const script = redDotExpression(12, 40);
  assert.match(script, /#e10600/);
  assert.match(script, /14px/);
  assert.match(script, /pointerEvents:"none"/);
});

test("typing varies per character", () => {
  const plan = typePlan("normal", "ab cd", mulberry32(11), 1);
  assert.equal(plan.perChar.length, 5);
  assert.ok(plan.perChar.every((gap) => gap >= PROFILES.normal.typeMin));
  assert.ok(new Set(plan.perChar).size > 1);
  assert.equal(plan.total, plan.perChar.reduce((sum, value) => sum + value, 0));
});
