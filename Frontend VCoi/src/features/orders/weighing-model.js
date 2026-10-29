import { z } from 'zod'

export const weighingId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
export function parseKg(value) {
  if (typeof value !== 'string') return null
  const text = value.trim().replace(',', '.')
  if (!/^\d{1,9}(\.\d{1,3})?$/.test(text)) return null
  const [whole, fraction = ''] = text.split('.')
  return Number(whole) * 1000 + Number(fraction.padEnd(3, '0'))
}
export const toMilliKg = (value) => Math.round(value * 1000)
export function latestWeighings(records) {
  const latest = new Map()
  for (const record of records)
    if (!latest.has(record.itemId) || latest.get(record.itemId).id < record.id)
      latest.set(record.itemId, record)
  return latest
}
const kg = z
  .number()
  .min(0)
  .max(999999999.999)
  .refine((value) => Number(value.toFixed(3)) === value)
const recordSchema = z
  .object({
    id: weighingId,
    itemId: weighingId,
    grossWeight: kg,
    tareWeight: kg,
    netWeight: kg,
    createdBy: weighingId,
    createdAt: z.iso.datetime({ offset: true }),
    correctionOf: weighingId.nullable(),
    correctionReason: z.string().max(500).nullable(),
    photoUrl: z.string().nullable().optional(),
  })
  .refine(
    (row) =>
      row.netWeight > 0 &&
      toMilliKg(row.grossWeight) - toMilliKg(row.tareWeight) === toMilliKg(row.netWeight),
  )
export const weighingResultSchema = z
  .object({
    orderId: weighingId,
    orderVersion: z.number().int().min(0).max(2147483647),
    records: z.array(recordSchema),
  })
  .refine((result) => new Set(result.records.map((row) => row.id)).size === result.records.length)

const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 })
export const actualKg = (value) => (value === null ? 'Chưa nhập' : `${number.format(value)} kg`)
export function netFromInputs(gross, tare) {
  const total = parseKg(gross),
    packing = parseKg(tare)
  return total !== null && packing !== null && total > packing ? (total - packing) / 1000 : null
}
