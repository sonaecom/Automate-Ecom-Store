# Lazada shop homepage

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Template to refine. Same gates as `{baseDir}/modules/shopee/shop-decoration.md` and `{baseDir}/modules/homepage/method.md`. Every Lazada size in `{baseDir}/modules/homepage/sizes.md` is marked verify-in-app. The crop tool after you click the header is the spec.

## When to use

The person wants the Lazada store homepage rebuilt in Store Builder. Not a product upload.

## Prerequisites

Account safety and the session runner. Research browser is not this seller login. Saved store `platform` is `lazada`.

## Menu

Seller Center, Store, Store Decoration or Store Builder, then Edit. If the label differs, stop and ask. Do not open sponsored ads.

## What changes here

- Prepare two headers, not one scaled image: PC and mobile. Draft files: `lazada-header-pc.jpg` (1200 × 128) and `lazada-header-mobile.jpg` (750 × 180). Logo draft: `lazada-logo.jpg` at 600 × 600. Re-export with `--size` if the crop box differs.
- Banner modules (single, carousel, multi-click, several tiles) each show their own size. Read it. The third-party figures in `sizes.md` are only a starting point.
- Keep module files small. Guides often say 1 MB. The upload error is the real limit.
- PC and mobile must both be previewed. A wide PC banner with tiny type will fail on the phone.
- Link banners to products or categories that are enabled. Remove ended promotions before publish.

```bash
python3 {baseDir}/templates/homepage_assets.py --style <STYLE_JSON> --platform lazada --out <OUTPUT_DIR>
```

## Steps

Do the seven steps in the Shopee shop-decoration module. Substitute the Lazada editor and the two header files. Do not skip the audit or the live check from the other browser.

## QC

Same checklist, on both PC and mobile. `QC: N/N checks passed` only when both views pass on the preview and on the live page.

## Stop conditions

The Shopee list, plus: only one header was prepared; the crop tool rejected the pixel size and you uploaded it anyway.

## Report

The shared report, plus the PC size, the mobile size, and the logo size the crop tool accepted.
