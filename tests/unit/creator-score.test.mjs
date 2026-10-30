import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { mergeConfig, scoreRows } from "../../skills/automate-ecom-store/scripts/creator-score.mjs";

const script = new URL("../../skills/automate-ecom-store/scripts/creator-score.mjs", import.meta.url);

function creator(overrides) {
  return {
    handle: "<HANDLE>",
    gmv_tier: "1k-10k",
    gmv: "5000",
    items_sold: "200",
    followers: "10000",
    avg_video_views: "2000",
    engagement_rate: "0.05",
    last_activity_days: "3",
    category: "beauty",
    category_match: "yes",
    audience_gender: "female",
    audience_age: "18-24",
    audience_region: "VN",
    creator_level: "4",
    past_collab: "no",
    usual_commission: "10",
    samples_sent: "",
    sample_orders: "",
    sample_gmv: "",
    read_time: "2026-10-29T09:00:00",
    ...overrides,
  };
}

const config = mergeConfig({
  categories: "beauty",
  offered_commission: 10,
});

test("ranks a fit creator above a weaker pass and drops red flags", () => {
  const invited = new Map([["<handle_j>", "2026-10-20"], ["<handle_old>", "2026-01-01"]]);
  const rows = scoreRows([
    creator({ handle: "<HANDLE_A>", gmv: "8000", avg_video_views: "4000" }),
    creator({ handle: "<HANDLE_H>", gmv: "100", items_sold: "10", followers: "800", avg_video_views: "80" }),
    creator({ handle: "<HANDLE_B>", last_activity_days: "45" }),
    creator({ handle: "<HANDLE_C>", category_match: "no", category: "electronics" }),
    creator({ handle: "<HANDLE_D>", followers: "1000000", avg_video_views: "50" }),
    creator({ handle: "<HANDLE_E>", gmv: "0", gmv_tier: "0" }),
    creator({ handle: "<HANDLE_F>", engagement_rate: "0.001" }),
    creator({ handle: "<HANDLE_G>", engagement_rate: "" }),
    creator({ handle: "<HANDLE_I>", samples_sent: "2", sample_orders: "0", sample_gmv: "0" }),
    creator({ handle: "<HANDLE_J>" }),
    creator({ handle: "<HANDLE_OLD>" }),
    creator({ handle: "<HANDLE_A>" }),
  ], config, invited, "2026-10-29");

  const byHandle = Object.fromEntries(rows.filter((row) => row.reasons !== "duplicate").map((row) => [row.handle, row]));
  assert.equal(byHandle["<HANDLE_A>"].status, "PASS");
  assert.equal(byHandle["<HANDLE_A>"].rank, "1");
  assert.equal(byHandle["<HANDLE_H>"].status, "PASS");
  assert.ok(Number(byHandle["<HANDLE_A>"].score) > Number(byHandle["<HANDLE_H>"].score));
  assert.equal(byHandle["<HANDLE_B>"].status, "EXCLUDE");
  assert.match(byHandle["<HANDLE_B>"].reasons, /inactive/);
  assert.match(byHandle["<HANDLE_C>"].reasons, /off_category/);
  assert.match(byHandle["<HANDLE_D>"].reasons, /suspicious_ratio/);
  assert.match(byHandle["<HANDLE_E>"].reasons, /gmv_zero/);
  assert.match(byHandle["<HANDLE_F>"].reasons, /low_engagement/);
  assert.equal(byHandle["<HANDLE_G>"].status, "HOLD");
  assert.match(byHandle["<HANDLE_G>"].reasons, /missing_engagement/);
  assert.match(byHandle["<HANDLE_I>"].reasons, /sample_no_sales/);
  assert.match(byHandle["<HANDLE_J>"].reasons, /invited_90d/);
  assert.equal(byHandle["<HANDLE_OLD>"].status, "PASS");
  assert.equal(rows.filter((row) => row.handle === "<HANDLE_A>" && row.reasons === "duplicate").length, 1);
});

test("cli writes a ranked shortlist and a weight proposal", () => {
  const dir = mkdtempSync(join(tmpdir(), "creator-score-"));
  const creators = join(dir, "creators.csv");
  const invited = join(dir, "invited.csv");
  const results = join(dir, "results.csv");
  const header = "handle,gmv,items_sold,followers,avg_video_views,engagement_rate,last_activity_days,category,category_match,audience_gender,audience_age,audience_region,creator_level,past_collab,usual_commission,read_time";
  const good = "<HANDLE_A>,5000,200,10000,2000,0.05,3,beauty,yes,female,18-24,VN,4,yes,10,2026-10-29T09:00:00";
  const weak = "<HANDLE_H>,50,5,500,40,0.03,10,beauty,yes,female,18-24,VN,1,no,10,2026-10-29T09:00:00";
  writeFileSync(creators, `# synthetic\n${header}\n${good}\n${weak}\n`);
  writeFileSync(invited, "# synthetic\nhandle,invited_date\n");
  const out = spawnSync(process.execPath, [
    script.pathname,
    "--creators", creators,
    "--invited", invited,
    "--as-of", "2026-10-29",
    "--category", "beauty",
    "--offered-commission", "10",
    "--top", "1",
    "--out-dir", dir,
  ], { encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /result: OK/);
  const shortlist = readFileSync(join(dir, "shortlist.csv"), "utf8");
  const lines = shortlist.trim().split("\n");
  assert.match(lines[1], /^1,<HANDLE_A>,/);
  assert.match(lines[1], /,yes,/);

  const resultHeader = "handle,accepted,content_posted,orders,gmv,sample_cost,commission_cost,followers,avg_video_views,engagement_rate,last_activity_days,items_sold,category_match,creator_level,past_collab,usual_commission,samples_sent";
  writeFileSync(results, [
    "# synthetic",
    resultHeader,
    "<HANDLE_A>,yes,yes,4,5000,20,10,10000,2000,0.08,2,400,yes,5,yes,10,1",
    "<HANDLE_B>,yes,yes,3,4000,20,10,8000,1600,0.07,2,300,yes,5,yes,10,1",
    "<HANDLE_C>,yes,no,0,0,20,0,1000000,20,0.001,40,1,no,1,no,40,2",
    "<HANDLE_D>,yes,no,0,0,20,0,900000,15,0.001,50,1,no,1,no,40,2",
  ].join("\n"));
  const tuned = spawnSync(process.execPath, [
    script.pathname,
    "--results", results,
    "--tune",
    "--category", "beauty",
    "--offered-commission", "10",
    "--out-dir", dir,
  ], { encoding: "utf8" });
  assert.equal(tuned.status, 0, tuned.stderr);
  assert.match(tuned.stdout, /result: PROPOSAL/);
  const proposal = readFileSync(join(dir, "weight-proposal.csv"), "utf8");
  assert.match(proposal, /engagement_rate/);
  const roi = readFileSync(join(dir, "creator-results.csv"), "utf8");
  assert.match(roi, /<HANDLE_A>,yes,yes,4,5000,20,10,30,165\.6667/);
  rmSync(dir, { recursive: true, force: true });
});
