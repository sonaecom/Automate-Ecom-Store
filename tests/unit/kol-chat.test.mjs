import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { enqueueTask, planDay, compareTasks, loadConfig } from "../../skills/automate-ecom-store/scripts/task-queue.mjs";
import { forbiddenHits as hits, sendDecision as decision } from "../../skills/automate-ecom-store/scripts/kol-chat.mjs";

const kol = new URL("../../skills/automate-ecom-store/scripts/kol-chat.mjs", import.meta.url);
const config = loadConfig("").config;
const now = "2026-10-29T09:00:00";

test("forbidden content matches a phone, a url, an email, and a handle", () => {
  assert.deepEqual(hits("Thank you"), []);
  assert.ok(hits("mail me a@b.co").includes("email"));
  assert.ok(hits("see https://example.com").includes("url"));
  assert.ok(hits("call +12025550100").includes("phone"));
  assert.ok(hits("write @creator").includes("handle"));
  assert.ok(hits("move to whatsapp").includes("off_platform"));
});

test("one open KOL thread merges, and P4 waits behind a higher score", () => {
  const queue = [];
  enqueueTask(queue, { id: "q", store: "<STORE_A>", platform: "shopee", market: "PH", action: "kol_question", target: "<CREATOR>", minutes: 5, score: 10 }, now, config, "ALLOW");
  const again = enqueueTask(queue, { id: "p", store: "<STORE_A>", platform: "shopee", market: "PH", action: "kol_problem", target: "<CREATOR>", minutes: 5, score: 10 }, "2026-10-29T09:10:00", config, "ALLOW");
  assert.equal(again.result, "MERGE");
  assert.equal(queue.length, 1);
  assert.equal(queue[0].level, "P0");
  assert.equal(queue[0].action, "kol_problem");
  const follow = enqueueTask(queue, { id: "f", store: "<STORE_A>", platform: "shopee", market: "PH", action: "kol_followup", target: "<OTHER>", minutes: 5, score: 99 }, now, config, "ALLOW");
  const sample = enqueueTask(queue, { id: "s", store: "<STORE_A>", platform: "shopee", market: "PH", action: "kol_sample", target: "<THIRD>", minutes: 5, score: 1 }, "2026-10-29T08:00:00", config, "ALLOW");
  assert.equal(follow.result, "QUEUED");
  assert.equal(sample.result, "QUEUED");
  const order = [...queue].sort(compareTasks).map((item) => item.id);
  assert.deepEqual(order, ["q", "s", "f"]);
});

test("custom invites past 10 roll forward", () => {
  const queue = [];
  for (let i = 0; i < 11; i += 1) {
    enqueueTask(queue, {
      id: `c${i}`,
      store: "<STORE_A>",
      platform: "shopee",
      market: "PH",
      action: "kol_collaborate",
      target: `<CREATOR_${i}>`,
      minutes: 1,
    }, now, config, "ALLOW");
  }
  const plan = planDay(queue, config);
  assert.equal(plan.today.length, 10);
  assert.equal(plan.tomorrow.length, 1);
});

test("an unanswered thread holds the next template, and a follow-up may send", () => {
  const rows = [
    { time: "2026-10-29T09:00:00", creator: "<CREATOR>", thread: "<THREAD>", template_id: "intro", priority: "P1", result: "sent" },
  ];
  assert.equal(decision(rows, { creator: "<CREATOR>", templateId: "intro", now: "2026-10-29T12:00:00", followUp: false }), "SKIP_TEMPLATE");
  assert.equal(decision(rows, { creator: "<CREATOR>", templateId: "no_invite", now: "2026-10-29T12:00:00", followUp: false }), "HOLD_UNANSWERED");
  assert.equal(decision(rows, { creator: "<CREATOR>", templateId: "no_invite", now: "2026-10-30T12:00:00", followUp: true }), "SEND");
});

test("cli blocks a draft with a url", () => {
  const dir = mkdtempSync(join(tmpdir(), "kol-"));
  const out = spawnSync(process.execPath, [
    kol.pathname, "--check", "--platform", "shopee", "--market", "PH", "--text", "see https://example.com",
  ], { encoding: "utf8" });
  assert.equal(out.status, 1);
  assert.match(out.stdout, /result: BLOCKED/);
  assert.match(out.stdout, /url/);
  rmSync(dir, { recursive: true, force: true });
});
