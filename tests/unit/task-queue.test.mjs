import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { compareTasks, enqueueTask, loadConfig, planDay, summarize } from "../../skills/automate-ecom-store/scripts/task-queue.mjs";

const script = new URL("../../skills/automate-ecom-store/scripts/task-queue.mjs", import.meta.url);
const config = loadConfig("").config;
const now = "2026-10-29T09:00:00";

function task(overrides) {
  return {
    store: "<STORE_A>",
    platform: "shopee",
    market: "VN",
    action: "report",
    target: "<REPORT>",
    params: {},
    minutes: 10,
    ...overrides,
  };
}

test("owner pin beats P0, and the same task merges", () => {
  const queue = [];
  const urgent = enqueueTask(queue, task({ id: "p0", action: "chat", target: "<THREAD>", level: "P0" }), now, config, "ALLOW");
  const pinned = enqueueTask(queue, task({ id: "pin", action: "report", target: "<REPORT>", pin: 2, level: "P3" }), now, config, "ALLOW");
  assert.equal(urgent.result, "QUEUED");
  assert.equal(pinned.result, "QUEUED");
  const order = [...queue].sort(compareTasks).map((item) => item.id);
  assert.deepEqual(order, ["pin", "p0"]);
  const again = enqueueTask(queue, task({ id: "dup", action: "chat", target: "<THREAD>" }), "2026-10-29T10:00:00", config, "ALLOW");
  assert.equal(again.result, "MERGE");
  assert.equal(queue.length, 2);
  assert.equal(urgent.task.merged, 2);
});

test("different params on the same SKU are a conflict, and a blocked gate stays out of the plan", () => {
  const queue = [];
  enqueueTask(queue, task({ id: "a", action: "stock_sync", target: "<SKU_A>", params: { qty: "5" }, minutes: 10 }), now, config, "ALLOW");
  const clash = enqueueTask(queue, task({ id: "b", action: "stock_sync", target: "<SKU_A>", params: { qty: "9" }, minutes: 10 }), now, config, "ALLOW");
  assert.equal(clash.result, "CONFLICT");
  assert.equal(queue.find((item) => item.id === "a").status, "conflict");
  const blocked = enqueueTask(queue, task({ id: "c", action: "listing", target: "<SKU_B>", minutes: 10 }), now, config, "POLICY_PENDING");
  assert.equal(blocked.result, "BLOCKED");
  const plan = planDay(queue, config);
  assert.deepEqual(plan.today.map((row) => row.id), []);
});

test("a long task is chunked so a later urgent item still fits today", () => {
  const queue = [];
  enqueueTask(queue, task({ id: "list", action: "listing", target: "<SKU_A>", minutes: 50 }), now, config, "ALLOW");
  enqueueTask(queue, task({ id: "chat", action: "chat", target: "<THREAD>", minutes: 10 }), now, config, "ALLOW");
  const plan = planDay(queue, config);
  assert.equal(plan.budget, 40);
  assert.equal(plan.today[0].id, "chat");
  assert.ok(plan.today.reduce((sum, row) => sum + row.minutes, 0) <= 40);
  const listLeft = plan.tomorrow.find((row) => row.id === "list");
  assert.ok(listLeft);
  const counts = summarize([
    { status: "done", done_on: "2026-10-29" },
    { status: "pending" },
    { status: "blocked" },
    { status: "conflict" },
  ], "2026-10-29");
  assert.equal(counts.done, 1);
  assert.equal(counts.pending, 1);
  assert.equal(counts.blocked, 1);
  assert.equal(counts.conflict, 1);
});

test("cli rejects a second store while one session is running and gates a stock write", () => {
  const dir = mkdtempSync(join(tmpdir(), "queue-"));
  const env = { ...process.env, TASK_QUEUE_TEST: "1" };
  const enqueue = (store, extra) => spawnSync(process.execPath, [
    script.pathname, "--queue-dir", dir, "--store", store, "--enqueue", "--now", now, ...extra,
  ], { encoding: "utf8", env });
  const first = enqueue("<STORE_A>", ["--platform", "shopee", "--market", "VN", "--action", "chat", "--target", "<THREAD>", "--minutes", "10", "--gate-result", "ALLOW"]);
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /result: QUEUED/);
  const started = spawnSync(process.execPath, [script.pathname, "--queue-dir", dir, "--store", "<STORE_A>", "--start"], { encoding: "utf8", env });
  assert.equal(started.status, 0, started.stderr);
  const busy = spawnSync(process.execPath, [script.pathname, "--queue-dir", dir, "--store", "<STORE_B>", "--plan"], { encoding: "utf8", env });
  assert.equal(busy.status, 1);
  assert.match(busy.stdout, /result: BUSY/);
  const real = spawnSync(process.execPath, [
    script.pathname, "--queue-dir", dir, "--store", "<STORE_A>", "--enqueue",
    "--platform", "shopee", "--market", "ZZ", "--action", "stock_sync", "--target", "<SKU_A>", "--minutes", "10",
  ], { encoding: "utf8" });
  assert.equal(real.status, 1);
  assert.match(real.stdout, /result: BLOCKED/);
  const saved = readFileSync(join(dir, "<STORE_A>.json"), "utf8");
  assert.equal(saved.includes("profile"), false);
  rmSync(dir, { recursive: true, force: true });
});

test("session length outside 30 to 40 minutes is rejected", () => {
  const bad = loadConfig("session_minutes: 90\n");
  assert.match(bad.error, /30 to 40/);
});
