import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { roleConfig } from '../auth/roles'
import { getOrder } from './api'
import { getQuotes } from './quotation-api'
import { quoteSchema } from './quotation-model'
import { weighingId } from './weighing-model'
import { canRecordPayment, paymentMethods, paymentSchema } from './payment-model'
export { canRecordPayment } from './payment-model'

export async function getPayments(order, { signal, role = 'COLLECTOR' } = {}) {
  weighingId.parse(order.id)
  z.enum(['COLLECTOR', 'CUSTOMER', 'ADMIN']).parse(role)
  const rows = parseApi(
    z.array(paymentSchema).max(100),
    await apiRequest(`${roleConfig[role].ordersApi}/${order.id}/payments`, { signal }),
  )
  if (
    rows.some(
      (row) =>
        row.orderId !== order.id ||
        row.orderVersion !== order.version ||
        row.orderStatus !== order.status,
    ) ||
    new Set(rows.map((row) => row.id)).size !== rows.length ||
    rows.filter((row) => row.status === 'COMPLETED').length > 1
  )
    throw new ApiError('Đơn và thanh toán chưa đồng bộ. Hãy tải lại.', { status: 409 })
  return rows
}
export async function getPaymentContext(order, { signal, role = 'COLLECTOR' } = {}) {
  const [quotes, payments] = await Promise.all([
    getQuotes(order, { signal, role }),
    getPayments(order, { signal, role }),
  ])
  if (
    payments.some(
      (row) =>
        row.status === 'COMPLETED' &&
        !quotes.some(
          (quote) =>
            quote.id === row.quoteId &&
            quote.status === 'ACCEPTED' &&
            quote.totalAmount === row.amount,
        ),
    )
  )
    throw new ApiError('Khoản chi chưa khớp báo giá đã duyệt. Hãy tải lại.', { status: 409 })
  return { order, quotes, quote: quotes.find((row) => row.current), payments }
}
export async function preparePayment(id, user) {
  const order = await getOrder({ role: 'COLLECTOR', id: weighingId.parse(Number(id)) })
  const review = await getPaymentContext(order)
  if (!canRecordPayment({ ...review, user }))
    throw new ApiError('Đơn chưa đủ điều kiện ghi nhận thanh toán. Hãy tải lại.', { status: 409 })
  return review
}
export async function simulatePayment(review) {
  const { order, user } = review
  const quote = quoteSchema.parse(review.quote)
  weighingId.parse(order.id)
  const body = z
    .strictObject({
      version: z.number().int().min(0).max(2147483646),
      quoteId: weighingId,
      method: z.enum(Object.keys(paymentMethods)),
      requestKey: z.uuid(),
    })
    .parse({
      version: order.version,
      quoteId: quote.id,
      method: review.method,
      requestKey: review.requestKey,
    })
  if (!canRecordPayment({ ...review, quote }))
    throw new ApiError('Đơn hoặc báo giá đã đổi. Hãy tải lại trước khi xác nhận.', { status: 409 })
  const result = parseApi(
    paymentSchema,
    await apiRequest(`/api/collector/orders/${order.id}/payments/simulate`, {
      method: 'POST',
      body,
    }),
    true,
  )
  if (
    result.orderId !== order.id ||
    result.quoteId !== quote.id ||
    result.amount !== quote.totalAmount ||
    result.orderStatus !== 'COMPLETED' ||
    result.orderVersion !== order.version + 1 ||
    result.status !== 'COMPLETED' ||
    result.recordedBy !== user.id ||
    result.method !== body.method ||
    result.requestKey !== body.requestKey ||
    !result.referenceCode
  )
    throw new ApiError('Kết quả thanh toán chưa khớp. Hãy tải lại để kiểm tra khoản đã ghi nhận.', {
      uncertain: true,
    })
  return result
}
