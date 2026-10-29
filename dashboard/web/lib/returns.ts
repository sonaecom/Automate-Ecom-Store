import type { OrderRow } from "@/lib/types"

const RETURN_WORDS = new Set([
  "return_to_sender",
  "returned",
  "returning",
  "failed_delivery",
  "delivery_failed",
  "cancelled_in_transit",
  "canceled_in_transit",
  "lost",
])

export function day(value: string) {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value || "")
  return match ? match[1] : ""
}

function norm(value: string) {
  return value.trim().toLowerCase().replaceAll(" ", "_").replaceAll("-", "_")
}

function shippedOut(row: OrderRow) {
  return Boolean(day(row.courierPickupTime))
}

function isCancelled(row: OrderRow) {
  const status = norm(row.status)
  const party = norm(row.cancelledBy)
  if (party === "buyer" || party === "seller" || party === "system") return true
  return status === "cancelled" || status === "canceled"
}

function isReturn(row: OrderRow) {
  if (!shippedOut(row)) return false
  const status = norm(row.status)
  const outcome = norm(row.outcome)
  return RETURN_WORDS.has(status) || RETURN_WORDS.has(outcome)
}

export type Classified = OrderRow & {
  inCancel: boolean
  cancelled: boolean
  shipped: boolean
  rts: boolean
  excluded: boolean
  party: string
}

export function classify(row: OrderRow, from: string, to: string): Classified {
  const created = day(row.createdDate)
  const pickup = day(row.courierPickupTime)
  const inCancel = Boolean(created) && created >= from && created <= to
  const pickupIn = Boolean(pickup) && pickup >= from && pickup <= to
  const shipped = shippedOut(row)
  const rtsWord = RETURN_WORDS.has(norm(row.status)) || RETURN_WORDS.has(norm(row.outcome))
  return {
    ...row,
    inCancel,
    cancelled: inCancel && isCancelled(row),
    shipped: pickupIn && shipped,
    rts: pickupIn && shipped && isReturn(row),
    excluded: rtsWord && !shipped,
    party: norm(row.cancelledBy),
  }
}

export type RateBucket = {
  key: string
  ordersCreated: number
  cancelled: number
  buyer: number
  seller: number
  system: number
  shippedOut: number
  rts: number
  cancelRate: number | null
  rtsRate: number | null
}

function rate(part: number, whole: number) {
  if (!whole) return null
  return Math.round((part / whole) * 10000) / 10000
}

export function rollup(rows: Classified[], keyFn: (row: Classified) => string): RateBucket[] {
  const groups = new Map<string, RateBucket>()
  for (const row of rows) {
    const key = keyFn(row) || "<BLANK>"
    const bucket = groups.get(key) ?? {
      key,
      ordersCreated: 0,
      cancelled: 0,
      buyer: 0,
      seller: 0,
      system: 0,
      shippedOut: 0,
      rts: 0,
      cancelRate: null,
      rtsRate: null,
    }
    if (row.inCancel) bucket.ordersCreated += 1
    if (row.cancelled) {
      bucket.cancelled += 1
      if (row.party === "buyer" || row.party === "seller" || row.party === "system") bucket[row.party] += 1
    }
    if (row.shipped) bucket.shippedOut += 1
    if (row.rts) bucket.rts += 1
    groups.set(key, bucket)
  }
  return [...groups.values()].map((bucket) => ({
    ...bucket,
    cancelRate: rate(bucket.cancelled, bucket.ordersCreated),
    rtsRate: rate(bucket.rts, bucket.shippedOut),
  }))
}
