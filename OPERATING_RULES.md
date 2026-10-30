# Operating rules

These rules apply to every run of the Automate Ecom Store skill, whichever browser runner opens the store.

## Allowed browser runners

1. **AdsPower** (default). Opened through its official local API, skill, MCP, or CLI.
2. **MKTLogin**. Opened through its local API v2.1.1 (`MKTLOGIN_API_BASE`, default `http://localhost:4980`; optional `MKTLOGIN_API_KEY`). Choose it per store with `runner: mktlogin` in `stores.yaml`, or `--runner mktlogin` for `scripts/real-test.mjs`.

A runner only opens and closes a profile and hands back a CDP websocket. Page work is shared: Playwright attaches to the profile's own context and first tab, closes extra tabs, and keeps one tab.

## Same guards for every runner

1. Human pace: curved mouse moves, per-key typing, scrolling, random gaps.
2. Read-only mode unless the store is set to full; every write passes policy, caps, and the action-key journal.
3. Money actions (top-up, withdraw, pay, budget) are refused.
4. `--max-actions` is a hard cap: a write that would pass it stops with `LIMIT` before anything is typed or clicked.
5. Captcha: one human-like slider drag at most, then pause the store and take a screenshot.
6. Login page, "page unavailable", or identity check: stop and report.

## Never

1. No direct marketplace APIs, internal endpoints, request replay, or injected scripts. Only the normal seller-centre pages in a real profile window.
2. Never log a store into another profile, runner, or device than its own.
3. Never commit API keys, profile ids, IP addresses, or real shop or staff names.
