import { z } from 'zod'
import { orderStatuses } from './model'
import { weighingId } from './weighing-model'

export const paymentMethods = {
  CASH_SIMULATED: 'Tiền mặt mô phỏng',
  TRANSFER_SIMULATED: 'Chuyển khoản mô phỏng',
}
const instant = z.iso.datetime({ offset: true })
export const paymentSchema = z
  .object({
    id: weighingId,
    orderId: weighingId,
    quoteId: weighingId,
    amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    currency: z.literal('VND'),
    method: z.enum(Object.keys(paymentMethods)),
    status: z.enum(['PENDING', 'COMPLETED', 'FAILED']),
    requestKey: z.uuid(),
    paidAt: instant.nullable(),
    referenceCode: z.string().nullable(),
    recordedBy: weighingId,
    createdAt: instant,
    orderStatus: z.enum(Object.keys(orderStatuses)),
    orderVersion: z.number().int().min(0).max(2147483647),
    completedAt: instant.nullable(),
  })
  .refine((row) => row.status !== 'COMPLETED' || (row.paidAt !== null && row.completedAt !== null))

export function canRecordPayment({ order, quote, payments, user }) {
  return Boolean(
    user?.role === 'COLLECTOR' &&
    user.status === 'ACTIVE' &&
    order.collectorId === user.id &&
    order.status === 'AWAITING_PAYMENT' &&
    order.version < 2147483647 &&
    quote?.current &&
    quote.status === 'ACCEPTED' &&
    quote.orderId === order.id &&
    quote.orderStatus === order.status &&
    quote.orderVersion === order.version &&
    quote.respondedBy &&
    quote.respondedAt &&
    Number.isSafeInteger(quote.totalAmount) &&
    quote.totalAmount > 0 &&
    Array.isArray(payments) &&
    !payments.some((row) => row.status === 'COMPLETED'),
  )
}
