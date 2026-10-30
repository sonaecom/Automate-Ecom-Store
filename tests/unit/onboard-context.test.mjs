import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { QUESTIONS, buildSteps, parseRoadmapYaml, resuggest } from "../../skills/automate-ecom-store/scripts/onboard-context.mjs";

const script = new URL("../../skills/automate-ecom-store/scripts/onboard-context.mjs", import.meta.url);
const secretProfile = "secret-profile-id";

function run(args, input, home) {
  return spawnSync(process.execPath, [script.pathname, ...args], {
    encoding: "utf8",
    input,
    env: { ...process.env, HOME: home },
  });
}

function seed(home) {
  const dir = join(home, ".automate-ecom-store");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "config.yaml"), `${JSON.stringify({
    adspower: { api_key: "synthetic-key", api_base: "", headless: false },
    stores: [
      { platform: "shopee", profile_id: secretProfile, label: "<STORE_A>", market: "", staff: "" },
      { platform: "lazada", profile_id: secretProfile, label: "<STORE_B>", market: "", staff: "" },
    ],
  }, null, 2)}\n`);
  return dir;
}

test("questions are Vietnamese multiple choice and skippable", () => {
  assert.match(QUESTIONS, /bỏ qua/);
  assert.match(QUESTIONS, /Shopee/);
  assert.match(QUESTIONS, /TikTok Shop/);
  assert.match(QUESTIONS, /Lazada/);
  assert.match(QUESTIONS, /Cửa hàng mới/);
  assert.match(QUESTIONS, /Theo tuần/);
});

test("save writes stages and a roadmap without the profile id", () => {
  const home = mkdtempSync(join(tmpdir(), "onboard-"));
  const dir = seed(home);
  const saved = run(["--save", "--today", "2026-10-29"], JSON.stringify({
    store_count: "many",
    platforms: ["shopee", "tiktok"],
    markets: ["VN", "PH"],
    goals: ["loi_nhuan"],
    team_size: "2-5",
    cadence: "month",
    stores: [
      { label: "<STORE_A>", stage: "A", market: "VN" },
      { label: "<STORE_B>", stage: "B", market: "PH" },
    ],
  }), home);
  assert.equal(saved.status, 0, saved.stderr);
  assert.match(saved.stdout, /result: OK/);
  assert.equal(saved.stdout.includes(secretProfile), false);
  assert.equal(saved.stdout.includes("synthetic-key"), false);
  const live = JSON.parse(readFileSync(join(dir, "config.yaml"), "utf8"));
  assert.equal(live.stores[0].stage, "A");
  assert.equal(live.stores[0].market, "VN");
  assert.equal(live.stores[0].profile_id, secretProfile);
  const roadmap = readFileSync(join(dir, "roadmap.md"), "utf8");
  const yaml = readFileSync(join(dir, "roadmap.yaml"), "utf8");
  assert.match(roadmap, /modules\/listing\/method.md/);
  assert.match(roadmap, /modules\/fees\/fee-cap.md/);
  assert.equal(roadmap.includes(secretProfile), false);
  assert.equal(yaml.includes(secretProfile), false);
  const doc = parseRoadmapYaml(yaml);
  assert.equal(doc.cadence, "month");
  assert.equal(doc.steps.filter((step) => step.stage === "A" && step.period === "1").length, 2);
  assert.ok(doc.steps.some((step) => step.stage === "C") === false);
  rmSync(home, { recursive: true, force: true });
});

test("a full skip does not invent a roadmap", () => {
  const home = mkdtempSync(join(tmpdir(), "onboard-skip-"));
  const dir = seed(home);
  const skipped = run(["--save"], "{\"skip\":true}\n", home);
  assert.equal(skipped.status, 0, skipped.stderr);
  assert.match(skipped.stdout, /result: SKIPPED/);
  assert.equal(existsSync(join(dir, "roadmap.yaml")), false);
  rmSync(home, { recursive: true, force: true });
});

test("period end repeats a missed KPI and waits before the end", () => {
  const stores = [{ label: "<STORE_A>", platform: "shopee", market: "VN", stage: "A" }];
  const doc = buildSteps(stores, "month", "2026-10-01");
  assert.equal(resuggest(doc, [], "2026-10-15").wait, true);
  const current = doc.steps.filter((step) => Number(step.period) === 1);
  const results = current.map((step, index) => ({ store: step.store, kpi: step.kpi, met: index === 0 ? "no" : "yes" }));
  const outcome = resuggest(doc, results, doc.period_end);
  assert.equal(outcome.doc.steps.filter((step) => step.status === "repeat").length, 1);
  assert.ok(outcome.doc.steps.some((step) => step.status === "done"));
  const shifted = outcome.doc.steps.find((step) => step.module === "modules/growth/ads-kickstart.md");
  const original = doc.steps.find((step) => step.module === "modules/growth/ads-kickstart.md");
  assert.equal(Number(shifted.period), Number(original.period) + 1);
});

test("stage C recommends scaling modules and a bad market is rejected", () => {
  const doc = buildSteps([{ label: "<STORE_C>", platform: "tiktokshop", market: "TH", stage: "C" }], "quarter", "2026-01-01");
  assert.ok(doc.steps.some((step) => step.module === "modules/scale/mall.md"));
  assert.ok(doc.steps.some((step) => step.module === "modules/scale/stock.md"));
  const home = mkdtempSync(join(tmpdir(), "onboard-bad-"));
  seed(home);
  const rejected = run(["--save"], JSON.stringify({ markets: ["US"] }), home);
  assert.equal(rejected.status, 2);
  assert.match(rejected.stderr, /market/);
  rmSync(home, { recursive: true, force: true });
});
