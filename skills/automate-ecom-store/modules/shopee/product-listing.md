# Shopee product listing

New Shopee listing, or a full rebuild of one (new pack, new size, new gallery). For a small field change on a listing that already matches its spec, use `listing-update.md` instead.

This is the primary listing path. TikTok Shop and Lazada follow the same gates with their own limits.

## When to use

The person wants a product created or fully replaced on Shopee: research, title, content, images, optional combo, upload, and QC. Do not use the store profile to browse competitors.

## Prerequisites

1. `{baseDir}/account-safety.md` is already in force. One seller tab. Listing cap is `listing_edits` (default 10 per session and per day). Each listing you publish counts as one.
2. `{baseDir}/session-runner.md` for pace, caps, and the captcha log.
3. Read `{baseDir}/modules/listing/method.md` before step 1. Templates: `research-sheet.md`, `spec.example.yaml`, `{baseDir}/templates/listing_images.py`.
4. The saved store `platform` is `shopee`. Research uses a different browser that is not logged into Seller Centre.

## Platform limits

The form counter wins whenever it disagrees with this list.

- Title draft ceiling: 120 characters, then shorten to the counter if the counter is lower.
- Images: 1:1, at least 500×500, aim for 1024×1024 or larger. Up to 9 images. JPG or PNG. Stay under the byte limit the uploader shows. Optional video; check the cover frame.
- Category, brand, and the attribute block are required for search filters.
- Menu hint: Seller Centre, Products, Add a new product. For many listings, use Shopee's own mass-upload template instead of opening a form per item. If the label differs, stop and ask.

## Steps

### 1. Competitor research

Read-only. Not the store profile. Human pace: wait several seconds between searches, do not open a pile of tabs, do not call a search API.

Search the same kind of product and open the best-seller list. Record title patterns, keywords, price ranges as printed, variation names, image styles, selling points, and review complaints in `modules/listing/research-sheet.md`.

**Done when:** the sheet has rows you opened, and the store profile was not used.

### 2. SEO title and description

From the sheet plus the platform's own search suggestions (type in the search box on the research browser, read the suggestions, do not scrape). Draft the title with the checklist in `method.md`. Main keyword early. No stuffing, no repeats, no misleading claim.

Description: the same keywords in normal sentences. Hashtags only if Shopee shows a hashtag field. Fill attributes. Set the spec category. Brand must be the spec brand or you stop.

**Done when:** the title checklist passes on paper and the spec file has no placeholders.

### 3. Content

Fill the spec: description, attributes, category, brand, weight, dimensions, variations by their real names, parent and child SKUs, price, stock. One listing per pack size. Reject unverified diet claims.

**Done when:** a person could publish from the spec without guessing a field.

### 4. Images

Build the set with `listing_images.py` or the person's image tool. Run the script's size check. Then the image QC list in `method.md`, file by file, including each variation image and any combo image. Stop if any file shows old packaging or a painted-on size.

**Done when:** every file passes, and you have looked at the contact sheet.

### 5. Combos

If the spec has no combos, skip. If it does, make the composite thumbnail and the badge (`x2`, `Combo 3`, or the spec badge). Use a bundle listing or Shopee's bundle / add-on tool, not a title that hides the real contents.

**Done when:** the combo is in the spec with its own image, or the spec says there is no combo.

### 6. Upload

Seller profile, one tab, account-safety pace. Prefer the official bulk template when you are publishing more than a couple of listings. Otherwise one product form, top to bottom: name, category, brand, attributes, images, variations, price, stock, description, weight, shipping facts from the spec.

QC #1 before publish: screenshot `screenshots/qc1-listing-form.png`. Read the form against the spec. Variation names, SKUs, prices, stock, weight, parent SKU, and image order must match. `--add 1` on `listing_edits` before publish. On `CAP`, do not publish.

Publish once. QC #2 on the saved form in this tab: screenshot `screenshots/qc2-listing-saved.png`. Then the live buyer page from the other browser, never from this profile. Follow "Live QC" in `method.md`.

If stock on the form and the product list disagree, leave stock open and re-read next session. If the form shows recommended attribute ticks you did not set, do not press update again until they are cleared.

**Done when:** QC #2 matches, or you stopped with the open lines listed.

### 7. Log

Write the checklist under `data/listing-qc/<DATE>/`. Append a row to `data/listing-edits.csv` only for a listing whose QC line is fully passed: `item_label,field,new_value,edited_date,source` with `field` `publish` and `source` `shopee-product-listing`.

Then account-safety session end. Idle on Seller Centre home.

## QC

Use the title checklist, the image QC list, QC #1, and live QC. Report `QC: N/N checks passed` only when every line passed.

## Stop conditions

- Research would use the store profile.
- Placeholders remain in the spec.
- The brand is missing from Shopee's list, or a claim is not allowed.
- An image fails QC, or a size is only painted on.
- The listing cap is exhausted. Spread the rest over later sessions or use mass upload.
- QC #1 and the saved form disagree.
- Account safety says stop.

## Report

Use the report block in `method.md`. Add the Shopee form's character count and whether the buyer page was opened from the other browser.
