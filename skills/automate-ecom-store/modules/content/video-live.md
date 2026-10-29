# Video and livestream

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Classification: **write**. Publish only when the pre-publish scan prints `result: PASS`. `BLOCK` and `REVIEW` both mean do not post. Alert the owner and quote the reason. A missing local tool is uncertainty, so it is `REVIEW`, not a pass.

The scan reads `policies/rules.yaml` for this platform and market. It does not keep a second rule list and it does not upload the file. External upload stays off unless the owner later enables a separate tool. This script refuses `--enable-upload yes`.

Config is a private JSON copied from `{baseDir}/templates/sample-video-pass.json`. The sample is synthetic. Set the listing price, the owner competitor list (`competitors_confirmed: yes`), music rights (`licensed` or `owned`), and the format, length, resolution, aspect, and size limits. Those limits are the owner's ceilings for this shop, not a quota.

## When to use

The owner wants a listing video or a live session for a product that is already allowed to sell. Not for an ad budget change. That stays in the ads modules.

## Steps

1. Scan before any upload. Continue only on `PASS`.

```bash
node {baseDir}/scripts/video-scan.mjs --spec ~/.automate-ecom-store/data/video-spec.json --platform <PLATFORM> --market <MARKET> --video <VIDEO_FILE> --out ~/.automate-ecom-store/data/video/scan-report.json
```

The spec holds the title, caption, hashtags, on-screen text, and a transcript. Local speech-to-text fills `transcript` when it is installed. If it is not, leave `transcript_available` unset so the scan stays `REVIEW`. ffprobe fills format, length, resolution, aspect, file size, and audio. A still or blank video is `BLOCK`. An unchecked watermark, a missing audio stream, or unconfirmed music rights is `REVIEW`. Cover and keyframe checks (nudity, sexual content, violence, weapons, minors, other-platform logos, QR codes, contact text, before/after medical imagery) need a local OCR or classifier. Unknown visual fields stay `REVIEW`. Then run `policy-gate.mjs --action publish --text` on the same title and spoken lines. A block means do not upload.
2. Use the video or live entry the seller centre shows for this platform. If the label is not on screen, stop and screenshot. Do not hunt through ads or wallet menus.
3. Attach only the variation named in the spec. Match the variation's own name, not the parent title.
4. QC #1 before publish: screenshot `screenshots/qc1-video.png`. Title, product, and cover match the spec. QC #2 after the video or the scheduled live is visible: screenshot `screenshots/qc2-video.png`.
5. A live that is already on air is not restarted from this file. End it only if the owner says the content must stop.
6. Human pace, one tab. `--add` one `listing_edits` when the video is a listing asset. On `CAP`, stop.

## QC

The scan report is `PASS`, then the gate was `ALLOW`, then both screenshots match the spec. A passing real run posts one video or schedules one live, and the report file shows `publish: yes` with an empty reason list. Any `BLOCK` or `REVIEW` line is the alert. Do not post.

## Stop

The script fails the gate. The product is not eligible. You would copy a competitor's video.

## Report

Platform, market, video or live, variation label, whether it was published. No stream key in the report.
