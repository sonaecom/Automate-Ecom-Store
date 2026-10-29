#!/usr/bin/env node
/**
 * Check the shared message library.
 * KOL invites must be at most 200 code points and 200 UTF-16 units.
 * Placeholders are allowed here. The send-time checker still rejects them.
 *
 *   node check-templates.mjs
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findForbidden } from "./review-phrases.mjs";

const file = join(import.meta.dirname, "..", "templates", "messages", "library.json");
const library = JSON.parse(readFileSync(file, "utf8"));
const languages = library.languages;
const required = ["en", "vi", "id", "ms", "th"];
const errors = [];

if (JSON.stringify(languages) !== JSON.stringify(required)) {
  errors.push("languages must be en, vi, id, ms, th");
}

function tooLong(text) {
  return Array.from(text).length > 200 || text.length > 200;
}

for (const [group, messages] of Object.entries(library.kol_invite)) {
  if (!required.includes(group)) errors.push(`unexpected kol language ${group}`);
}
for (const language of required) {
  for (const group of ["kol_invite", "chat_reply", "review_reply", "post_delivery"]) {
    const text = library[group]?.[language];
    if (typeof text !== "string" || !text.trim()) errors.push(`${group}.${language} missing`);
    else if (group === "kol_invite" && tooLong(text)) errors.push(`${group}.${language} over 200`);
    else if (group === "kol_invite") console.log(`kol_${language}_code_points: ${Array.from(text).length}`);
    else if (group === "post_delivery") {
      const hits = findForbidden(text);
      if (hits.length) errors.push(`${group}.${language} ${hits.join(" ")}`);
      if (Array.from(text).length > 300 || text.length > 300) errors.push(`${group}.${language} over 300`);
      if (!text.includes("<ORDER_ID>")) errors.push(`${group}.${language} missing order id`);
    }
  }
  for (const [category, titles] of Object.entries(library.titles)) {
    const text = titles[language];
    if (typeof text !== "string" || !text.includes("<BRAND>") || !text.includes("<MAIN_KEYWORD>")) {
      errors.push(`title ${category}.${language} missing brand or keyword`);
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error(error);
  console.error("result: FAIL");
  process.exit(1);
}
console.log("result: OK");
