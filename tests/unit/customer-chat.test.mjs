import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { loadRules, rulesFor } from "../../skills/automate-ecom-store/scripts/policy-rules.mjs";
import { planChats } from "../../skills/automate-ecom-store/scripts/customer-chat.mjs";

const rules = rulesFor(loadRules(), "shopee", "PH");

test("a refund or a contact is not sent, and the cap is not filled", () => {
  const rows = planChats([
    { thread: "THREAD_1", text: "Your order ships today.", buyer_message: "When will it ship?" },
    { thread: "THREAD_2", text: "I can help on this page.", buyer_message: "Can I get a refund?" },
    { thread: "THREAD_3", text: "Message me on whatsapp.", buyer_message: "hello" },
    { thread: "THREAD_4", text: "<REPLY>", buyer_message: "hello" },
  ], { rules, target: "1" });
  assert.deepEqual(rows.map((row) => row.decision), ["SEND", "BLOCK", "BLOCK", "REJECT"]);
  const many = Array.from({ length: 4 }, (_, index) => ({
    thread: `THREAD_${index}`,
    text: "Thanks for the order.",
    buyer_message: "ok",
  }));
  const open = planChats(many, { rules, target: "" });
  assert.equal(open.filter((row) => row.decision === "SEND").length, 4);
});

test("read_only does not plan a reply", () => {
  const dir = mkdtempSync(join(tmpdir(), "chat-"));
  writeFileSync(join(dir, "threads.csv"), "# synthetic\nthread,text,buyer_message\nTHREAD_1,Thanks for the order.,ok\n");
  const run = spawnSync(process.execPath, [
    new URL("../../skills/automate-ecom-store/scripts/customer-chat.mjs", import.meta.url).pathname,
    "--threads", join(dir, "threads.csv"),
    "--platform", "shopee",
    "--market", "PH",
    "--out-dir", dir,
    "--store", "<STORE_A>",
    "--day", "2026-10-29",
    "--journal", join(dir, "journal.jsonl"),
    "--mode", "read_only",
    "--policy", "ALLOW",
  ], { encoding: "utf8" });
  assert.equal(run.status, 1, run.stderr);
  assert.match(run.stdout, /classification: write/);
  assert.match(run.stdout, /result: READ_ONLY/);
  rmSync(dir, { recursive: true, force: true });
});
