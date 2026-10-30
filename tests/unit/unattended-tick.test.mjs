import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const tick = new URL("../../skills/automate-ecom-store/scripts/unattended-tick.mjs", import.meta.url);
const caps = new URL("../../skills/automate-ecom-store/scripts/caps-counter.mjs", import.meta.url);

function run(script, args) {
  return spawnSync(process.execPath, [script.pathname, ...args], { encoding: "utf8" });
}

test("a fresh state may start, and a just-ended session must wait", () => {
  const dir = mkdtempSync(join(tmpdir(), "tick-"));
  const state = join(dir, "session-state.json");
  const ready = run(tick, ["--state", state, "--gap-hours", "2"]);
  assert.equal(ready.status, 0, ready.stderr);
  assert.match(ready.stdout, /result: READY/);
  assert.match(ready.stdout, /open_browser: no/);
  const opened = run(caps, ["--state", state, "--new-session"]);
  assert.equal(opened.status, 0, opened.stderr);
  const ended = run(caps, ["--state", state, "--end-session"]);
  assert.equal(ended.status, 0, ended.stderr);
  const wait = run(tick, ["--state", state, "--gap-hours", "2"]);
  assert.equal(wait.status, 1);
  assert.match(wait.stdout, /result: WAIT/);
  assert.match(wait.stdout, /gap: TOO_SOON/);
  rmSync(dir, { recursive: true, force: true });
});
