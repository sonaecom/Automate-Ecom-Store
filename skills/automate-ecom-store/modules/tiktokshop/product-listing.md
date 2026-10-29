# TikTok Shop product listing

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Template to refine. Same gates as `{baseDir}/modules/shopee/product-listing.md` and `{baseDir}/modules/listing/method.md`. Use only the limits and menu hints in this file. Do not type a Shopee-only label if this form does not show it. If a label does not match, stop and ask.

## When to use

A new TikTok Shop product, or a full gallery and content rebuild. Small edits of an existing listing stay on `listing-update.md`.

## Prerequisites

Account safety and the session runner are already in force. The saved store `platform` is `tiktokshop`. Research uses a browser that is not this seller login. Listing cap is `listing_edits`.

## What changes for TikTok Shop

- Menu hint: Products, then add a product, or the official bulk template. Confirm the words on screen.
- Title: the form counter wins. Draft under 255 characters. Put `<MAIN_KEYWORD>` in the opening words. No hashtags in the title. Hashtags only in the field TikTok shows for them.
- Images: 1:1. Meet the minimum the uploader shows that day, and aim for 1200×1200 when it allows that size. Use `{baseDir}/templates/listing_images.py` with `--min-edge` set to that minimum if it is above 1024, or keep 1024 when the form accepts it. Image count is the form's count. Optional video; check the cover frame.
- Category, brand, and attributes still have to be filled. Brand missing from the list: stop and ask. Do not pick another brand.
- Combos: use TikTok's bundle tool when it is on screen. If you cannot find it, use a separate listing and the combo thumbnail. Do not wander the ads or wallet menus.
- Upload, QC #1, publish, QC #2, and the buyer page from another browser are unchanged. Log with `source` `tiktokshop-product-listing`.

## Steps

Do sections 1 through 7 of the Shopee product-listing module in order, with the limits above. Do not skip research, the title checklist, image QC, or live QC.

## QC

`QC: N/N checks passed` only when every line in `method.md` passed, including the buyer page from the non-store browser.

## Stop conditions

The Shopee stop list, plus: the TikTok form counter is lower than the draft and you have not shortened the title; the image minimum on the form is larger than the files you have.

## Report

The `method.md` report, plus the TikTok character count and image minimum you read off the form.
