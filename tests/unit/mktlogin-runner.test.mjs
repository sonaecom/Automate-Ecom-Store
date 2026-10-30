import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listProfiles, mktloginConfig, startProfile, stopProfile, wsFromOpen } from "../../skills/automate-ecom-store/core/browser/mktlogin-runner.mjs";
import { runnerName, selectRunner } from "../../skills/automate-ecom-store/core/browser/runners.mjs";
import { executeRealTest } from "../../skills/automate-ecom-store/scripts/real-test.mjs";

const manifest = { id: "ads.read", platforms: ["shopee"], markets: ["PH"], writes: false, money: false, priority: 2, cost: { actions: 1, captchaRisk: "low" }, input: "x", output: "y", policyTags: [] };

async function mockServer({ openOk = true } = {}) {
  const calls = [];
  const server = createServer((req, res) => {
    calls.push({ url: req.url, key: req.headers["x-api-key"] || "" });
    res.setHeader("content-type", "application/json");
    if (req.url === "/api/v1/profiles") return res.end(JSON.stringify({ data: [{ id: "p1", name: "Store A", group_name: "PH", secret: "x" }] }));
    if (/\/api\/v1\/profiles\/[^/]+\/open$/.test(req.url)) {
      return res.end(JSON.stringify(openOk ? { status: true, data: { pid: 1, port_debug: 9333, ws: "ws://browser.example:9333/devtools/browser/abc" } } : { status: false, message: "busy" }));
    }
    if (/\/api\/v1\/profiles\/[^/]+\/close$/.test(req.url)) return res.end(JSON.stringify({ status: true }));
    res.statusCode = 404; res.end("{}");
  });
  await new Promise((r) => server.listen(0, "localhost", r));
  return { server, calls, base: `http://localhost:${server.address().port}` };
}

test("MKTLogin config defaults to the local port and keeps the key optional", () => {
  assert.deepEqual(mktloginConfig({}), { base: "http://localhost:4980", apiKey: "" });
  assert.equal(mktloginConfig({ MKTLOGIN_API_BASE: "http://h:1/", MKTLOGIN_API_KEY: " k " }).apiKey, "k");
  assert.throws(() => wsFromOpen({ status: false }), /mktlogin_start_failed/);
  assert.throws(() => wsFromOpen({ status: true, data: {} }), /mktlogin_ws_missing/);
});

test("runner choice defaults to AdsPower and refuses unknown names", () => {
  assert.equal(runnerName(undefined), "adspower");
  assert.equal(runnerName("MKTLogin"), "mktlogin");
  assert.throws(() => runnerName("other"), /adspower or mktlogin/);
  assert.equal(selectRunner("mktlogin", {}).config.base, "http://localhost:4980");
  assert.throws(() => selectRunner("adspower", {}), /missing_adspower_env/);
});

test("open, list and close go to the MKTLogin local API with the key header", async () => {
  const { server, calls, base } = await mockServer();
  try {
    const profiles = await listProfiles({ base, apiKey: "k" });
    assert.deepEqual(profiles, [{ id: "p1", name: "Store A", group_name: "PH" }]);
    const { ws } = await startProfile({ base, apiKey: "k", profileId: "p1" });
    assert.equal(ws, "ws://browser.example:9333/devtools/browser/abc");
    await stopProfile({ base, apiKey: "k", profileId: "p1" });
    assert.deepEqual(calls.map((c) => c.url), ["/api/v1/profiles", "/api/v1/profiles/p1/open", "/api/v1/profiles/p1/close"]);
    assert.ok(calls.every((c) => c.key === "k"));
  } finally { server.close(); }
});

test("real-test with --runner mktlogin reuses the profile tab, keeps guards, and closes the profile", async () => {
  const { server, calls, base } = await mockServer();
  const dir = mkdtempSync(join(tmpdir(), "mkt-"));
  const closed = [];
  const page = {
    url: () => "https://seller.shopee.ph/portal", goto: async () => {}, text: async () => "seller home",
    box: async () => ({ x: 1, y: 1, width: 2, height: 2 }), click: async () => true, textOf: async () => "Spend 0",
    screenshot: async () => {}, mouse: { wheel: async () => {}, move: async () => {} },
  };
  const extra = { close: async () => closed.push("extra") };
  const playwright = { chromium: { connectOverCDP: async (ws) => {
    assert.match(ws, /^ws:\/\/browser.example:9333/);
    return { contexts: () => [{ pages: () => [page, extra] }], close: async () => closed.push("browser") };
  } } };
  try {
    const out = await executeRealTest({ store: "secret-profile", module: "ads.read", round: 1, maxActions: 1, platform: "shopee", day: "2026-10-30", journal: join(dir, "j.jsonl"), log: join(dir, "r.json"), mode: "read_only", runner: "mktlogin", now: "2026-10-30T00:00:00.000Z" },
      { env: { MKTLOGIN_API_BASE: base }, playwright, wrap: false, manifest, sleep: async () => {} });
    assert.equal(out.log.result, "READ");
    assert.deepEqual(closed, ["extra", "browser"]);
    assert.deepEqual(calls.map((c) => c.url), ["/api/v1/profiles/secret-profile/open", "/api/v1/profiles/secret-profile/close"]);
    assert.equal(readFileSync(join(dir, "r.json"), "utf8").includes("secret-profile"), false);
    const money = await executeRealTest({ store: "p1", module: "ads.spend-topup", round: 1, maxActions: 1, platform: "shopee", day: "2026-10-30", journal: join(dir, "j.jsonl"), mode: "full", runner: "mktlogin" },
      { env: { MKTLOGIN_API_BASE: base }, playwright, wrap: false, manifest: { ...manifest, money: true }, sleep: async () => {} });
    assert.equal(money.log.result, "READ");
  } finally { server.close(); rmSync(dir, { recursive: true, force: true }); }
});

test("a refused MKTLogin open is an error and an unknown runner never opens a browser", async () => {
  const { server, base } = await mockServer({ openOk: false });
  try {
    const failed = await executeRealTest({ store: "p1", module: "ads.read", round: 1, maxActions: 1, platform: "shopee", day: "2026-10-30", journal: "", runner: "mktlogin" }, { env: { MKTLOGIN_API_BASE: base }, manifest });
    assert.equal(failed.log.result, "ERROR");
    const bad = await executeRealTest({ store: "p1", module: "ads.read", round: 1, maxActions: 1, platform: "shopee", day: "2026-10-30", journal: "", runner: "other" }, { env: {}, manifest });
    assert.equal(bad.log.result, "BAD_RUNNER");
  } finally { server.close(); }
});
