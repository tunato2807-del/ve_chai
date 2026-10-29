import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { quoteSchema, quoteExpired } from '../orders/quotation-model'
import { weighingId } from '../orders/weighing-model'
import { optionalText } from '../../lib/validation'

export function canReviewQuote(order, quote, now = Date.now()) {
  return Boolean(
    quote &&
    order.status === 'AWAITING_SELLER_APPROVAL' &&
    quote.current &&
    quote.status === 'SENT' &&
    quote.orderId === order.id &&
    quote.orderVersion === order.version &&
    quote.orderStatus === order.status &&
    order.version < 2147483647 &&
    quote.version < 2147483647 &&
    !quoteExpired(quote, now),
  )
}
export async function respondToQuote({ order, quote, decision, note, userId }) {
  weighingId.parse(order.id)
  weighingId.parse(userId)
  z.enum(['accept', 'reject']).parse(decision)
  const responseNote = optionalText(500).parse(note)
  if (!canReviewQuote(order, quote))
    throw new ApiError('Báo giá đã thay đổi hoặc hết hạn. Hãy tải lại trước khi phản hồi.', {
      status: 409,
    })
  const result = parseApi(
    quoteSchema,
    await apiRequest(`/api/customer/orders/${order.id}/quotes/${quote.id}/${decision}`, {
      method: 'POST',
      body: { version: order.version, quoteVersion: quote.version, responseNote },
    }),
    true,
  )
  const sameItems =
    result.items.length === quote.items.length &&
    result.items.every((row) =>
      quote.items.some((old) => Object.keys(row).every((key) => row[key] === old[key])),
    )
  if (
    result.id !== quote.id ||
    result.orderId !== order.id ||
    result.orderVersion !== order.version + 1 ||
    result.version !== quote.version + 1 ||
    result.orderStatus !== (decision === 'accept' ? 'AWAITING_PAYMENT' : 'ARRIVED') ||
    result.status !== (decision === 'accept' ? 'ACCEPTED' : 'REJECTED') ||
    !result.current ||
    result.respondedBy !== userId ||
    !result.respondedAt ||
    result.totalAmount !== quote.totalAmount ||
    result.responseNote !== responseNote ||
    result.createdBy !== quote.createdBy ||
    result.versionNumber !== quote.versionNumber ||
    result.sentAt !== quote.sentAt ||
    result.validUntil !== quote.validUntil ||
    !sameItems
  )
    throw new ApiError('Phản hồi chưa khớp. Hãy tải lại đơn và báo giá để kiểm tra kết quả.', {
      uncertain: true,
    })
  return result
}
