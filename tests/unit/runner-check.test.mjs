import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkRunner, isUnreachable } from "../../skills/automate-ecom-store/core/browser/runners.mjs";
import { exitCode } from "../../skills/automate-ecom-store/scripts/runner-check.mjs";
import { executeRealTest } from "../../skills/automate-ecom-store/scripts/real-test.mjs";

const manifest = { id: "ads.read", platforms: ["shopee"], markets: ["PH"], writes: false, money: false, priority: 2, cost: { actions: 1, captchaRisk: "low" }, input: "x", output: "y", policyTags: [] };

async function server(status = 200) {
  const s = createServer((req, res) => { res.statusCode = status; res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ code: 0, msg: "success" })); });
  await new Promise((r) => s.listen(0, "localhost", r));
  return { s, base: `http://localhost:${s.address().port}` };
}

async function closedPort() {
  const s = createServer();
  await new Promise((r) => s.listen(0, "localhost", r));
  const port = s.address().port;
  await new Promise((r) => s.close(r));
  return `http://localhost:${port}`;
}

test("isUnreachable spots refused connections but not profile errors", () => {
  const refused = new TypeError("fetch failed", { cause: Object.assign(new Error("connect"), { code: "ECONNREFUSED" }) });
  assert.equal(isUnreachable(refused), true);
  assert.equal(isUnreachable(Object.assign(new Error("adspower_start_failed"), { code: "START_FAILED" })), false);
});

test("checkRunner reports OK when the AdsPower status endpoint answers", async () => {
  const { s, base } = await server();
  try {
    const result = await checkRunner("adspower", { ADSPOWER_API_BASE: base, ADSPOWER_API_KEY: "k" });
    assert.deepEqual(result, { ok: true, runner: "adspower", reason: "OK" });
    assert.equal(exitCode(result), 0);
  } finally { s.close(); }
});

test("checkRunner flags a rejected key and a down runner differently", async () => {
  const { s, base } = await server(401);
  try {
    assert.equal((await checkRunner("adspower", { ADSPOWER_API_BASE: base, ADSPOWER_API_KEY: "k" })).reason, "AUTH_REJECTED");
  } finally { s.close(); }
  const down = await checkRunner("mktlogin", { MKTLOGIN_API_BASE: await closedPort() }, { timeoutMs: 2000 });
  assert.deepEqual(down, { ok: false, runner: "mktlogin", reason: "RUNNER_UNAVAILABLE" });
  assert.equal(exitCode(down), 3);
  const missing = await checkRunner("adspower", {});
  assert.equal(missing.reason, "MISSING_ENV");
  assert.equal(exitCode(missing), 2);
});

test("real-test stops with RUNNER_UNAVAILABLE when the runner is down", async () => {
  const dir = mkdtempSync(join(tmpdir(), "aes-runner-"));
  try {
    const log = join(dir, "r.json");
    const out = await executeRealTest(
      { store: "p1", module: "ads.read", round: "1", maxActions: "1", platform: "shopee", day: "2026-11-01", journal: join(dir, "j.jsonl"), mode: "read_only", log, runner: "adspower" },
      { manifest, env: { ADSPOWER_API_BASE: await closedPort(), ADSPOWER_API_KEY: "k" }, fetchImpl: fetch },
    );
    assert.equal(out.code, 3);
    assert.equal(out.log.result, "RUNNER_UNAVAILABLE");
    const body = readFileSync(log, "utf8");
    assert.doesNotMatch(body, /localhost|127\.0\.0\.1/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
