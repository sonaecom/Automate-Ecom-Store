# Listing method

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Shared rules for a new product listing. The platform file (`modules/shopee/product-listing.md` and the TikTok Shop and Lazada adaptations) names the menus and the limits. This file is the method. Account safety still wins on pace, caps, captcha, and one seller tab.

Paths named `data/` are under `~/.automate-ecom-store/data/`.

## Spec before anything is uploaded

Write one private spec from `modules/listing/spec.example.yaml`. A listing is not ready to type until the spec has:

- title draft
- variations: buyer-facing name, seller SKU, price, stock, variation image
- gallery files in order
- weight, dimensions, origin phrase, category, brand
- which promotions apply, if any
- which claims are allowed (empty means none)

SKU shape, one listing per pack size:

- Parent: `<PARENT_SKU>` for that size only
- Child: `<CHILD_SKU>` for that variation and that size

Do not reuse a parent SKU from a different size. Buyer-facing variation names are the real option names (a size or a flavour). The product title is not a variation name.

## Title checklist

Structure, in this order, main keyword early:

`<BRAND> <MAIN_KEYWORD> <SIZE_LABEL> <VARIATION_A> / <VARIATION_B> | <BENEFIT> | <ORIGIN_PHRASE>`

Example shape only:

`<BRAND> <MAIN_KEYWORD> <SIZE_LABEL> <VARIATION_A> / <VARIATION_B> | <BENEFIT> | <ORIGIN_PHRASE>`

Pass every line before the title is typed:

- Brand appears once.
- The main keyword is in the opening words, taken from search suggestions and competitor titles, not invented.
- Type, flavour, size, and pack count are included only when they are true for this listing.
- One benefit. No second sentence of filler.
- Within the platform counter. The counter on the form wins over any draft ceiling.
- The same word is not repeated to fill space.
- No banned or warned word. If the form flags a word, remove it.
- No medical or "guaranteed" claim, no competitor brand, no old size or old flavour left from another listing.
- The title matches the spec character for character after you type it.

## Description, attributes, category

- Write the description in normal sentences. Use the researched keywords once each, where they fit. Do not stack hashtags inside the title.
- Put hashtags only in a field the platform actually has for them.
- Fill every attribute the form shows. Filters are how buyers search. Leave an unknown attribute empty rather than guessing.
- Category is the spec category. If the form's suggestion is a different category, stop and ask.
- Brand is the spec brand. If that brand is not in the platform list, stop. Do not pick a different brand. Do not send a "add my brand" request unless a person says yes in this chat.
- Weight and dimensions are for this size only. After save, read them back. A leftover weight from another size is a failure.
- Diet or health ticks (sugar-free, and anything similar) stay off unless that exact claim is in `claims_allowed`. If the form later shows recommended ticks you did not enter, do not press update again until those ticks are cleared. Report them as open.
- Storage, origin, and pack type come from the spec. Do not add a payment method (such as cash on delivery) unless the spec says that method is already enabled on this store.

## Image rules

Look at every approved file yourself before upload. Any old pack, old brand, or old size in a file means stop and get a correct file. A size that was painted onto a photo is not approved. Use a real photo of that pack.

Square, at least the platform minimum, aim for 1024×1024 or larger when the uploader allows it. The uploader's file-size limit wins. Cover first. Up to the platform's image count. Optional video only if the spec includes one, and the cover frame must be checked, not only the thumbnail.

Gallery order:

1. Cover: pack, size badge, brand, main keyword.
2. Variation chooser: each buyer-facing name.
3. One detail frame per variation when you have the photo.
4. Benefits: short lines from `claims_allowed` and the spec benefit only.
5. Size: the net weight for this listing.
6. Usage: moments from the spec, no extra promise.
7. How to store.
8. Trust: only facts that are true (origin, what the store already offers).

Each variation gets its own image. A combo image is a composite of the items in the combo plus a badge such as `x2` or `Combo 3`, and nothing else.

Build files with `{baseDir}/templates/listing_images.py` (Pillow) or with an image tool the person names. Then run the script's file check (square, minimum edge, file size). Compare a live image to the approved file by eye. If you can, also run `--compare` and record the dHash distance. The spec names the maximum distance. A live image that matches no approved file is a failure, and an approved file that is not live is a failure.

Image QC, every file, pass or fail:

- Square and large enough, under the uploader's byte limit.
- Text is readable.
- No old packaging, old brand, or painted-on size.
- No watermark, phone number, chat id, or other contact line.
- No claim that is not in `claims_allowed`.
- Price is not printed on the image unless the spec asked for that price, and then the printed price matches the spec.

## Live QC

A listing is not done on the edit form alone.

1. Re-read the saved seller form.
2. Open the public product page in a **different** browser that is not logged into this seller account. Never open the public page from the store profile.
3. Screenshot the gallery. Open every image, including a video cover.
4. Open the variation picker and select every option. Each variation image must match its approved file.
5. Buyer-visible price after discount equals the spec. A strikethrough or badge that is not in the spec is a failure.
6. Title, description, weight, origin, and attributes contain no old name, flavour, size, or claim.
7. Search the seller's own product list for the old name, from the seller profile, one search. No other listing shows the old pack unless the spec says to keep it.
8. Stock on the form and stock on the product list must match. If they disagree just after save, do not call stock passed. Re-read the list in a later session before you do.

Save screenshots and a pass/fail line per check under `data/listing-qc/<DATE>/`. The report line is `QC: N/N checks passed` only when every line passed. Any fail or skip stays open. Do not say done.

## Combos

Either a separate listing whose variations are the bundle, or the platform's own bundle or add-on tool. The thumbnail is the composite with the badge. The title uses the same checklist and names the real contents. Do not describe a larger pack as a smaller one.

## Report

- Platform and listing label from the spec
- Title and character count from the form
- Parent SKU and each variation name, child SKU, price, stock
- Image count and variation-image result
- `QC: N/N checks passed`, or the open lines
- Captcha count, page count, session start and end
- Research sheet path and spec path (local only)

Do not put those files in git. Do not include the API key, profile id, or a pasted item id in a committed note. The chat report may repeat the item id the person needs to find the listing.
