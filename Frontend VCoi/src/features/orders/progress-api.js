import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { orderSchema } from './model'

export const progressSteps = {
  ASSIGNED: { action: 'start-trip', next: 'EN_ROUTE', label: 'Khởi hành' },
  EN_ROUTE: { action: 'arrive', next: 'ARRIVED', label: 'Đã đến điểm thu gom' },
}
export const progressNoteSchema = z.object({
  reason: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự.'),
})
const snapshotSchema = z.object({
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  collectorId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  version: z.number().int().min(0).max(2147483646),
  status: z.enum(['ASSIGNED', 'EN_ROUTE']),
})

export async function moveCollectorOrder(order, reason = '') {
  const before = snapshotSchema.parse(order)
  const note = progressNoteSchema.parse({ reason })
  const step = progressSteps[before.status]
  const result = parseApi(
    orderSchema,
    await apiRequest(`/api/collector/orders/${before.id}/${step.action}`, {
      method: 'POST',
      body: { version: before.version, reason: note.reason || null },
    }),
    true,
  )
  if (
    result.id !== before.id ||
    result.collectorId !== before.collectorId ||
    result.status !== step.next ||
    result.version !== before.version + 1
  )
    throw new ApiError('Phản hồi chưa khớp với đơn. Hãy tải lại trạng thái để kiểm tra.', {
      uncertain: true,
    })
  return result
}
