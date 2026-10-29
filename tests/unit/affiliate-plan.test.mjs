import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { planInvites } from "../../skills/automate-ecom-store/scripts/affiliate-plan.mjs";
import { CEILINGS, clipWork, inviteCeiling } from "../../skills/automate-ecom-store/core/targets.mjs";

function handles(count) {
  return Array.from({ length: count }, (_, index) => ({ handle: `CREATOR_${index}`, approved: "yes" }));
}

test("a new store ramps and an empty target does not fill the ceiling", () => {
  assert.equal(inviteCeiling("A", 0), 100);
  assert.equal(inviteCeiling("A", 30), CEILINGS.invitesPerDay);
  assert.equal(inviteCeiling("C", 0), 2000);
  const unset = clipWork(4, "", 2000);
  assert.equal(unset.target, "unset");
  assert.equal(unset.allowed, 4);
  const firstDay = planInvites(handles(150), { stage: "A", dayIndex: 0, target: "" });
  assert.equal(firstDay.filter((row) => row.decision === "INVITE").length, 100);
  assert.ok(firstDay.some((row) => row.decision === "OVER_CAP"));
});

test("an owner target above the ceiling is clamped", () => {
  const clip = clipWork(10, "5000", 2000);
  assert.equal(clip.clamped, true);
  assert.equal(clip.allowed, 10);
  const planned = planInvites(handles(3), { stage: "C", dayIndex: 0, target: "2" });
  assert.deepEqual(planned.map((row) => row.decision), ["INVITE", "INVITE", "OVER_CAP"]);
});

test("read_only does not plan invites", () => {
  const dir = mkdtempSync(join(tmpdir(), "aff-"));
  writeFileSync(join(dir, "handles.csv"), "# synthetic\nhandle,approved\nCREATOR_1,yes\n");
  const run = spawnSync(process.execPath, [
    new URL("../../skills/automate-ecom-store/scripts/affiliate-plan.mjs", import.meta.url).pathname,
    "--handles", join(dir, "handles.csv"),
    "--out-dir", dir,
    "--store", "<STORE_A>",
    "--day", "2026-10-29",
    "--journal", join(dir, "journal.jsonl"),
    "--mode", "read_only",
    "--policy", "ALLOW",
  ], { encoding: "utf8" });
  assert.equal(run.status, 1, run.stderr);
  assert.match(run.stdout, /result: READ_ONLY/);
  rmSync(dir, { recursive: true, force: true });
});
