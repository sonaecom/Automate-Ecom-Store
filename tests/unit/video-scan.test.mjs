import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadRules, rulesFor } from "../../skills/automate-ecom-store/scripts/policy-rules.mjs";
import { scanVideo } from "../../skills/automate-ecom-store/scripts/video-scan.mjs";

const passSpec = JSON.parse(readFileSync(new URL("../../skills/automate-ecom-store/templates/sample-video-pass.json", import.meta.url), "utf8"));
const blockSpec = JSON.parse(readFileSync(new URL("../../skills/automate-ecom-store/templates/sample-video-block.json", import.meta.url), "utf8"));

function scan(spec, platform, market) {
  return scanVideo({
    ...spec,
    platform,
    market,
    now: "2026-10-29T00:00:00.000Z",
    rules: rulesFor(loadRules(), platform, market),
  });
}

test("a clean local scan is the only publish result", () => {
  const report = scan(passSpec, "shopee", "PH");
  assert.equal(report.result, "PASS");
  assert.equal(report.publish, "yes");
  assert.equal(report.upload, "disabled");
  assert.equal(report.reasons.length, 0);
});

test("off-platform contact and a price mismatch block publish", () => {
  const report = scan(blockSpec, "shopee", "PH");
  assert.equal(report.result, "BLOCK");
  assert.equal(report.publish, "no");
  assert.ok(report.reasons.some((row) => row.check === "text.caption" && row.rule));
  assert.ok(report.reasons.some((row) => row.reason === "price_does_not_match_listing" && row.rule === "SH-PH-023"));
});

test("a prohibited example from rules.yaml blocks, and a missing probe is review", () => {
  const banned = scan({ ...passSpec, title: "firearms case" }, "lazada", "PH");
  assert.equal(banned.result, "BLOCK");
  assert.ok(banned.reasons.some((row) => row.rule === "LA-PH-097" && row.reason.includes("firearms")));
  const unsure = scan({ ...passSpec, probe: null, visual: null }, "shopee", "PH");
  assert.equal(unsure.result, "REVIEW");
  assert.equal(unsure.publish, "no");
  assert.ok(unsure.reasons.some((row) => row.check === "video.details"));
  assert.ok(unsure.reasons.some((row) => row.check === "image.cover"));
});

test("an uncertain image check and a medical claim do not pass", () => {
  const visual = scan({
    ...passSpec,
    visual: { ...passSpec.visual, before_after: "unknown" },
  }, "shopee", "PH");
  assert.equal(visual.result, "REVIEW");
  assert.equal(visual.publish, "no");
  const medical = scan({ ...passSpec, caption: "This cream cures eczema" }, "shopee", "PH");
  assert.equal(medical.result, "BLOCK");
  assert.ok(medical.reasons.some((row) => row.reason === "medical_or_health_claim" && row.at === "00:00:00"));
});
