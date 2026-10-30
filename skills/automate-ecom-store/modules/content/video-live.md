# Finished video publish

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Classification: **write** for a post. A status or performance read is **read**. Publish only when `video-scan.mjs` prints `result: PASS` and `video-post.mjs` prints `decision: POST`. `BLOCK`, `REVIEW`, `SCAN`, `LIMIT`, `LINK`, `SKIP_DUP`, and `OVER_CAP` mean do not post.

This module does not generate a video. It only takes a finished file. Livestream is not developed. Do not start, schedule, or end a live from this file.

The manifest id is `content.video-live`. AdsPower opens only that store's profile (`open-browser`, `"headless":"0"`). Playwright MCP does the visible clicks at human pace (`delay-range.mjs`). One tab. If a label is not on the screen, stop and screenshot. Do not hunt through ads or wallet.

## When to use

The owner has a finished product video and wants it on Shopee (product video or Shopee Video), TikTok Shop (product video or shop video), or Lazada (product video). Not for an ad budget. Not for a livestream.

## Intake

One JSON manifest per video, copied from `{baseDir}/templates/sample-video-intake.json`. The sample is synthetic. Fields: product, variation, platform, market, title, caption, hashtags, cover, schedule, plus the scan fields in `{baseDir}/templates/sample-video-pass.json`.

Local folder is the default. Google Drive is optional and only when `save-config.mjs --status` prints a Google yes (`sheets_reports: yes` or `inventory_sheet: yes`). The agent may copy that Drive folder onto the machine with the Drive tool, then this script reads the local copy. `--source drive` with `--google no` stops at `SKIP_DRIVE` and does not call Google.

Format, length, size, and aspect ratio are checked against `{baseDir}/modules/content/video-limits.json` for that platform and placement. The seller upload screen wins if it shows a tighter limit. A file outside the ceiling is `LIMIT` and is not posted.

## Queue

The daily cap comes from that store's profile (`--daily-cap`). It is a ceiling, not a quota to fill. Slots start at `--first-slot` and step by `--gap-minutes`, and a video is not posted before its own `schedule`. The same file is not posted twice: the idempotency journal key is the video hash, the store, and the platform.

```bash
node {baseDir}/scripts/video-post.mjs --intake ~/.automate-ecom-store/data/videos/intake --source local --google no --out-dir ~/.automate-ecom-store/data/video/ --daily-cap <VIDEO_CAP> --first-slot 09:00 --gap-minutes 90 --store <STORE_LABEL> --day <YYYY-MM-DD> --mode full --policy ALLOW --journal ~/.automate-ecom-store/data/journal/<STORE_LABEL>.jsonl --post-journal ~/.automate-ecom-store/data/video/posted.jsonl
```

`read_only` does not plan a post. After a real post, append one line to `posted.jsonl`: `{"status":"posted","videoHash":"<HASH>","store":"<STORE_LABEL>","platform":"<PLATFORM>"}`.

Scan each `POST` row before the click:

```bash
node {baseDir}/scripts/video-scan.mjs --spec <MANIFEST> --platform <PLATFORM> --market <MARKET> --video <VIDEO_FILE> --out ~/.automate-ecom-store/data/video/scan-report.json
```

Continue only on `PASS`, then `policy-gate.mjs --action publish`.

## Publish

Open that shop's AdsPower profile, then attach Playwright. Human pace. One tab. Link the file to the product and the variation named in the manifest. Match the variation's own name, not the product title. QC #1 screenshot `screenshots/qc1-video.png` before publish. QC #2 screenshot `screenshots/qc2-video.png` after the post is visible.

- Shopee product video: the product's own video slot.
- Shopee Video: the Shopee Video entry, still tied to that product and variation.
- TikTok Shop: product video or shop video, as `placement` says.
- Lazada: the product video slot.

## After publish

Read the status from the store screen and from the store's video export. Both sources. Do not average a mismatch.

```bash
node {baseDir}/scripts/video-post.mjs --status-a <SCREEN_CSV> --status-b <EXPORT_CSV> --out-dir ~/.automate-ecom-store/data/video/ --store <STORE_LABEL> --day <YYYY-MM-DD> --mode read_only --policy ALLOW --journal ~/.automate-ecom-store/data/journal/<STORE_LABEL>.jsonl
```

Status is `processing`, `live`, or `rejected`. A rejection keeps the store's reason. `QC_FAIL` keeps both values.

Performance is the same two-source read: views, likes, clicks, orders, and GMV where the store shows them. A blank cell is missing, not zero. Push `video-performance.csv` to the `VideoFacts` tab only when Google Sheets reports are yes. The dashboard page is `Video`.

```bash
node {baseDir}/scripts/video-post.mjs --performance-a <SCREEN_CSV> --performance-b <EXPORT_CSV> --views-floor <VIEWS_FLOOR> --out-dir ~/.automate-ecom-store/data/video/ --store <STORE_LABEL> --day <YYYY-MM-DD> --mode read_only --policy ALLOW --journal ~/.automate-ecom-store/data/journal/<STORE_LABEL>.jsonl
```

Omit `--views-floor` while it is still a placeholder. The script then does not invent an underperform line.

## Alerts

`video-alerts.csv` and the dashboard alerts list a rejected video, a two-source mismatch, and a live video whose agreed view count is under the floor. Do not repost a duplicate. Do not start a livestream.

## QC

Scan `PASS`, queue `POST`, variation name matches, both screenshots match, status agrees or both figures are shown, performance agrees or both figures are shown.

## Stop

A scan is not `PASS`. The hash was already posted for this store and platform. The cap is full. The label is not on screen. The variation is missing or is only the product title. A livestream control is on screen: do not use it.

## A passing real run

One finished file, one store, one placement. The plan prints one `POST` inside the cap and none of the other decisions for that file. The scan report is `publish: yes`. The seller page shows the video on that product and variation. The later status read is `live` on both sources, or `processing` on both. The performance CSV has `qc: OK` for every metric the store showed. No second post of the same hash.

## Report

Platform, market, placement, product, variation, slot, scan result, status, and any alert. No stream key. Livestream: not developed.
