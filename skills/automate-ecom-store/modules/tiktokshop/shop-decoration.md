# TikTok Shop homepage

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Classification: **write**. Same plan as Shopee shop decoration. Manifest `homepage.decoration`. Sizes are the TikTok rows in `{baseDir}/modules/homepage/sizes.md`. If a component name differs, stop and ask.

```bash
node {baseDir}/scripts/shop-plan.mjs --slots ~/.automate-ecom-store/data/shop-slots.csv --store <STORE_LABEL> --day <YYYY-MM-DD> --mode full --policy ALLOW --journal ~/.automate-ecom-store/data/journal/<STORE_LABEL>.jsonl --approved yes
```

## When to use

The person wants the TikTok Shop shop page redesigned. Not a product upload.

## Prerequisites

Account safety and the session runner. Research browser is not this seller login. Saved store `platform` is `tiktokshop`.

## Menu

Seller Center, Shop page or Shop design. The workbench has components on one side and a canvas. Confirm the words on screen.

## What changes here

- Read the ratio on the component before you export. A single image is 16:9 with width at least 800 px in the seller-university table. Draft file from the script: `tiktokshop-hero-16x9.jpg` at 1600 × 900. If the panel shows another ratio, `--size` that ratio.
- Multi-image tiles are square in that table (800 × 800 recommended). Header background 780 × 720 appears in the US header guide. If your market has no header slot, do not invent one.
- Logo: PNG or WEBP, max 2 MB, on white or transparent, only if the header panel asks for a logo.
- Links go to one product or one category, the way that component's panel allows. Hotspots on a multi-click image: at most the number the panel allows.
- Carousel picture count is the range in the panel (often 2–5). Do not exceed it.
- Preview on the phone-sized canvas. Publish only after QC. Then open the public shop page in the other browser.

```bash
python3 {baseDir}/templates/homepage_assets.py --style <STYLE_JSON> --platform tiktokshop --out <OUTPUT_DIR>
```

## Steps

Do the seven steps in the Shopee shop-decoration module, with the sizes and menu above. Do not skip the audit, the style file, or the live check.

## QC

Same checklist. Add: words sit in the centre so the mobile crop does not cut them.

## Stop conditions

The Shopee list, plus: you used a pixel size that is not in the component panel and not in `sizes.md`.

## Report

The shared report, plus the ratio and the minimum width you read off the TikTok panel.
