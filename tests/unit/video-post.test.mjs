import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  checkFileLimits,
  hashBytes,
  intakeSource,
  planPosts,
  postKey,
  postedKeysFromJournal,
  reconcilePerformance,
  reconcileStatus,
  videoAlerts,
} from "../../skills/automate-ecom-store/scripts/video-post.mjs";

const probe = { container: "mp4", duration: 20, width: 720, height: 720, size: 2000000 };

function video(overrides) {
  return {
    video_id: "CLIP_1",
    store: "<STORE_A>",
    platform: "shopee",
    placement: "product_video",
    product: "ITEM_1",
    variation: "S",
    hash: "abc",
    scan_result: "PASS",
    schedule: "09:00",
    probe,
    ...overrides,
  };
}

test("platform limits reject a short or wrong-shaped file", () => {
  assert.deepEqual(checkFileLimits(probe, "shopee", "product_video"), []);
  assert.ok(checkFileLimits({ ...probe, duration: 3 }, "shopee", "product_video").includes("length"));
  assert.ok(checkFileLimits({ ...probe, width: 720, height: 1280 }, "shopee", "product_video").includes("aspect"));
  assert.deepEqual(checkFileLimits({ ...probe, width: 720, height: 1280 }, "shopee", "shopee_video"), []);
  assert.ok(checkFileLimits(probe, "lazada", "shopee_video").includes("placement"));
});

test("drive intake waits for Google, and the queue does not double-post or fill the cap", () => {
  assert.equal(intakeSource("drive", "no"), "SKIP_DRIVE");
  assert.equal(intakeSource("local", "no"), "OK");
  assert.equal(intakeSource("drive", "yes"), "OK");
  const hash = hashBytes(Buffer.from("synthetic-video"));
  const posted = postedKeysFromJournal([{ status: "posted", videoHash: hash, store: "<STORE_A>", platform: "shopee" }]);
  const rows = planPosts([
    video({ video_id: "CLIP_DUP", hash }),
    video({ video_id: "CLIP_OK", hash: "new", schedule: "09:10" }),
    video({ video_id: "CLIP_LATE", hash: "late", schedule: "11:00" }),
    video({ video_id: "CLIP_BAD", hash: "bad", scan_result: "REVIEW" }),
    video({ video_id: "CLIP_LINK", hash: "link", variation: "" }),
  ], posted, { dailyCap: 1, firstSlot: "09:00", gapMinutes: 90 });
  assert.equal(rows.find((row) => row.video_id === "CLIP_DUP").decision, "SKIP_DUP");
  assert.equal(rows.find((row) => row.video_id === "CLIP_OK").decision, "POST");
  assert.equal(rows.find((row) => row.video_id === "CLIP_OK").slot, "09:10");
  assert.equal(rows.find((row) => row.video_id === "CLIP_LATE").decision, "OVER_CAP");
  assert.equal(rows.find((row) => row.video_id === "CLIP_BAD").decision, "SCAN");
  assert.equal(rows.find((row) => row.video_id === "CLIP_LINK").decision, "LINK");
  assert.equal(postKey(hash, "<STORE_A>", "shopee"), `${hash}|<STORE_A>|shopee`);
});

test("status and performance keep both sources and alert on reject or a low view count", () => {
  const status = reconcileStatus([
    { video_id: "CLIP_1", store: "<STORE_A>", platform: "shopee", status: "rejected", reason: "cover" },
    { video_id: "CLIP_2", store: "<STORE_A>", platform: "shopee", status: "live", reason: "" },
  ], [
    { video_id: "CLIP_1", store: "<STORE_A>", platform: "shopee", status: "rejected", reason: "cover" },
    { video_id: "CLIP_2", store: "<STORE_A>", platform: "shopee", status: "processing", reason: "" },
  ]);
  assert.equal(status[0].qc, "OK");
  assert.equal(status[1].qc, "QC_FAIL");
  assert.match(status[1].detail, /a=live/);
  assert.match(status[1].detail, /b=processing/);
  const performance = reconcilePerformance([
    { video_id: "CLIP_3", store: "<STORE_A>", platform: "tiktokshop", status: "live", views: "4", likes: "1", clicks: "", orders: "0", gmv: "10" },
    { video_id: "CLIP_4", store: "<STORE_A>", platform: "lazada", status: "live", views: "8", likes: "1", clicks: "1", orders: "0", gmv: "10" },
  ], [
    { video_id: "CLIP_3", store: "<STORE_A>", platform: "tiktokshop", status: "live", views: "9", likes: "1", clicks: "", orders: "0", gmv: "10" },
    { video_id: "CLIP_4", store: "<STORE_A>", platform: "lazada", status: "live", views: "8", likes: "1", clicks: "1", orders: "0", gmv: "10" },
  ]);
  assert.equal(performance[0].qc, "QC_FAIL");
  assert.equal(performance[0].views, "");
  assert.equal(performance[1].qc, "OK");
  assert.equal(performance[1].clicks, "1");
  const alerts = videoAlerts([
    { video_id: "CLIP_1", status: "rejected", reason: "cover", qc: "OK", views: "4" },
    { video_id: "CLIP_4", status: "live", qc: "OK", views: "8" },
    { video_id: "CLIP_3", status: "live", qc: "QC_FAIL", views: "", detail: "views a=4 b=9" },
  ], 20);
  assert.deepEqual(alerts.map((row) => row.kind).sort(), ["qc", "rejected", "underperform"]);
  assert.equal(videoAlerts([{ video_id: "CLIP_4", status: "live", qc: "OK", views: "8" }], null).length, 0);
});

test("read_only does not plan a publish", () => {
  const dir = mkdtempSync(join(tmpdir(), "video-"));
  const intake = join(dir, "in");
  mkdirSync(intake);
  writeFileSync(join(intake, "clip.json"), `${JSON.stringify(video({ hash: "new" }))}\n`);
  const run = spawnSync(process.execPath, [
    new URL("../../skills/automate-ecom-store/scripts/video-post.mjs", import.meta.url).pathname,
    "--intake", intake,
    "--source", "local",
    "--google", "no",
    "--out-dir", dir,
    "--daily-cap", "2",
    "--store", "<STORE_A>",
    "--day", "2026-10-29",
    "--journal", join(dir, "journal.jsonl"),
    "--mode", "read_only",
    "--policy", "ALLOW",
  ], { encoding: "utf8" });
  assert.equal(run.status, 1, run.stderr);
  assert.match(run.stdout, /classification: write/);
  assert.match(run.stdout, /result: READ_ONLY/);
  rmSync(dir, { recursive: true, force: true });
});
