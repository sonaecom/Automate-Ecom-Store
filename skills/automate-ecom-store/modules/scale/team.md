# Team and process

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Assign tasks, record approvals, and flag chats or orders past their SLA. Do not move money. The owner still approves a budget, a price, or a top-up.

Policy gate action is `read` for the board. A mutation still uses the gate and `{baseDir}/modules/ops/staff-audit.md`.

## Framework

Roles stay owner, marketer, and viewer. A viewer cannot record a mutating action. A proposal is an audit row with result `proposed`. The owner yes is a later row with result `approved` and the same action name. SLA clocks use `team.chat_reply_hours` and `team.order_handle_hours` from the private scale file. A placeholder hour is not a deadline. The task row carries `due_hours` only after the owner has set that number.

## Workflow

1. Write the task list: `task_id, type, opened_at, due_hours, status, assignee`. `status` is `open` or `done`. `opened_at` is an ISO time. Assignee is `<STAFF_A>` style, not a personal email.
2. Run:

```bash
node {baseDir}/scripts/scale.mjs --sla <TASK_CSV> --as-of <YYYY-MM-DDTHH:MM:SSZ>
```

3. `OVERDUE` is an alert to the owner. Do not auto-reply to clear a chat SLA.
4. Log the module with:

```bash
node {baseDir}/scripts/audit-log.mjs --role <ROLE> --action read --platform <PLATFORM> --result ok
```

A budget proposal uses `--action budget --result proposed`. Do not log a one-time code.

## Config

`team.chat_reply_hours` and `team.order_handle_hours` in `{baseDir}/modules/scale/config.example.yaml`.

## Docs

`account_automation` forbids a second account or an unofficial bot to meet an SLA. Pace and captcha rules in account safety still apply to anyone working the queue.

## QC

An overdue row is actually past `opened_at` plus `due_hours` at `--as-of`. A viewer mutate attempt is `DENIED`.

## Stop

A viewer is about to publish. An SLA would be met by a bot or a second login.

## Report

Open tasks, overdue tasks, and the latest audit result. No secrets.
