import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { readPolicyText, RULES_PATH } from "../../skills/automate-ecom-store/core/policy/index.mjs";
import { guardReadOnly } from "../../skills/automate-ecom-store/core/safety/read-only.mjs";
import { actionKey, appendJournal, readJournal, journalState } from "../../skills/automate-ecom-store/core/journal/action-key.mjs";
import { checkManifest } from "../../skills/automate-ecom-store/core/manifest/check.mjs";
import { beginRun } from "../../skills/automate-ecom-store/core/runner.mjs";

const manifest = JSON.parse(readFileSync(new URL("../../skills/automate-ecom-store/core/manifest/spend-topup.manifest.json", import.meta.url), "utf8"));

test("policy text comes from the one rules file", () => {
  assert.match(RULES_PATH, /policies\/rules\.yaml$/);
  assert.match(readPolicyText(), /SH-PH-001/);
});

test("read_only blocks a write and money is always blocked", () => {
  assert.equal(guardReadOnly({ mode: "read_only" }, { writes: true, money: false, action: "publish" }).result, "READ_ONLY");
  assert.equal(guardReadOnly({ mode: "full" }, { writes: true, money: false, action: "publish" }).result, "ALLOW");
  assert.equal(guardReadOnly({ mode: "full" }, { writes: false, money: true, action: "read" }).result, "MONEY_BLOCKED");
});

test("a done action key is not run again", () => {
  const dir = mkdtempSync(join(tmpdir(), "journal-"));
  const path = join(dir, "actions.jsonl");
  const key = actionKey({ storeId: "<STORE_A>", moduleId: "ads.spend-topup", action: "read", target: "2026-10-29", day: "2026-10-29" });
  appendJournal(path, { actionKey: key, status: "pending" });
  appendJournal(path, { actionKey: key, status: "done" });
  const state = journalState(readJournal(path));
  assert.equal(state.done.has(key), true);
  const run = beginRun({
    store: { id: "<STORE_A>", mode: "read_only" },
    manifest,
    action: "read",
    target: "2026-10-29",
    day: "2026-10-29",
    journalRows: readJournal(path),
    policyResult: "ALLOW",
  });
  assert.equal(run.result, "SKIP");
  const fresh = beginRun({
    store: { id: "<STORE_A>", mode: "read_only" },
    manifest,
    action: "read",
    target: "2026-10-30",
    day: "2026-10-30",
    journalRows: [],
    policyResult: "ALLOW",
  });
  assert.equal(fresh.result, "RUN");
  assert.equal(checkManifest({ ...manifest, priority: 9 }), "priority must be 0 to 4");
  rmSync(dir, { recursive: true, force: true });
});
