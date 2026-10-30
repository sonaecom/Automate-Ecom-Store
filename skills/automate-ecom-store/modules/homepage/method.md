# Shop homepage method

Policy preflight: read `{baseDir}/policies/LAYER.md` and run `policy-gate.mjs` for this platform and market before any action in this file.

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

Shared steps for Shopee Shop Decoration, TikTok Shop's shop page, and Lazada Store Builder. The platform file names the menu. Sizes are in `sizes.md`. The editor's crop tool wins over the table.

Account safety still wins: one seller tab, human pace, no headless, no internal endpoints, no captcha solver. This task does not spend the listing-edit cap unless you also change a product. Each upload is still an action: `delay-range.mjs --kind click`, and take the batch rest every 10–15 actions.

## 1. Audit

Use a browser that is **not** the store's seller profile. Read only.

- Open the shop's current public homepage. Screenshot the top, each banner, and the mobile view if you can resize the window. Note broken links, old prices, ended vouchers, and pictures that do not match the current pack.
- Open a few top competitor shops in the same category, from search or a best-seller list. Note hero style, category row, how they show bundles, and how much text is on a banner. Do not copy their pictures or their brand name.
- Save notes under `~/.automate-ecom-store/data/homepage/audit.md`. Do not commit them.

**Done when:** you have a shot of the current homepage and a short note on what is outdated.

## 2. Brand style

Read the logo and the current packaging. Do not invent a second brand.

- Colors come from the logo or the pack. The asset script can sample the logo. You may type hex values into the private style file when sampling is wrong.
- Fonts match `{baseDir}/templates/listing_images.py`. One family for listing images and homepage assets.
- Tone is the private `tone` line: short, no new claim, no medical promise.
- Write the private copy of `style.example.yaml`. If a value still has angle-bracket placeholders, do not publish.

**Done when:** the style file names the brand, three colors or a logo path, and the hero line.

## 3. Layout plan

Plan these blocks, and skip a block the platform editor does not offer. Do not add a block that repeats an ended promotion.

| Block | What it links to |
| --- | --- |
| Hero or carousel | One collection, category, or the new-arrival set in the plan |
| Category banners | Real categories that are enabled |
| Best sellers | Products that are live and in stock |
| Combos and bundles | The combo listings or the platform's bundle tool, already checked |
| Vouchers | Only vouchers that are live today |
| New arrivals | Listings whose images passed listing QC |
| Trust and brand story | Origin, storage, or a fact in the style file. No new claim. |
| Video | Only a file in the plan. Check the cover frame. |

Write the plan as a list: block, asset file, link target (product label or category label). No profile id.

**Done when:** every banner in the plan has a link target, or the plan says the banner is not clickable.

## 4. Assets

Generate files with `{baseDir}/templates/homepage_assets.py`, or with an image tool the person names, using the same colors and type as the listing set.

- Pick the platform key: `shopee`, `tiktokshop`, or `lazada`.
- Open the decoration editor far enough to read the ratio, then export that size. If you have not opened the editor yet, use the draft size in `sizes.md` and re-export after you see the panel.
- Do not print a price, a discount, or a date on a banner unless the plan quotes a live offer and the QC will check that offer.
- Keep words away from the edges. Mobile crops the sides of wide banners.
- Run the script's size check. A file that is not the chosen pixel size fails.

**Done when:** each planned block has a file that passed the size check, and you have looked at the contact sheet.

## 5. Build, preview, publish

Switch to the store profile. One tab. Open the decoration editor named in the platform file.

- Place blocks from top to bottom in the plan order.
- Attach each link by choosing the product or category in the editor. Do not paste an internal address.
- Wait for each upload to finish.
- Preview desktop and mobile, or the editor's mobile preview if that is all it has. Do not publish from the preview.
- QC before publish (below). Only then use the control that displays the page to buyers. Save a draft if the QC is not finished.

## 6. QC before publish

Screenshot `screenshots/qc1-homepage-preview.png` (add `-mobile` if you have a second view).

- Every link opens the product or category named in the plan. A deleted product or a disabled category fails.
- Mobile preview: words are readable and not cut off.
- No ended voucher, no old pack, no price that is not on the live product today.
- Colors and type match the style file and the listing images.
- Logo and cover are the new files, not a previous campaign.

If any line fails, fix the asset or the link and preview again. Do not publish.

## 7. QC live

After publish, open the public shop homepage in the **other** browser, not the seller profile. Screenshot `screenshots/qc2-homepage-live.png` and the mobile view.

The live page must match the preview: same hero, same links, no extra old banner. If the live page is stale, do not keep refreshing. Check once more after the normal pause. If it is still old, stop and tell the person. Do not say it is done.

## Report

- Platform and which editor you used
- Blocks published, and the link target for each
- Asset pixel sizes you uploaded, and whether the editor agreed with `sizes.md`
- `QC: N/N checks passed`, or the open lines
- Screenshot paths for preview and live, desktop and mobile
- Captcha count and session start and end

Do not commit the screenshots, the style file, or the audit. Do not include the API key or the profile id.
