import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { getPayments } from '../orders/payment-api'
import { readTimeline } from '../orders/history-api'
import { id, pageOf } from './schemas'
import { changeSchema, disputeSchema } from './order-action-model'

const feeds = { 'change-requests': changeSchema, disputes: disputeSchema }
export async function readOrderFeed(kind, order, { page = 0, signal } = {}) {
  z.enum(['timeline', ...Object.keys(feeds)]).parse(kind)
  if (kind === 'timeline') return readTimeline(order, { page, signal })
  id.parse(order.id)
  z.number().int().min(0).parse(page)
  const result = parseApi(
    pageOf(feeds[kind]),
    await apiRequest(`/api/customer/orders/${order.id}/${kind}?page=${page}&size=20`, { signal }),
  )
  if (
    result.page !== page ||
    new Set(result.data.map((row) => row.id)).size !== result.data.length ||
    (kind !== 'timeline' &&
      result.data.some(
        (row) =>
          row.orderId !== order.id ||
          row.orderVersion !== order.version ||
          row.orderStatus !== order.status,
      ))
  )
    throw new ApiError('Lịch sử chưa đồng bộ với đơn. Hãy tải lại.', { status: 409 })
  return result
}
export async function readPayments(order, { signal } = {}) {
  return getPayments(order, { signal, role: 'CUSTOMER' })
}
