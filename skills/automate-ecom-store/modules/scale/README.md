# Growth-stage store

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Use this set when the store is already selling and the launch plan is no longer the main job. Money stays read-only. A budget, a price, or a top-up is a proposal until the owner says yes for that amount. Account safety still sets the pace and the captcha stop.

Private numbers live in `~/.automate-ecom-store/scale.yaml`, copied from `{baseDir}/modules/scale/config.example.yaml`. The script reads that file with `--config` and ignores a placeholder.

| Job | Read |
| --- | --- |
| Margin falls while sales rise | `{baseDir}/modules/scale/margin.md` |
| Step an ad budget or pause a losing group | `{baseDir}/modules/scale/ads-scale.md` |
| Restock before a stockout | `{baseDir}/modules/scale/stock.md` |
| Late ship, cancels, chat, penalty points | `{baseDir}/modules/scale/health.md` |
| Clone a best seller to another market | `{baseDir}/modules/scale/expand.md` |
| Repeat buyers and refill reminders | `{baseDir}/modules/scale/repeat.md` |
| Tasks, approvals, and SLAs | `{baseDir}/modules/scale/team.md` |
| Mall or brand eligibility | `{baseDir}/modules/scale/mall.md` |

PH, MY, and ID official policy pages will replace the summaries already at `policies/<platform>/{PH,MY,ID}.md`. The drop-in shape is `{baseDir}/policies/incoming/README.md`.
