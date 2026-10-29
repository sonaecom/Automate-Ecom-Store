# Shopee shop homepage

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Redesign the public shop homepage in Shopee Shop Decoration. Read `{baseDir}/modules/homepage/method.md` and `{baseDir}/modules/homepage/sizes.md` before you draw or upload.

## When to use

The person wants the Shopee shop homepage rebuilt: banners, categories, best sellers, combos, vouchers, new arrivals, and the brand story. Not a product-listing edit. That stays on `product-listing.md` or `listing-update.md`.

## Prerequisites

1. Account safety is in force. One seller tab once you enter Seller Centre. Research stays on another browser.
2. Session runner pace. Do not count banner uploads as `listing_edits`.
3. The saved store `platform` is `shopee`.

## Menu

Seller Centre, then Shop Decoration (the editor may also say Shop). If the label differs, stop and ask. Do not open ads or wallet.

The SG education page describes Preview, then Save as draft, or Display now. Use Display now only after QC #1. If both Mobile and PC previews exist, check both.

## Steps

1. **Audit** the current Shopee homepage and a few competitor shops. Follow method section 1. Not the store profile.
2. **Style** from the logo and packaging. Private copy of `modules/homepage/style.example.yaml`. Empty color fields mean the asset script samples the logo.
3. **Plan** the blocks in method section 3. For Shopee, the usual order is shop cover, carousel, category or banner row, best sellers, combos, vouchers, new arrivals, trust text, optional video. Skip a block the editor does not list.
4. **Read the carousel ratio in the panel before export.** Then run:

```bash
python3 {baseDir}/templates/homepage_assets.py --style <STYLE_JSON> --platform shopee --out <OUTPUT_DIR>
```

`<STYLE_JSON>` uses the keys in `modules/homepage/style.example.json`. If the panel ratio is not one of the draft files, re-run with `--size <W>x<H>` from the panel. Do not upload a 16:9 file into a 1:1 slot.

5. **Build** top to bottom. Link each banner to the product or category in the plan. Shopee's own note: a deleted product or a disabled category must not stay in a component. Vouchers must be live.
6. **Preview.** Screenshot desktop and mobile. QC in method section 6. Publish only after every line passes.
7. **Live QC** from the other browser. Screenshot. Report.

Take the 3–8 second pause between uploads. After a carousel of several images, take the longer pause.

## QC

Cover, carousel, links, mobile crop, prices, and vouchers. `QC: N/N checks passed` only when preview and live both pass.

## Stop conditions

- The audit or the live check would use the seller profile as the public browser.
- The panel size does not match the file and you have not re-exported.
- A banner mentions a price or a voucher that is not live today.
- Text is cut off on the mobile preview.
- Account safety says stop.

## Report

Use the report block in `method.md`. Name the carousel ratio you selected in the panel.
