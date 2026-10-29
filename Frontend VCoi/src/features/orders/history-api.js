import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { roleConfig } from '../auth/roles'
import { orderSchema, orderStatuses } from './model'
import { quoteSchema } from './quotation-model'
import { weighingId, weighingResultSchema } from './weighing-model'
import { paymentSchema } from './payment-model'

const roleSchema = z.enum(['CUSTOMER', 'COLLECTOR', 'ADMIN'])
const eventSchema = z.object({
  id: weighingId,
  oldStatus: z.enum(Object.keys(orderStatuses)).nullable(),
  newStatus: z.enum(Object.keys(orderStatuses)),
  changedBy: weighingId,
  changedByName: z.string(),
  oldCollectorId: weighingId.nullable(),
  newCollectorId: weighingId.nullable(),
  reason: z.string().nullable(),
  changedAt: z.iso.datetime({ offset: true }),
})
const timelineSchema = z.object({
  data: z.array(eventSchema).max(20),
  page: z.number().int().min(0),
  totalElements: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  totalPages: z.number().int().min(0),
})
export async function readTimeline(order, { role = 'CUSTOMER', page = 0, signal } = {}) {
  weighingId.parse(order.id)
  roleSchema.parse(role)
  z.number().int().min(0).max(2147483647).parse(page)
  const result = parseApi(
    timelineSchema,
    await apiRequest(
      roleConfig[role].ordersApi + '/' + order.id + '/timeline?page=' + page + '&size=20',
      { signal },
    ),
  )
  if (
    result.page !== page ||
    result.totalPages !== Math.ceil(result.totalElements / 20) ||
    new Set(result.data.map((row) => row.id)).size !== result.data.length
  )
    throw new ApiError('Lịch sử chưa đồng bộ với đơn. Hãy tải lại.', { status: 409 })
  return result
}
const receiptSchema = z.object({
  order: orderSchema,
  quote: quoteSchema,
  payment: paymentSchema,
  weighings: weighingResultSchema.shape.records,
})
export async function readReceipt(orderId, { role = 'CUSTOMER', signal } = {}) {
  const id = weighingId.parse(Number(orderId))
  roleSchema.parse(role)
  const result = parseApi(
    receiptSchema,
    await apiRequest(roleConfig[role].ordersApi + '/' + id + '/receipt', { signal }),
  )
  const { order, quote, payment, weighings } = result
  if (
    order.id !== id ||
    quote.orderId !== id ||
    payment.orderId !== id ||
    payment.quoteId !== quote.id ||
    payment.status !== 'COMPLETED' ||
    quote.status !== 'ACCEPTED' ||
    payment.amount !== quote.totalAmount ||
    !payment.paidAt ||
    quote.orderVersion !== order.version ||
    payment.orderVersion !== order.version ||
    quote.orderStatus !== order.status ||
    payment.orderStatus !== order.status ||
    quote.items.length !== weighings.length ||
    new Set(weighings.map((row) => row.id)).size !== weighings.length ||
    quote.items.some(
      (item) =>
        !order.items.some(
          (row) => row.itemId === item.itemId && row.materialId === item.materialId,
        ) ||
        !weighings.some(
          (row) =>
            row.id === item.weighingId &&
            row.itemId === item.itemId &&
            row.netWeight === item.actualQty,
        ),
    )
  )
    throw new ApiError('Biên nhận chưa khớp giao dịch. Vui lòng tải lại.', { status: 409 })
  return result
}
