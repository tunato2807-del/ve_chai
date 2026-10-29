import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { getOrder, getBookingMaterials } from './api'
import { getWeighings } from './weighing-api'
import { weighingId } from './weighing-model'
import { buildQuotePreview, canSendQuote, quoteSchema } from './quotation-model'
import { roleConfig } from '../auth/roles'

export async function getQuotes(order, { signal, role = 'COLLECTOR' } = {}) {
  weighingId.parse(order.id)
  z.enum(['CUSTOMER', 'COLLECTOR', 'ADMIN']).parse(role)
  const quotes = parseApi(
    z.array(quoteSchema).max(100),
    await apiRequest(`${roleConfig[role].ordersApi}/${order.id}/quotes`, { signal }),
  )
  if (
    quotes.some(
      (quote) =>
        quote.orderId !== order.id ||
        quote.orderVersion !== order.version ||
        quote.orderStatus !== order.status ||
        quote.items.some(
          (row) =>
            !order.items.some(
              (item) => item.itemId === row.itemId && item.materialId === row.materialId,
            ),
        ),
    ) ||
    quotes.filter((quote) => quote.current).length > 1 ||
    new Set(quotes.map((quote) => quote.id)).size !== quotes.length ||
    new Set(quotes.map((quote) => quote.versionNumber)).size !== quotes.length
  )
    throw new ApiError('Đơn và báo giá chưa đồng bộ. Hãy tải lại để kiểm tra.', { status: 409 })
  return quotes.sort((a, b) => b.versionNumber - a.versionNumber)
}
export async function prepareQuote(id, { signal } = {}) {
  const orderId = weighingId.parse(Number(id))
  const order = await getOrder({ role: 'COLLECTOR', id: orderId, signal })
  const [weights, quotes, prices] = await Promise.all([
    getWeighings(order, { signal }),
    getQuotes(order, { signal }),
    getBookingMaterials({ signal }),
  ])
  if (
    weights.orderVersion !== order.version ||
    new Set(prices.map((row) => row.materialId)).size !== prices.length
  )
    throw new ApiError('Đơn, kết quả cân hoặc giá đang thay đổi. Hãy tải lại bản xem trước.', {
      status: 409,
    })
  if (!canSendQuote(order, quotes))
    throw new ApiError('Đơn chưa ở bước có thể gửi báo giá mới.', { status: 409 })
  return { order, weights, quotes, prices, ...buildQuotePreview(order, weights, prices) }
}
export async function sendQuote(review) {
  const { order, weights, quotes, prices } = review
  weighingId.parse(order.id)
  z.number().int().min(0).max(2147483646).parse(order.version)
  weighingId.parse(order.collectorId)
  const preview = buildQuotePreview(order, weights, prices)
  if (
    weights.orderId !== order.id ||
    weights.orderVersion !== order.version ||
    !canSendQuote(order, quotes) ||
    !preview.ready
  )
    throw new ApiError('Chưa thể gửi báo giá. Hãy tải lại đơn, kết quả cân và giá hiện hành.', {
      status: 409,
    })
  const result = parseApi(
    quoteSchema,
    await apiRequest(`/api/collector/orders/${order.id}/quotes`, {
      method: 'POST',
      body: { version: order.version },
    }),
    true,
  )
  const number = Math.max(0, ...quotes.map((quote) => quote.versionNumber)) + 1
  const complete =
    result.items.length === preview.rows.length &&
    preview.rows.every((row) =>
      result.items.some(
        (item) =>
          item.itemId === row.itemId &&
          item.materialId === row.materialId &&
          item.weighingId === row.weighingId &&
          item.actualQty === row.qty,
      ),
    )
  if (
    result.orderId !== order.id ||
    result.orderVersion !== order.version + 1 ||
    result.orderStatus !== 'AWAITING_SELLER_APPROVAL' ||
    !result.current ||
    result.status !== 'SENT' ||
    result.createdBy !== order.collectorId ||
    result.versionNumber !== number ||
    result.version !== 0 ||
    !result.validUntil ||
    !result.sentAt ||
    Date.parse(result.validUntil) - Date.parse(result.sentAt) !== 86400000 ||
    !complete
  )
    throw new ApiError(
      'Phản hồi báo giá chưa khớp. Hãy tải lại đơn và báo giá để xác định kết quả.',
      { uncertain: true },
    )
  return result
}
