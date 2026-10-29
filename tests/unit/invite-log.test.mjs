import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = new URL("../../skills/automate-ecom-store/scripts/invite-log.mjs", import.meta.url);
const score = new URL("../../skills/automate-ecom-store/scripts/creator-score.mjs", import.meta.url);

function run(args) {
  return spawnSync(process.execPath, [script.pathname, ...args], { encoding: "utf8" });
}

test("a new handle appends once and a repeat is refused", () => {
  const dir = mkdtempSync(join(tmpdir(), "invite-log-"));
  const csv = join(dir, "log.csv");
  const first = run(["--csv", csv, "--handle", "<HANDLE_A>"]);
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /result: NEW/);
  const appended = run([
    "--csv", csv, "--append",
    "--handle", "<HANDLE_A>",
    "--campaign", "<CAMPAIGN_NAME>",
    "--time", "2026-10-29T09:00:00",
    "--terms", "fixed_all_products;expiry_30;sample_manual",
  ]);
  assert.equal(appended.status, 0, appended.stderr);
  assert.match(appended.stdout, /result: APPENDED/);
  const again = run([
    "--csv", csv, "--append",
    "--handle", "<handle_a>",
    "--campaign", "<CAMPAIGN_NAME>",
    "--time", "2026-10-29T10:00:00",
    "--terms", "fixed_all_products;expiry_30;sample_manual",
  ]);
  assert.equal(again.status, 1);
  assert.match(again.stdout, /result: SKIP/);
  const text = readFileSync(csv, "utf8");
  assert.equal(text.trim().split("\n").length, 2);
  const check = run(["--csv", csv, "--handle", "<HANDLE_A>"]);
  assert.match(check.stdout, /result: SKIP/);
  const chat = run([
    "--csv", csv, "--append",
    "--handle", "<HANDLE_A>",
    "--campaign", "<CHAT>",
    "--time", "2026-10-29T11:00:00",
    "--terms", "chat;sample_no_invite;fixed_all_products;expiry_30;sample_manual",
  ]);
  assert.equal(chat.status, 0, chat.stderr);
  assert.match(chat.stdout, /result: APPENDED/);
  const counted = run(["--csv", csv, "--count", "--terms-prefix", "chat;sample_no_invite", "--since", "2026-10-29T00:00:00"]);
  assert.match(counted.stdout, /count: 1/);
  const stillInvite = run(["--csv", csv, "--handle", "<HANDLE_A>"]);
  assert.match(stillInvite.stdout, /result: SKIP/);
  rmSync(dir, { recursive: true, force: true });
});

test("invited_time inside 90 days excludes the creator", () => {
  const dir = mkdtempSync(join(tmpdir(), "invite-score-"));
  const creators = join(dir, "creators.csv");
  const invited = join(dir, "invited.csv");
  writeFileSync(creators, [
    "# synthetic",
    "handle,gmv,items_sold,followers,avg_video_views,engagement_rate,last_activity_days,category,category_match,audience_gender,audience_age,audience_region,creator_level,past_collab,usual_commission",
    "<HANDLE_A>,5000,200,10000,2000,0.05,3,beauty,yes,female,18-24,VN,4,no,10",
  ].join("\n"));
  writeFileSync(invited, [
    "# synthetic",
    "handle,campaign_name,invited_time,terms",
    "<HANDLE_A>,<CAMPAIGN_NAME>,2026-10-20T09:00:00,fixed_all_products;expiry_30;sample_manual",
  ].join("\n"));
  const out = spawnSync(process.execPath, [
    score.pathname,
    "--creators", creators,
    "--invited", invited,
    "--as-of", "2026-10-29",
    "--category", "beauty",
    "--offered-commission", "10",
    "--out-dir", dir,
  ], { encoding: "utf8" });
  assert.notEqual(out.status, 0);
  const shortlist = readFileSync(join(dir, "shortlist.csv"), "utf8");
  assert.match(shortlist, /invited_90d/);
  rmSync(dir, { recursive: true, force: true });
});
