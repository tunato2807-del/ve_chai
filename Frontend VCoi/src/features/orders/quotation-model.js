import { z } from 'zod'
import { orderStatuses } from './model'
import { latestWeighings, toMilliKg, weighingId } from './weighing-model'

export function quoteLineTotal(qty, price) {
  if (
    !Number.isFinite(qty) ||
    qty <= 0 ||
    qty > 999999999.999 ||
    Number(qty.toFixed(3)) !== qty ||
    !Number.isSafeInteger(price) ||
    price <= 0
  )
    return null
  const total = (BigInt(toMilliKg(qty)) * BigInt(price) + 500n) / 1000n
  return total > 0n && total <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(total) : null
}
const money = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)
const instant = z.iso.datetime({ offset: true })
const itemSchema = z
  .object({
    id: weighingId,
    itemId: weighingId,
    weighingId,
    materialId: weighingId,
    priceRuleId: weighingId,
    materialName: z.string(),
    grade: z.string().nullable(),
    unit: z.literal('KG'),
    actualQty: z.number().positive(),
    unitPrice: money,
    lineTotal: money,
  })
  .refine((row) => quoteLineTotal(row.actualQty, row.unitPrice) === row.lineTotal)
export const quoteSchema = z
  .object({
    id: weighingId,
    orderId: weighingId,
    orderStatus: z.enum(Object.keys(orderStatuses)),
    orderVersion: z.number().int().min(0).max(2147483647),
    versionNumber: z.number().int().positive(),
    status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'SUPERSEDED']),
    current: z.boolean(),
    totalAmount: money,
    currency: z.literal('VND'),
    validUntil: instant.nullable(),
    createdBy: weighingId,
    createdAt: instant,
    sentAt: instant.nullable(),
    respondedBy: weighingId.nullable(),
    respondedAt: instant.nullable(),
    responseNote: z.string().nullable(),
    version: z.number().int().min(0).max(2147483647),
    items: z.array(itemSchema),
  })
  .refine((quote) => {
    const total = quote.items.reduce((sum, row) => sum + BigInt(row.lineTotal), 0n)
    return (
      total === BigInt(quote.totalAmount) &&
      new Set(quote.items.map((row) => row.itemId)).size === quote.items.length &&
      new Set(quote.items.map((row) => row.id)).size === quote.items.length &&
      (quote.status === 'DRAFT' ||
        (quote.items.length > 0 && quote.totalAmount > 0 && quote.sentAt !== null))
    )
  })
export const quoteExpired = (quote, now = Date.now()) =>
  Boolean(
    quote?.status === 'SENT' && quote.validUntil !== null && Date.parse(quote.validUntil) <= now,
  )
export function canSendQuote(order, quotes, now = Date.now()) {
  const current = quotes.find((quote) => quote.current)
  return (
    order.version < 2147483647 &&
    (order.status === 'ARRIVED'
      ? !current || current.status === 'REJECTED'
      : order.status === 'AWAITING_SELLER_APPROVAL' &&
        current?.current &&
        quoteExpired(current, now))
  )
}
export function buildQuotePreview(order, weights, prices) {
  const latest = latestWeighings(weights.records)
  const rows = order.items.map((item) => {
    const weighing = latest.get(item.itemId),
      price = prices.find((row) => row.materialId === item.materialId)
    const unitPrice = price?.priceStatus === 'AVAILABLE' ? price.unitPrice : null
    const qty = weighing?.netWeight ?? null
    const lineTotal = qty !== null && unitPrice !== null ? quoteLineTotal(qty, unitPrice) : null
    const problem = !weighing
      ? 'Chưa có kết quả cân'
      : unitPrice === null
        ? 'Chưa có giá hiệu lực hoặc ngừng thu mua'
        : lineTotal === null
          ? 'Thành tiền ngoài giới hạn hiển thị'
          : null
    return {
      itemId: item.itemId,
      materialId: item.materialId,
      materialName: item.materialName,
      grade: item.grade,
      weighingId: weighing?.id ?? null,
      qty,
      unitPrice,
      lineTotal,
      problem,
    }
  })
  const sum = rows.reduce((total, row) => total + BigInt(row.lineTotal ?? 0), 0n)
  const ready =
    rows.length > 0 && rows.every((row) => !row.problem) && sum <= BigInt(Number.MAX_SAFE_INTEGER)
  return { rows, ready, total: ready ? Number(sum) : null }
}
