#!/usr/bin/env node
/**
 * Append a staff audit row. Viewer cannot record a mutating action.
 * Roles: owner, marketer, viewer.
 */

import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ROLES = new Set(["owner", "marketer", "viewer"]);
const MUTATING = new Set(["publish", "price", "budget", "refund", "register", "delete", "stock_write", "submit"]);

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

const role = arg("--role");
const action = arg("--action");
const platform = arg("--platform");
const outcome = arg("--result") || "ok";
if (!ROLES.has(role) || !action) {
  console.error("usage: node audit-log.mjs --role owner|marketer|viewer --action name --platform name --result ok");
  process.exit(2);
}
if (role === "viewer" && MUTATING.has(action)) {
  console.log("result: DENIED");
  process.exit(1);
}
const dir = join(homedir(), ".automate-ecom-store", "data");
mkdirSync(dir, { recursive: true, mode: 0o700 });
const file = join(dir, "audit.csv");
if (!existsSync(file)) {
  appendFileSync(file, "logged_at,role,action,platform,result\n", { mode: 0o600 });
}
appendFileSync(file, `${new Date().toISOString()},${role},${action},${platform},${outcome}\n`);
console.log("result: LOGGED");
