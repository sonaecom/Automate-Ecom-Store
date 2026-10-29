import assert from "node:assert/strict";
import test from "node:test";
import { planListings } from "../../skills/automate-ecom-store/scripts/listing-create.mjs";

test("a listing needs a variation and at least one image", () => {
  const rows = planListings([
    { title: "Soft cotton tee", variation: "S", image_count: "3" },
    { title: "<TITLE>", variation: "S", image_count: "1" },
    { title: "Cap", variation: "", image_count: "2" },
    { title: "Bag", variation: "M", image_count: "0" },
  ], { hourlyDone: 0, target: "" });
  assert.deepEqual(rows.map((row) => row.decision), ["CREATE", "REJECT", "REJECT", "REJECT"]);
});
