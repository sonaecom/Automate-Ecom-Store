# Lazada product listing

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Template to refine. Same gates as `{baseDir}/modules/shopee/product-listing.md` and `{baseDir}/modules/listing/method.md`. Use only the limits and menu hints in this file. If a label does not match, stop and ask.

## When to use

A new Lazada product, or a full gallery and content rebuild. Small edits of an existing listing stay on `listing-update.md`.

## Prerequisites

Account safety and the session runner are already in force. The saved store `platform` is `lazada`. Research uses a browser that is not this seller login. Listing cap is `listing_edits`.

## What changes for Lazada

- Menu hint: Products, then add a product, or the official import template. Confirm the words on screen.
- Title: the form counter wins. Draft under 255 characters. `<BRAND>` and `<MAIN_KEYWORD>` first, then size and variation names, then one benefit.
- Images: square. Meet the minimum the uploader shows that day, and aim for 1024×1024 when the form allows it. The image count is whatever the form allows. Do not assume nine slots. Optional video only when the spec includes one.
- Category, brand, and the specification block still have to be filled. Brand missing from the list: stop and ask.
- Combos: use Lazada's bundle or flexi-combo tool when that label is on screen. If it is not, make a separate listing and the combo thumbnail (`x2` or `Combo 3`). Do not open wallet or sponsored-ads pages to find it.
- Upload, QC #1, publish, QC #2, and the buyer page from another browser are unchanged. Log with `source` `lazada-product-listing`.

## Steps

Do sections 1 through 7 of the Shopee product-listing module in order, with the limits above. Do not skip research, the title checklist, image QC, or live QC.

## QC

`QC: N/N checks passed` only when every line in `method.md` passed, including the buyer page from the non-store browser.

## Stop conditions

The Shopee stop list, plus: you guessed an image count the form does not have; the title still exceeds the Lazada counter.

## Report

The `method.md` report, plus the Lazada character count and how many image slots the form showed.
