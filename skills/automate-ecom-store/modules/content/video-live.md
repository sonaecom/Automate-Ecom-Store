# Video and livestream

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Publish a product video or a livestream only from the official seller or creator tool on screen. The script and the title go through the policy gate before upload. Do not stream prohibited goods, a competitor brand, or a medical claim.

Policy gate action is `read` while you prepare. Publish or go-live is `publish` and needs `ALLOW`. Dry run stops before that click.

## When to use

The owner wants a listing video or a live session for a product that is already allowed to sell. Not for an ad budget change. That stays in the ads modules.

## Steps

1. Read the private script. Run `policy-gate.mjs --action publish --text` on the title and the spoken lines. A block means do not upload.
2. Use the video or live entry the seller centre shows for this platform. If the label is not on screen, stop and screenshot. Do not hunt through ads or wallet menus.
3. Attach only the variation named in the spec. Match the variation's own name, not the parent title.
4. QC #1 before publish: screenshot `screenshots/qc1-video.png`. Title, product, and cover match the spec. QC #2 after the video or the scheduled live is visible: screenshot `screenshots/qc2-video.png`.
5. A live that is already on air is not restarted from this file. End it only if the owner says the content must stop.
6. Human pace, one tab. `--add` one `listing_edits` when the video is a listing asset. On `CAP`, stop.

## QC

Both screenshots match the spec. The gate was `ALLOW` before publish.

## Stop

The script fails the gate. The product is not eligible. You would copy a competitor's video.

## Report

Platform, market, video or live, variation label, whether it was published. No stream key in the report.
