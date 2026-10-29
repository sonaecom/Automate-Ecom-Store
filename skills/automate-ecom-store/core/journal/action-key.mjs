/**
 * Append-only action_key journal. One key is store, module, action, target, and day.
 * Does not open a seller site.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

export function actionKey({ storeId, moduleId, action, target, day }) {
  return [storeId, moduleId, action, target, day].map((part) => String(part || "")).join("|");
}

export function readJournal(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split(/\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

export function journalState(rows) {
  const done = new Set();
  const pending = new Set();
  for (const row of rows) {
    if (row.status === "done") {
      done.add(row.actionKey);
      pending.delete(row.actionKey);
    } else if (row.status === "pending" && !done.has(row.actionKey)) {
      pending.add(row.actionKey);
    }
  }
  return { done, pending };
}

export function appendJournal(path, row) {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(row)}\n`);
}
