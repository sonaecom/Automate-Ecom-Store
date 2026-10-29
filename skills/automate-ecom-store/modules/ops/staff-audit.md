# Staff roles and audit log

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Three roles. The audit row is written on the shop computer. It does not include a key, a token, or a full card number.

| Role | May do |
| --- | --- |
| owner | Approve proposals. The owner still performs money clicks themselves. |
| marketer | Run modules, prepare proposals, publish only when the policy gate allows and the module's QC passed. |
| viewer | Read exports and reports. The audit script rejects a mutating action from a viewer. |

```bash
node {baseDir}/scripts/audit-log.mjs --role marketer --action read --platform <PLATFORM> --result ok
```

Mutating action names match the policy gate: `publish`, `price`, `budget`, `refund`, `register`, `delete`, `stock_write`, `submit`.

Log every module start and every proposal. Do not log the text of a one-time code.

## Platform notes

Shopee, TikTok Shop, and Lazada use the same roles. The platform name goes in `--platform`. A person who works two stores still has one role. The store is chosen from the multi-store list. Do not print the profile id in the audit file.

## QC

The new row is the last line of `~/.automate-ecom-store/data/audit.csv`. A viewer mutate attempt prints `DENIED` and is not written.

## Stop

Stop if the role is unknown, or a viewer is about to change the store.

## Report

Role, action, platform, and result. No secrets.
