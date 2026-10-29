import assert from "node:assert/strict";
import test from "node:test";
import { reconcileDaily } from "../../skills/automate-ecom-store/scripts/daily-report.mjs";

test("two daily sources must agree and a blank is not zero", () => {
  const rows = reconcileDaily([
    { date: "2026-10-08", store: "<STORE_A>", platform: "shopee", orders: "2", gmv: "100", ads: "" },
    { date: "2026-10-09", store: "<STORE_A>", platform: "shopee", orders: "1", gmv: "40", ads: "0" },
  ], [
    { date: "2026-10-08", store: "<STORE_A>", platform: "shopee", orders: "2", gmv: "100", ads: "" },
    { date: "2026-10-09", store: "<STORE_A>", platform: "shopee", orders: "1", gmv: "40", ads: "" },
  ]);
  assert.equal(rows[0].qc, "OK");
  assert.equal(rows[1].qc, "QC_FAIL");
  assert.match(rows[1].detail, /ads a=0 b=/);
});
