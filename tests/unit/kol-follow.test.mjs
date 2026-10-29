import assert from "node:assert/strict";
import test from "node:test";
import { planFollow } from "../../skills/automate-ecom-store/scripts/kol-follow.mjs";

test("no GMV threshold means review, not a reminder", () => {
  const open = planFollow([
    { handle: "CREATOR_1", video_posted: "no", gmv: "0" },
    { handle: "CREATOR_2", video_posted: "yes", gmv: "20" },
  ], { threshold: "" });
  assert.deepEqual(open.map((row) => row.decision), ["REVIEW", "REVIEW"]);
  const set = planFollow([
    { handle: "CREATOR_1", video_posted: "no", gmv: "0" },
    { handle: "CREATOR_2", video_posted: "yes", gmv: "20" },
    { handle: "CREATOR_3", video_posted: "yes", gmv: "5" },
  ], { threshold: "10" });
  assert.deepEqual(set.map((row) => row.decision), ["REMIND", "KEEP", "REVIEW"]);
});
