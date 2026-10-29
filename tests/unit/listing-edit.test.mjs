import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { planListing } from "../../skills/automate-ecom-store/scripts/listing-edit.mjs";

const script = new URL("../../skills/automate-ecom-store/scripts/listing-edit.mjs", import.meta.url);

test("a price cut and a delete stay proposals, and the cap is a ceiling", () => {
  const rows = planListing([
    { item_label: "ITEM_1", field: "title", new_value: "Soft cotton tee" },
    { item_label: "ITEM_2", field: "price", new_value: "90", current_value: "100" },
    { item_label: "ITEM_3", field: "delete", new_value: "yes" },
    { item_label: "ITEM_1", field: "stock", new_value: "4" },
    { item_label: "<TITLE>", field: "title", new_value: "x" },
  ], ["item_saved"], { sessionLimit: 10, priceApproved: false, priceDropPercent: 15 });
  assert.equal(rows[0].decision, "APPLY");
  assert.equal(rows[1].decision, "HOLD_PRICE");
  assert.equal(rows[2].decision, "HOLD_DELETE");
  assert.equal(rows[3].decision, "SKIP");
  assert.equal(rows[4].decision, "REJECT");
  const many = Array.from({ length: 3 }, (_, index) => ({
    item_label: `ROW_${index}`,
    field: "title",
    new_value: "ok",
  }));
  const capped = planListing(many, [], { sessionLimit: 2 });
  assert.deepEqual(capped.map((row) => row.decision), ["APPLY", "APPLY", "OVER_CAP"]);
});

test("an approved cut under the percent can apply, and a larger cut cannot", () => {
  const small = planListing([
    { item_label: "ITEM_2", field: "price", new_value: "90", current_value: "100" },
  ], [], { sessionLimit: 10, priceApproved: true, priceDropPercent: 15 });
  assert.equal(small[0].decision, "APPLY");
  const large = planListing([
    { item_label: "ITEM_2", field: "price", new_value: "70", current_value: "100" },
  ], [], { sessionLimit: 10, priceApproved: true, priceDropPercent: 15 });
  assert.equal(large[0].decision, "HOLD_PRICE");
  const unset = planListing([
    { item_label: "ITEM_2", field: "price", new_value: "99", current_value: "100" },
  ], [], { sessionLimit: 10, priceApproved: true, priceDropPercent: null });
  assert.equal(unset[0].decision, "HOLD_PRICE");
});

test("read_only does not plan a write", () => {
  const dir = mkdtempSync(join(tmpdir(), "listing-"));
  const changes = join(dir, "changes.csv");
  writeFileSync(changes, "# synthetic\nitem_label,field,new_value,current_value\nITEM_1,title,Soft cotton tee,\n");
  const run = spawnSync(process.execPath, [
    script.pathname,
    "--changes", changes,
    "--out-dir", dir,
    "--store", "<STORE_A>",
    "--day", "2026-10-29",
    "--journal", join(dir, "journal.jsonl"),
    "--mode", "read_only",
    "--policy", "ALLOW",
  ], { encoding: "utf8" });
  assert.equal(run.status, 1, run.stderr);
  assert.match(run.stdout, /classification: write/);
  assert.match(run.stdout, /result: READ_ONLY/);
  const full = spawnSync(process.execPath, [
    script.pathname,
    "--changes", changes,
    "--out-dir", dir,
    "--store", "<STORE_A>",
    "--day", "2026-10-29",
    "--journal", join(dir, "journal.jsonl"),
    "--mode", "full",
    "--policy", "ALLOW",
    "--session-limit", "10",
  ], { encoding: "utf8" });
  assert.equal(full.status, 0, full.stderr);
  assert.match(full.stdout, /result: PLAN/);
  assert.match(full.stdout, /apply_count: 1/);
  assert.match(full.stdout, /cap_is: ceiling/);
  const plan = readFileSync(join(dir, "listing-plan.csv"), "utf8");
  assert.match(plan, /ITEM_1,title,Soft cotton tee,,APPLY,item_label/);
  rmSync(dir, { recursive: true, force: true });
});
