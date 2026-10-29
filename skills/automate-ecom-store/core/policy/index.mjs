/**
 * Single policy source. The researched list is policies/rules.yaml.
 * Do not keep a second copy under core/policy.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const skillRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const RULES_PATH = join(skillRoot, "policies", "rules.yaml");
export const SOURCES_PATH = join(skillRoot, "policies", "sources.yaml");

export function readPolicyText() {
  return readFileSync(RULES_PATH, "utf8");
}
