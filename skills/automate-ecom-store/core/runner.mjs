/**
 * Decide whether one module action may start.
 * Order: manifest, read-only guard, policy result, action_key journal.
 * Does not open a browser.
 */

import { checkManifest } from "./manifest/check.mjs";
import { guardReadOnly } from "./safety/read-only.mjs";
import { actionKey, journalState } from "./journal/action-key.mjs";

const BLOCKS_WRITE = new Set(["POLICY_PENDING", "STALE", "FLAG", "VIOLATION"]);

export function beginRun({ store, manifest, action, target, day, journalRows, policyResult }) {
  const manifestError = checkManifest(manifest);
  if (manifestError) return { result: "MANIFEST", detail: manifestError };
  const guard = guardReadOnly(store, { writes: manifest.writes, money: manifest.money, action });
  if (!guard.ok) return { result: guard.result };
  if (policyResult === "VIOLATION" || (manifest.writes && BLOCKS_WRITE.has(policyResult))) {
    return { result: "POLICY", detail: policyResult };
  }
  const key = actionKey({
    storeId: store.id,
    moduleId: manifest.id,
    action,
    target,
    day,
  });
  const state = journalState(journalRows || []);
  if (state.done.has(key)) return { result: "SKIP", actionKey: key };
  return { result: "RUN", actionKey: key, status: "pending" };
}
