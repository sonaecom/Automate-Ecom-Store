# Invite field lessons

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

These lessons apply to Shopee, TikTok Shop, and Lazada affiliate or creator invites. Read this file before the platform invite steps. If a platform file disagrees with this one on contact fields, the profile, tabs, popups, the batch template, or the invite log, this file wins. Account safety still wins on pace, captcha, and not moving money.

No shop name, link, handle, or SKU belongs in this repo. Those values live only in `~/.automate-ecom-store/invite.yaml`, copied from `{baseDir}/modules/affiliate/invite.example.yaml`.

## 1. Contact details come from this shop's config

The invite form may ask for a fixed detail, such as a social account link. Type the value from this shop's `contact` block. If the form asks for a contact field the block does not have, stop and ask. Do not leave it blank and do not invent it.

Do not open an old invitation to copy a contact field. Old rows may be hidden under a filter such as Expiring, Ended, or a status tab. Do not change those filters. Do not search the invitation list for a previous campaign.

## 2. Open this shop's profile, then do the hand work

Before any screen work, finish account-safety session start for this store only. `open-browser` uses the official AdsPower MCP or CLI and this store's `profile_id`. Then attach Playwright and do the visible clicks in that window.

Do not hunt through windows that are already open. If the window on screen is a different profile or a different shop, stop. Do not switch the account inside the page.

## 3. One tab, and Cancel on an app popup

Keep one seller tab. If a click opens another tab, close it unused.

If the browser asks to open `xdg-open`, an external app, or a prompt named Open app, click Cancel. Never click Allow. The same rule covers Open, Allow, and the same words in the page language when the prompt is about leaving the browser. A seller-centre dialog that is not an external-app prompt still follows account safety: Cancel on payment, top-up, or program join.

## 4. One standard invitation for about 10 creators

Do not send one invitation per creator. One invitation uses the standard template and holds `batch_size` creators (default 10, and never above `affiliate_batch_size`). A later invitation waits for the 2–5 minute pause, a fresh log check, and time left on the clock.

The template is:

- The same commission on every product (`commission_mode: fixed_all_products`). If the form has one rate field, that field is the config percent. If it has a rate per product, every visible rate is that same percent. Select all, type, then read it back.
- Expiry is `expiry_days` (default 30) after the start. If the page maximum is lower, use the maximum and report both numbers. Do not type a longer date.
- Sample approval stays manual. If a control would auto-approve every invited creator, leave it off. If it is already on and the only control is that switch, stop and ask. Do not turn it on.
- Samples only for rows in `samples`. Match `size` to the variation's own name. A title that contains the size is not a match. The usual allowlist is the smallest size, stored as `<SMALLEST_SIZE>` until the owner sets the real name. Any other size gets no sample and no quantity.

Creators still pass `{baseDir}/modules/affiliate/creator-audit.md` and the owner's yes before they are added. A batch is filled from that approved shortlist only.

## 5. Per-shop invite log

Each shop has its own CSV at `invite.log_csv`. Columns:

```text
handle,campaign_name,invited_time,terms
```

`invited_time` is `YYYY-MM-DDTHH:MM:SS` from the seller clock, or the shop computer's local time if the page has none. `terms` names the template, for example `fixed_all_products;expiry_30;sample_manual`. Do not put the social link, a profile id, or a key in the log.

Before reading creators, and again before each batch, check every handle you might invite:

```bash
node {baseDir}/scripts/invite-log.mjs --csv <SHOP_LOG> --handle <HANDLE>
```

`SKIP` means that handle is already in this shop's log. Do not invite them. `NEW` means they are absent. A missing file means the log is empty. `--list` prints the handles already stored.

After QC on the saved invitation, append one row per creator this submit actually invited:

```bash
node {baseDir}/scripts/invite-log.mjs --csv <SHOP_LOG> --append --handle <HANDLE> --campaign <CAMPAIGN_NAME> --time <YYYY-MM-DDTHH:MM:SS> --terms <TERMS>
```

`--append` refuses a handle that is already there and does not change the file. Run `--handle` again. Each new handle must be `SKIP`. The 90-day audit reads this same file. Pass it as `--invited`.

## Stop

- A contact field would be copied from an old invitation.
- The open window is not this store's profile.
- The browser prompt to open an app would be allowed.
- A batch would be one creator when the form can hold the batch.
- Commission differs by product, auto-approve is on, or a sample size is not on the allowlist.
- The log check was skipped, or `--append` returned `SKIP`.
