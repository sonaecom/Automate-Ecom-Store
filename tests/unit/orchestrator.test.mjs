import assert from "node:assert/strict";
import test from "node:test";
import { inNight, profileStep, tickStores } from "../../skills/automate-ecom-store/scripts/orchestrator.mjs";

const base = { batchMinutes: 45, breakMinutes: 15, open: false, captcha: false, hung: false };

test("night off, captcha, restart, and resume stay per store", () => {
  assert.equal(inNight(90, 60, 4), true);
  assert.equal(inNight(6 * 60, 60, 4), false);
  const rows = tickStores([
    { ...base, id: "<STORE_A>", captcha: true },
    { ...base, id: "<STORE_B>", hung: true },
    { ...base, id: "<STORE_C>", pendingKey: "hash-1" },
    { ...base, id: "<STORE_D>", pendingKey: "hash-2", doneKeys: ["hash-2"] },
  ], { nowMinutes: 9 * 60, nightStart: 60, dayStart: 8 * 60, staggerMinutes: 20 });
  assert.equal(rows.find((row) => row.store === "<STORE_A>").action, "CAPTCHA_PAUSE");
  assert.equal(rows.find((row) => row.store === "<STORE_B>").action, "RESTART");
  assert.equal(rows.find((row) => row.store === "<STORE_C>").action, "RESUME");
  assert.equal(rows.find((row) => row.store === "<STORE_D>").action, "SKIP");
  assert.equal(profileStep("OPEN").headless, "0");
  assert.equal(profileStep("RESTART").close_first, "yes");
});

test("the eleventh store is refused and the batch stays inside 40 to 50 minutes", () => {
  const stores = Array.from({ length: 11 }, (_, index) => ({ ...base, id: `STORE_${index}`, batchMinutes: 90, breakMinutes: 1 }));
  const rows = tickStores(stores, { nowMinutes: 8 * 60 + 10, nightStart: 60, dayStart: 8 * 60, staggerMinutes: 20 });
  assert.equal(rows.filter((row) => row.action === "REJECT_STORE").length, 1);
  assert.ok(rows.some((row) => row.detail.startsWith("batch_50")));
  const night = tickStores([{ ...base, id: "<STORE_A>" }], { nowMinutes: 2 * 60, nightStart: 60, dayStart: 8 * 60, staggerMinutes: 20 });
  assert.equal(night[0].action, "WAIT");
  assert.equal(night[0].detail, "night_off");
});
