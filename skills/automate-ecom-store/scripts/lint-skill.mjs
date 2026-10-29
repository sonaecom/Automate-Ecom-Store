#!/usr/bin/env node
/**
 * Check SKILL.md frontmatter against VERSION.
 *   node lint-skill.mjs [skill-dir]
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] || join(import.meta.dirname, "..");
const skill = readFileSync(join(dir, "SKILL.md"), "utf8");
const versionFile = readFileSync(join(dir, "VERSION"), "utf8").trim();
const match = skill.match(/^---\n([\s\S]*?)\n---\n/);
const errors = [];
if (!match) errors.push("frontmatter missing");
const body = match ? match[1] : "";
const fields = {};
for (const line of body.split(/\n/)) {
  const split = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
  if (split) fields[split[1]] = split[2].trim().replace(/^"|"$/g, "");
}
if (fields.name !== "automate-ecom-store") errors.push("name must be automate-ecom-store");
if (!fields.description) errors.push("description missing");
if ((fields.description || "").length > 160) errors.push(`description length ${fields.description.length}`);
if (fields.version !== versionFile) errors.push(`version ${fields.version} does not match VERSION ${versionFile}`);
if (!/^\d+\.\d+\.\d+$/.test(versionFile)) errors.push("VERSION is not semver");
if (fields["user-invocable"] !== "true") errors.push("user-invocable must be true");
if (!body.includes("metadata:")) errors.push("metadata missing");
const changelog = readFileSync(join(dir, "CHANGELOG.md"), "utf8");
if (!changelog.includes(`## ${versionFile}`)) errors.push("CHANGELOG.md has no heading for VERSION");
if (errors.length) {
  for (const error of errors) console.error(error);
  console.error("result: FAIL");
  process.exit(1);
}
console.log(`version: ${versionFile}`);
console.log(`description_length: ${fields.description.length}`);
console.log("result: OK");
