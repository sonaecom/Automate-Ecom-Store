# Order status map

The owner's definitions win over a status word.

- An order is **shipped out** only when the export has a courier pickup time or a first transit time. That cell is the shipped signal. BigSeller All Orders uses that same column. Empty means the parcel is still in the warehouse.
- `ready_to_ship`, `packed`, and `to_ship` are not shipped out.
- A cancel with no pickup time is a **pre-shipment cancel**. It is in the cancellation rate. It is not in the return rate.
- A status that says returned, failed delivery, or cancelled in transit, but has no pickup time, is **not** a return. The order-level QC says `excluded_not_shipped`.

Confirm the words on the export. If the file uses a different header, record that header in `source`. Do not guess a pickup time.

## Shopee

| Export status | Pickup time | Counts as |
| --- | --- | --- |
| Cancelled, Unpaid cancel, To-ship cancel | empty | Cancellation. Party is buyer, seller, or system as the reason column says. |
| To ship, Processed, Packed | empty | Open order. In the created-order total only. |
| Shipped, In transit, Delivered, Completed | present | Shipped out. Delivered and completed are not returns. |
| Returning, Returned, Delivery failed, Cancelled in transit | present | Return / RTS. If the row is also marked cancelled, it stays in the cancellation rate as well. |
| Returning or Returned | empty | Not a return. QC `excluded_not_shipped`. |

## TikTok Shop

| Export status | Pickup time | Counts as |
| --- | --- | --- |
| Cancelled | empty | Cancellation. |
| Awaiting shipment, Awaiting collection | empty | Not shipped out. Collection is not pickup until the collection time is filled. |
| In transit, Delivered, Completed | present | Shipped out. |
| Returned, Failed delivery, Cancelled in transit | present | Return / RTS. |
| Returned | empty | Not a return. QC `excluded_not_shipped`. |

## Lazada

| Export status | Pickup time | Counts as |
| --- | --- | --- |
| canceled | empty | Cancellation. |
| pending, packed, ready_to_ship | empty | Not shipped out. `ready_to_ship` is still in the warehouse. |
| shipped, delivered | present | Shipped out. |
| returned, failed, lost, canceled after ship | present | Return / RTS. |
| returned or failed | empty | Not a return. QC `excluded_not_shipped`. |

## BigSeller All Orders

Use the official All Orders export when the person already uses it. The shipped signal is the courier pickup or first transit time column. If that column is empty, the order is not shipped out, whatever the status word says. Log out of BigSeller when the export is saved. Do not store a BigSeller password in the repo.
