import assert from "node:assert/strict";
import test from "node:test";
import { planStockPrice } from "../../skills/automate-ecom-store/scripts/stock-price.mjs";

test("stock can apply and a price cut stays a proposal", () => {
  const rows = planStockPrice([
    { sku: "SKU_1", variation: "S", field: "stock", new_value: "4", current_value: "2" },
    { sku: "SKU_2", variation: "M", field: "price", new_value: "90", current_value: "100" },
    { sku: "SKU_3", variation: "", field: "stock", new_value: "1", current_value: "1" },
    { sku: "SKU_4", variation: "S", field: "delete", new_value: "yes", current_value: "1" },
  ], { hourlyDone: 0, target: "", priceApproved: false, priceDropPercent: null });
  assert.deepEqual(rows.map((row) => row.decision), ["APPLY", "HOLD_PRICE", "REJECT", "HOLD_DELETE"]);
});

test("an approved small cut can apply and the hourly ceiling still holds", () => {
  const cut = planStockPrice([
    { sku: "SKU_2", variation: "M", field: "price", new_value: "90", current_value: "100" },
  ], { hourlyDone: 0, target: "", priceApproved: true, priceDropPercent: 15 });
  assert.equal(cut[0].decision, "APPLY");
  const capped = planStockPrice(
    Array.from({ length: 3 }, (_, index) => ({ sku: `SKU_${index}`, variation: "S", field: "stock", new_value: "1", current_value: "2" })),
    { hourlyDone: 39, target: "", priceApproved: false, priceDropPercent: null },
  );
  assert.deepEqual(capped.map((row) => row.decision), ["APPLY", "OVER_CAP", "OVER_CAP"]);
});
