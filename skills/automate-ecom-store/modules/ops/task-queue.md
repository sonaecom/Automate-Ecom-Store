# Task queue

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Every owner request and every scheduled job is one item in that store's queue. One store label is one AdsPower profile. The day plan holds at most 10 stores. A captcha pauses only that store. A hung profile is closed and opened again. A pending action key is resumed. A done key is not run again.

```bash
node {baseDir}/scripts/orchestrator.mjs --stores ~/.automate-ecom-store/data/orchestrator-stores.json --now <HH:MM> --night-start 01:00 --day-start 08:00 --stagger 20 --out-dir ~/.automate-ecom-store/data/orchestrator/
```

`OPEN` and `RESTART` use official AdsPower `open-browser` with `"headless":"0"`. `CLOSE` closes that profile. Batches stay inside 40–50 minutes, then a 10–20 minute break. The night window defaults to on (01:00–05:00). Set `night: off` on a store to skip it. `--stores` accepts `stores.example.yaml` or a JSON array. Starts are staggered. Do not open an eleventh store. The executor is `scripts/real-test.mjs`. Unit tests are `node --test tests/unit/*.test.mjs` from the repo root.

Config is `{baseDir}/tasks.example.yaml`, copied to `~/.automate-ecom-store/tasks.yaml`. The queue file stays under `~/.automate-ecom-store/data/queues/`. Do not put a profile id in either file.

## Before it is queued

1. Dedupe. The same action, target, and params inside `dedupe_window_hours` (default 24) merge into the open item. A finished copy inside that window is `SKIP`. Do not add a second one. A KOL chat is one open thread per creator: a new message on that thread updates the task. The same template is not sent twice in 24 hours. Nothing is sent while the shop's last message is unanswered, except a scheduled follow-up.
2. Conflict. The same action and target with different params, including two stock writes or two settings for one SKU, is `CONFLICT`. Leave both for the owner. Do not pick one.
3. Policy gate. The script runs `policy-gate.mjs`. A read may stay queued on `POLICY_PENDING` or `STALE`. A mutating action with `POLICY_PENDING`, `STALE`, `VIOLATION`, or `FLAG` is `BLOCKED` and is not in today's plan. `VIOLATION` blocks a read too.

## Priority

The owner's pin and reorder come first. Then the default level:

| Level | Work |
| --- | --- |
| P0 | Captcha or handover, shop-health penalties, stockouts, disputes with a 1–2 day evidence or return-review deadline, customer chat inside the SLA |
| P1 | Orders, stock sync, ads guard under the cap |
| P2 | Affiliate invites, listings, campaigns |
| P3 | Reports and analytics. For KOL chat: a creator with no invite who asks to collaborate |
| P4 | KOL scheduled follow-ups only. Other work has no P4 |

```bash
node {baseDir}/scripts/task-queue.mjs --store <STORE_LABEL> --reorder t2,t1
```

The first id is the pin. A pinned P3 runs before an unpinned P0. Inside one KOL level, a higher creator score comes before an older thread. KOL chat actions are `kol_problem`, `kol_deadline`, `kol_sample`, `kol_question`, `kol_collaborate`, and `kol_followup`. A session holds at most `kol_messages_per_session` (30) of those, and at most `kol_custom_invites_per_session` (10) `kol_collaborate` items. The rest move to the next session.

## Session budget

A session is 30–40 minutes (`session_minutes`, default 40). A longer value is rejected. A task longer than `chunk_minutes` (default 10) splits into chunks. The plan takes one chunk from each task in priority order, then another, so a long listing does not sit on top of a chat. What does not fit today is tomorrow. `daily_sessions` defaults to 1 because the next session still waits for the gap in account safety.

```bash
node {baseDir}/scripts/task-queue.mjs --store <STORE_LABEL> --enqueue --platform <PLATFORM> --market <MARKET> --action chat --target <THREAD> --minutes 10 --module <MODULE>
node {baseDir}/scripts/task-queue.mjs --store <STORE_LABEL> --plan
node {baseDir}/scripts/task-queue.mjs --store <STORE_LABEL> --start
```

`--start` marks the first today row running and holds the single session. On `TIME_UP`, save a checkpoint and stop. Do not start the next chunk in a second window.

```bash
node {baseDir}/scripts/task-queue.mjs --store <STORE_LABEL> --checkpoint --id <ID> --note "<CHECKPOINT>"
```

The note is the resume point (page, row, or batch). The next session continues at `next_chunk`. `--done` closes the task.

## Daily plan and end of day

`--plan` is the daily plan: what fits today, what moves to tomorrow, and the minutes left. Show that in chat before the session. At the end of the day:

```bash
node {baseDir}/scripts/task-queue.mjs --store <STORE_LABEL> --summary --date <YYYY-MM-DD>
```

Report done, pending, blocked, and conflict. A conflict or a blocked gate is not done.

The dashboard page `Hàng đợi` reads `queue.csv` with the same columns. Push a `Queue` tab only when `sheets_reports` is yes. Do not connect Google for the queue.

## Stop

- `BUSY` because another store's session is open.
- `CONFLICT` or `BLOCKED`.
- `session_minutes` is outside 30–40.
- The plan would open a second profile.
