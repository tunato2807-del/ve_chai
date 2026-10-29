import { z } from 'zod'
import { orderStatuses } from '../orders/model'
import { id, instant } from '../customer/schemas'
import { periodSchema } from './reports-period'

const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const weight = z
  .number()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER / 1000)
const money = count
const vietnamDateTime = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})
function atVietnamMidnight(value, day) {
  const parts = Object.fromEntries(
    vietnamDateTime.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  )
  return (
    `${parts.year.padStart(4, '0')}-${parts.month}-${parts.day}` === day &&
    parts.hour === '00' &&
    parts.minute === '00' &&
    parts.second === '00' &&
    new Date(value).getUTCMilliseconds() === 0
  )
}
export const reportPeriodResponse = z
  .object({
    from: z.iso.date(),
    to: z.iso.date(),
    timeZone: z.literal('Asia/Ho_Chi_Minh'),
    fromInclusive: instant,
    toExclusive: instant,
  })
  .refine((row) => periodSchema.safeParse({ from: row.from, to: row.to }).success)
  .refine(
    (row) =>
      atVietnamMidnight(row.fromInclusive, row.from) && atVietnamMidnight(row.toExclusive, row.to),
  )
export function roundedCompletion(completed, total) {
  if (!total) return 0
  return Number((BigInt(completed) * 20000n + BigInt(total)) / (2n * BigInt(total))) / 100
}
export const overviewSchema = z
  .object({
    period: reportPeriodResponse,
    currency: z.literal('VND'),
    weightUnit: z.literal('KG'),
    totalOrders: count,
    completedOrders: count,
    completionRatePercent: z.number().min(0).max(100),
    ordersByStatus: z
      .array(z.object({ status: z.enum(Object.keys(orderStatuses)), count }))
      .max(10),
    paidOrders: count,
    totalPaidAmount: money,
    totalWeight: weight,
  })
  .refine(
    (row) =>
      row.completedOrders <= row.totalOrders &&
      row.completionRatePercent === roundedCompletion(row.completedOrders, row.totalOrders),
  )
  .refine(
    (row) =>
      new Set(row.ordersByStatus.map((entry) => entry.status)).size === row.ordersByStatus.length &&
      row.ordersByStatus.reduce((sum, entry) => sum + BigInt(entry.count), 0n) ===
        BigInt(row.totalOrders),
  )
  .refine(
    (row) =>
      (row.ordersByStatus.find((entry) => entry.status === 'COMPLETED')?.count || 0) <=
      row.completedOrders,
  )
  .refine((row) => row.paidOrders > 0 || (row.totalPaidAmount === 0 && row.totalWeight === 0))
export const materialReportSchema = z.object({
  materialId: id,
  materialName: z.string().min(1),
  grade: z.string().nullable(),
  unit: z.literal('KG'),
  currency: z.literal('VND'),
  paidOrders: count,
  totalWeight: weight,
  totalAmount: money,
})
export const collectorReportSchema = z.object({
  collectorId: id,
  collectorName: z.string().min(1),
  currency: z.literal('VND'),
  weightUnit: z.literal('KG'),
  paidOrders: count,
  totalWeight: weight,
  totalAmount: money,
})
export const materialReportKey = (row) =>
  JSON.stringify([row.materialId, row.materialName, row.grade, row.unit])
export const reportNumber = (value) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value)
export const reportPercent = (value) =>
  `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)}%`
