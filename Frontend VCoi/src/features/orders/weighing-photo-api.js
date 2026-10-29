import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { evidencePathSchema } from '../../lib/validation'
import { latestWeighings, weighingId } from './weighing-model'

export function weighingPhotoFileProblem(file) {
  if (
    !(file instanceof File) ||
    !['image/jpeg', 'image/png'].includes(file.type) ||
    file.size === 0 ||
    file.size > 5 * 1024 * 1024
  )
    return 'Chọn ảnh JPEG hoặc PNG, dung lượng lớn hơn 0 và tối đa 5 MB.'
  return null
}
export function weighingPhotoProblem(order, history, quotes, weighingId) {
  const row = history.records.find((item) => item.id === weighingId)
  if (
    order.status !== 'ARRIVED' ||
    history.orderId !== order.id ||
    history.orderVersion !== order.version ||
    !row ||
    !order.items.some((item) => item.itemId === row.itemId) ||
    latestWeighings(history.records).get(row.itemId)?.id !== row.id
  )
    return 'Đơn hoặc lần cân mới nhất đã thay đổi. Hãy tải lại trước khi tải ảnh.'
  if (row.photoUrl) return 'Phiếu này đã có ảnh. Ảnh đã lưu được giữ nguyên.'
  if (!Array.isArray(quotes)) return 'Chưa kiểm tra được báo giá. Hãy tải lại trước khi tải ảnh.'
  if (quotes.some((quote) => quote.items.some((item) => item.weighingId === row.id)))
    return 'Phiếu này đã được dùng trong báo giá nên không thể bổ sung ảnh. Nếu cần cân lại, hãy tạo lần cân điều chỉnh.'
  return null
}
const uploadSchema = z.object({
  orderId: weighingId,
  orderVersion: z.number().int().min(0).max(2147483647),
  url: evidencePathSchema,
  mediaType: z.enum(['image/jpeg', 'image/png']),
})
export async function uploadWeighingPhoto(order, history, quotes, rowId, file) {
  z.object({
    id: weighingId,
    collectorId: weighingId,
    status: z.literal('ARRIVED'),
    version: z.number().int().min(0).max(2147483646),
  }).parse(order)
  weighingId.parse(rowId)
  const reason = weighingPhotoProblem(order, history, quotes, rowId)
  if (reason) throw new ApiError(reason, { status: 409 })
  const invalid = weighingPhotoFileProblem(file)
  if (invalid) throw new ApiError(invalid)
  const formData = new FormData()
  formData.append('version', String(order.version))
  formData.append('file', file)
  let raw
  try {
    raw = await apiRequest(`/api/collector/orders/${order.id}/weighings/${rowId}/photo`, {
      method: 'POST',
      formData,
    })
  } catch (error) {
    if (error.status === 400)
      throw new ApiError(
        'Ảnh chưa hợp lệ. Chọn JPEG/PNG thật, mỗi chiều tối đa 8192 px và tối đa 16 triệu điểm ảnh.',
        { status: 400 },
      )
    throw error
  }
  const result = parseApi(uploadSchema, raw, true)
  if (
    result.orderId !== order.id ||
    result.orderVersion !== order.version + 1 ||
    result.url.endsWith('.png') !== (result.mediaType === 'image/png')
  )
    throw new ApiError('Phản hồi ảnh chưa khớp với đơn. Hãy tải lại để đối chiếu.', {
      uncertain: true,
    })
  return result
}
