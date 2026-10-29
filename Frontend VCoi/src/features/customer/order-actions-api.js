import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { requiredText } from '../../lib/validation'
import {
  beforeTrip,
  canDispute,
  disputeSchema,
  assertOrderUpdate,
  writeableOrder,
} from './order-action-model'
import { evidenceUrl, id, version } from './schemas'

export async function openDispute(order, values, availableEvidence, userId) {
  writeableOrder(order)
  id.parse(userId)
  if (!canDispute(order))
    throw new ApiError('Đơn chưa ở trạng thái có thể gửi khiếu nại.', { status: 409 })
  const reason = requiredText(1000).parse(values.reason)
  const image = values.evidenceUrl || null
  if (image && (!evidenceUrl.safeParse(image).success || !availableEvidence.includes(image)))
    throw new ApiError('Chỉ chọn ảnh minh chứng đã được lưu cho đơn này.')
  const result = parseApi(
    disputeSchema,
    await apiRequest(`/api/customer/orders/${order.id}/disputes`, {
      method: 'POST',
      body: { version: order.version, reason, evidenceUrl: image },
    }),
    true,
  )
  assertOrderUpdate(order, result, 'DISPUTED')
  if (
    result.openedBy !== userId ||
    result.status !== 'OPEN' ||
    result.previousOrderStatus !== order.status
  )
    throw new ApiError('Khiếu nại phản hồi chưa khớp. Hãy tải lại.', { uncertain: true })
  return result
}
export async function uploadMaterialPhoto(order, itemId, file) {
  writeableOrder(order)
  id.parse(itemId)
  const item = order.items.find((row) => row.itemId === itemId)
  if (!beforeTrip(order) || !item || item.photoUrl)
    throw new ApiError('Chỉ tải ảnh mới cho vật liệu của đơn trước khi nhân viên khởi hành.', {
      status: 409,
    })
  if (
    !(file instanceof File) ||
    !['image/jpeg', 'image/png'].includes(file.type) ||
    file.size === 0 ||
    file.size > 5 * 1024 * 1024
  )
    throw new ApiError('Chọn ảnh JPEG hoặc PNG, dung lượng lớn hơn 0 và tối đa 5 MB.')
  const formData = new FormData()
  formData.append('file', file)
  formData.append('version', String(order.version))
  const result = parseApi(
    z.object({
      orderId: id,
      orderVersion: version,
      url: evidenceUrl,
      mediaType: z.enum(['image/jpeg', 'image/png']),
    }),
    await apiRequest(`/api/customer/orders/${order.id}/items/${itemId}/photo`, {
      method: 'POST',
      formData,
    }),
    true,
  )
  assertOrderUpdate(order, { ...result, orderStatus: order.status })
  return result
}
