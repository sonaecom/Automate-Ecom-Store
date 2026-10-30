import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { inNight, loadStores, profileStep, tickStores } from "../../skills/automate-ecom-store/scripts/orchestrator.mjs";

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
  const awake = tickStores([{ ...base, id: "<STORE_A>", night: false }], { nowMinutes: 2 * 60, nightStart: 60, dayStart: 2 * 60, staggerMinutes: 20 });
  assert.notEqual(awake[0].detail, "night_off");
});

test("the example store file is yaml and the night window defaults on", () => {
  const text = readFileSync(new URL("../../skills/automate-ecom-store/stores.example.yaml", import.meta.url), "utf8");
  const stores = loadStores(text);
  assert.equal(stores.length, 3);
  assert.equal(stores[0].id, "<STORE_A>");
  assert.equal(stores[0].night, true);
  assert.equal(stores[0].batchMinutes, 40);
  const dir = mkdtempSync(join(tmpdir(), "orch-"));
  const run = spawnSync(process.execPath, [
    new URL("../../skills/automate-ecom-store/scripts/orchestrator.mjs", import.meta.url).pathname,
    "--stores", new URL("../../skills/automate-ecom-store/stores.example.yaml", import.meta.url).pathname,
    "--now", "09:00",
    "--out-dir", dir,
  ], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /result: PLAN/);
  rmSync(dir, { recursive: true, force: true });
});
