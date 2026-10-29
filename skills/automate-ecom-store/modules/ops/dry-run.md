# Dry run

Every module uses this file when the person says "dry run", or when `save-config.mjs --status` prints `dry_run: true`.

Walk the module from the first step through the last QC step. Open the same pages. Take the same screenshots. Write the same report, with `dry_run: true` at the top.

Do not click Save, Submit, Send, Publish, Update, Register, Pay, Top up, or Withdraw. Do not press the final button on a dialog. Do not type a message into a live chat and send it.

Before a click that would change the store, run:

```bash
node {baseDir}/scripts/dry-run.mjs --action submit
```

`BLOCKED` means stop on that click and describe the button you did not press. `ALLOWED` is only for a read, a screenshot, or a scroll.

A dry run still obeys account safety: one visible tab, human pace, no proxy change, no headless window.
