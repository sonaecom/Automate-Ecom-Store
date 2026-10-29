# Mall and brand upgrade

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Check whether the shop can apply for Shopee Mall, LazMall, or TikTok Shop official or brand status. Do not submit the application in this module.

Policy gate action is `read`. Submitting an application is `register` and needs `ALLOW` plus the owner's yes.

## Framework

Each program is a list of items the official page asks for. `required` defaults to yes. `met` is `yes`, `no`, or `unknown`. `READY` means every required item is `yes`. `NOT_READY` means one required item is `no`. `HOLD` means a required item is still `unknown`. Do not turn an unknown into a yes. Brand registration documents are named, not uploaded to git. Store the files in the owner's drive, outside this repo.

## Workflow

1. Open the official Mall or brand page for this market in the seller profile, one tab, human pace. If the menu label does not match, stop and ask.
2. Rows: `program, item, required, met`. Programs: `shopee_mall`, `laz_mall`, `tiktok_brand`.
3. Typical items to confirm on that page, not to assume: account health, penalty standing, brand authorisation document, and the operating history the page itself names. Copy a number only when it is on the page. Leave it `unknown` until then.
4. Run:

```bash
node {baseDir}/scripts/scale.mjs --mall <MALL_CSV>
```

5. Show the result to the owner. Do not click Apply or Register. A later yes is a new session with action `register`.

## Config

No private threshold. The official page is the config. PH, MY, and ID pages that are still summaries stay `verify: yes` until the research files land. See `{baseDir}/policies/incoming/README.md`.

## Docs

Account and brand rules are `account_automation` and `prohibited_restricted` in the market policy file. A counterfeit or missing authorisation is `no`, not a document you draft yourself.

## QC

Every `yes` points at a screenshot or a file the owner holds. The script result matches the rows.

## Stop

You would submit the Mall form. You would mark `unknown` as `yes`. You would put an identity document in git.

## Report

Program, result, the items still unknown or unmet, and the read time. No document images in the chat log.
