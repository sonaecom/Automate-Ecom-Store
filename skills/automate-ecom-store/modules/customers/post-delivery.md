# Post-delivery follow-up

Dry run follows `{baseDir}/modules/ops/dry-run.md`: walk the steps, take the screenshots, write the report, and do not click Save, Submit, or Send.

When an order is Delivered or Completed, send one polite thank-you in that platform's own chat. Ask if something is wrong, and invite an honest review. Do not ask for a star count, do not pay for a rating, and do not chase.

Policy gate for sending is `submit`. Dry run stops before Send.

## When to use

The owner wants one follow-up after delivery. Not for orders still in the warehouse or with the courier.

## Rules that bind the words

Send the note to every delivered order, not only to buyers who already sound pleased. A happy-only ask is a selective review request.

- Shopee forbids fake orders and fake reviews. [Anti-brushing policy](https://seller.shopee.sg/edu/article/11697/anti-brushing-policy). Shopee also tells sellers they may encourage reviews with Chat Broadcast, and that buyers do not have to rate. [Customer satisfaction](https://seller.shopee.sg/edu/article/6820). Coins for review quality, if used, go through Review Prize, and the seller does not choose which reviews win. [Review Prize](https://seller.shopee.sg/edu/article/13356/review-prize).
- TikTok Shop forbids rewards in buyer messages for a review, forbids asking only satisfied buyers, and forbids pressure to change or remove a review. A reward is allowed only inside the official incentivized-review tool, and a review of any star still qualifies when the tool's own length and photo rules are met. [Review policy](https://seller-us.tiktok.com/university/essay?knowledge_id=4451321470682882&lang=en). The same ban on using chat to buy a positive review is in the [Singapore customer service guidelines](https://seller-sg.tiktok.com/university/essay?knowledge_id=7654182014502658&lang=en). Do not steer a bad review into chat instead of the public review. [UK customer review policy](https://seller-uk.tiktok.com/university/essay?knowledge_id=7753849800722177).
- Lazada: do not mislead the origin of a review or pretend to be the buyer. [Lazada terms, submissions](https://www.lazada.com.ph/terms-conditions/). If Seller Center in that market shows an official review-reward control, the owner may use that control for any review. If it is not on screen, do not invent a voucher. The on-screen policy for that market wins when it is stricter.

The chat text must not say "5 stars", "five stars", or the same ask in Vietnamese, Indonesian, Malay, or Thai. It must not say the review is only for a happy buyer. It must not offer a coin, voucher, or refund in exchange for a rating.

## Steps

1. Read the template for the buyer's language from `{baseDir}/templates/messages/library.json` key `post_delivery`. If the language is not one of EN, VI, ID, MS, or TH, ask. Do not translate a forbidden phrase in.
2. Check the text, then the order:

```bash
node {baseDir}/scripts/follow-up.mjs --library
node {baseDir}/scripts/follow-up.mjs --orders <DELIVERED_CSV> --sent ~/.automate-ecom-store/data/follow-up.csv --opt-out ~/.automate-ecom-store/data/follow-up-opt-out.csv --order <ORDER_ID>
```

`SEND` means the status is `delivered` or `completed`, this order is not in the sent file, and it is not opted out. `ready_to_ship` and in-transit orders are `not_delivered`.
3. Before Send, add one `chat_replies` in the caps counter. On `CAP`, stop for the day. Wait with the pacer between orders. One tab.
4. Send once in the platform chat for that order. Append `order_id,sent_date,store,platform` to the sent file. Do not store the buyer's address or phone.
5. If the buyer replies with a problem, stop. Add the order to the opt-out file with reason `issue` and hand the thread to a person. Do not send a second note. Do not ask them to change a review.
6. A buyer who asks not to be contacted is `opt_out`. Do not message that order again.
7. Optional: a Review Prize or the TikTok incentivized-review tool is `{baseDir}/modules/growth/reviews-trust.md`. Set that up in its own step. Do not paste the reward into this chat.

## QC

The sent bubble matches the template aside from `<ORDER_ID>`. The script said `SEND` before the click. The sent file has one row for that order. A later run says `already_sent`.

## Stop

The script is not `SEND`. The text check is `FORBIDDEN`. Dry run is on. The daily chat cap is spent. The buyer already reported an issue.

## Report

How many orders were `SEND`, `already_sent`, `not_delivered`, `opt_out`, or `issue`. The language used. No buyer personal data.
