/** Block a write, or any money movement, when the store is read_only. */

const MONEY = new Set(["topup", "withdraw", "pay", "budget"]);

export function guardReadOnly(store, intent) {
  const mode = store && store.mode === "full" ? "full" : "read_only";
  const savedTopup = intent.action === "topup"
    && intent.savedCard === true
    && intent.addCard !== true
    && (intent.approved === true || intent.standing === true);
  if ((intent.money || MONEY.has(intent.action)) && !savedTopup) return { ok: false, result: "MONEY_BLOCKED" };
  if (mode === "read_only" && intent.writes) return { ok: false, result: "READ_ONLY" };
  return { ok: true, result: "ALLOW" };
}
