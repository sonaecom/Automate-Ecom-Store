# Disputes and claims

Prepare returns, lost parcels, and complaints. You may collect evidence. You may not submit an appeal, accept a refund, or close a case until the owner says yes for that case.

Policy gate action is `read` while you prepare. The moment you would press submit, the action is `submit` and the gate must be `ALLOW`. If it is pending, stop. Even with `ALLOW`, wait for the owner's yes.

## When to use

A return, a parcel the buyer says did not arrive, or a complaint with a deadline on the seller page.

## Steps

1. Read the case list once. For each open case copy the case label, type, status, and the deadline printed on the page. Do not invent a deadline. If the page has no date, write `deadline: not shown` and ask.
2. Sort by the nearest deadline. Tell the owner any deadline inside 2 days.
3. Evidence lives in Drive under `Automate-Ecom-Store/images/` or a packing photo the person already saved. Name the file. Do not fabricate a photo or a tracking event. A packing video is useful only if it exists.
4. Draft the reply in the platform case form. Do not send it. The draft states facts from the order export: ship date, carrier status as printed, and the items. No refund promise. No off-platform payment.
5. Show the draft and the deadline to the owner. Submit only after they say yes for that case, and only if dry-run is off.
6. After submit, read the case page again and screenshot it.

Write rows to `DisputeFacts` with `push-sheets.mjs --tab DisputeFacts`. The owner tab `Disputes` is:

```text
=QUERY(DisputeFacts!A1:H, "select * where A is not null", 1)
```

Columns: `case_label, store, platform, market, type, status, deadline, read_time`.

## Platform notes

Shopee: Returns / Refunds. TikTok Shop: Returns or Disputes. Lazada: Returns or Claims. Use the menu you see. Lost-parcel evidence is the tracking status on the order, not a guess.

## QC

The deadline on your note matches the page. The draft was not sent early. The screenshot after a real submit matches the case you prepared.

## Stop

No owner yes. Dry run. Missing evidence you would have to invent. A button would refund immediately.

## Report

Open cases, deadlines, what was only drafted, what was submitted, screenshot paths.
