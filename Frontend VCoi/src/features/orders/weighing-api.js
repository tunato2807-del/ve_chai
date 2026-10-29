import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { weighingId, weighingResultSchema } from './weighing-model'
import { weighingFormSchema } from './weighing-form'
import { roleConfig } from '../auth/roles'

function validateResult(order, result, uncertain = false) {
  if (
    result.orderId !== order.id ||
    result.records.some(
      (row) =>
        !order.items.some((item) => item.itemId === row.itemId) ||
        (row.correctionOf !== null &&
          !result.records.some(
            (parent) =>
              parent.id === row.correctionOf && parent.itemId === row.itemId && parent.id < row.id,
          )),
    )
  )
    throw new ApiError('Kết quả cân không khớp với vật liệu của đơn. Hãy tải lại để kiểm tra.', {
      uncertain,
    })
  return result
}
export async function getWeighings(order, { signal, role = 'COLLECTOR' } = {}) {
  weighingId.parse(order.id)
  z.enum(['CUSTOMER', 'COLLECTOR', 'ADMIN']).parse(role)
  return validateResult(
    order,
    parseApi(
      weighingResultSchema,
      await apiRequest(`${roleConfig[role].ordersApi}/${order.id}/weighings`, { signal }),
    ),
  )
}
const writable = z.object({
  id: weighingId,
  collectorId: weighingId,
  status: z.literal('ARRIVED'),
  version: z.number().int().min(0).max(2147483646),
})
export async function recordWeighings(order, history, values) {
  writable.parse(order)
  if (history.orderId !== order.id || history.orderVersion !== order.version)
    throw new ApiError('Đơn và lịch sử cân đã thay đổi. Hãy tải lại cả hai trước khi tiếp tục.', {
      status: 409,
    })
  const body = weighingFormSchema(order, history).parse(values)
  const result = validateResult(
    order,
    parseApi(
      weighingResultSchema,
      await apiRequest(`/api/collector/orders/${order.id}/weighings`, { method: 'POST', body }),
      true,
    ),
    true,
  )
  const prior = new Map(history.records.map((row) => [row.id, row]))
  const added = result.records.filter((row) => !prior.has(row.id))
  const newestPrior = Math.max(0, ...prior.keys())
  const unchanged = history.records.every((old) =>
    result.records.some(
      (row) =>
        row.id === old.id &&
        [
          'itemId',
          'grossWeight',
          'tareWeight',
          'netWeight',
          'correctionOf',
          'correctionReason',
        ].every((key) => row[key] === old[key]),
    ),
  )
  const matches = body.items.every((sent) =>
    added.some(
      (row) =>
        row.itemId === sent.itemId &&
        row.grossWeight === sent.grossWeight &&
        row.tareWeight === sent.tareWeight &&
        row.correctionOf === sent.correctionOf &&
        row.correctionReason === sent.correctionReason &&
        row.createdBy === order.collectorId,
    ),
  )
  if (
    result.orderVersion !== order.version + 1 ||
    result.records.length !== history.records.length + body.items.length ||
    added.length !== body.items.length ||
    added.some((row) => row.id <= newestPrior) ||
    !unchanged ||
    !matches
  )
    throw new ApiError(
      'Phản hồi lưu cân chưa khớp. Hãy tải lại đơn và lịch sử để xác định kết quả.',
      { uncertain: true },
    )
  return result
}
