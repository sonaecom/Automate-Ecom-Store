# Shop data backup

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Copy listings, images, and descriptions to Google Drive so the shop can be rebuilt. Read-only on the seller site. Do not delete a listing to "clean" the backup.

## When to use

The owner asks for a backup, or the scheduler puts one backup in a session that still has time. One store per session. Stay inside the pace. A bulk export is one action, not one click per product, when the official export exists.

## Steps

1. Drive folders exist only when the owner said yes to Sheets reports. Run `push-sheets.mjs --status`. On `MISSING`, save the export under `~/.automate-ecom-store/data/backup/` and say Drive was not connected. Do not ask them to connect Google for a backup. Do not ask for the AdsPower key again.
2. Use the official product export. Save the file to Drive `Automate-Ecom-Store/exports/<platform>/`. The file name is the date and the platform, not a shop name, for example `2026-10-29-shopee-listings`.
3. Images and description text from that export, or the files already produced by the listing module, go to `Automate-Ecom-Store/images/listings/`. Do not re-download the whole gallery if the export already contains the image links and the person has the image files.
4. Write a one-line manifest next to the export: file name, row count, read time. The row count must match the export's own count. If it does not, keep both numbers and do not call the backup complete.
5. Do not store cookies, the API key, or a bank number in the backup folder.

No dashboard tab. The manifest is the record.

## Platform notes

Shopee, TikTok Shop, and Lazada each have a product export or bulk download. Use that. If the only path is opening every product, stop and ask. That would break the pace. Mass download is the path.

## QC

The file opens and the row count matches. A second look at the export page shows the same count.

## Stop

The export would require a private API. The count does not match. Drive was not connected because Sheets reports were declined, and you would open a Google sign-in anyway.

## Report

Platform, file name in Drive, row count, read time, and whether the count matched.
