import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { locationSchema } from './location'

export const routeStatuses = new Set(['ASSIGNED', 'EN_ROUTE', 'ARRIVED'])
export const routeSchema = z.object({
  orderId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  origin: locationSchema,
  destination: locationSchema,
  profile: z.literal('auto'),
  strategy: z.literal('shortest-distance'),
  distanceMeters: z.number().nonnegative().max(1e9),
  durationSeconds: z.number().int().nonnegative().max(31536000),
  geometry: z.object({
    type: z.literal('LineString'),
    coordinates: z
      .array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]))
      .min(2)
      .max(20000),
  }),
  steps: z
    .array(
      z.object({
        instruction: z.string().min(1).max(1000),
        distanceMeters: z.number().nonnegative().max(1e9),
      }),
    )
    .max(1000),
  calculatedAt: z.iso.datetime({ offset: true }),
  attribution: z.string().min(1).max(200),
})
export const sameLocation = (a, b) => Boolean(a && b && a.lat === b.lat && a.lng === b.lng)
export async function getCollectorRoute(order, origin, { signal } = {}) {
  z.number().int().positive().max(Number.MAX_SAFE_INTEGER).parse(order.id)
  if (!routeStatuses.has(order.status) || !order.pickupLocation)
    throw new ApiError('Đơn chưa có điểm bản đồ hoặc đã qua giai đoạn di chuyển.', { status: 409 })
  const point = locationSchema.parse(origin),
    destination = locationSchema.parse(order.pickupLocation)
  try {
    const result = parseApi(
      routeSchema,
      await apiRequest(`/api/collector/orders/${order.id}/route`, {
        method: 'POST',
        body: { origin: point },
        signal,
      }),
    )
    if (
      result.orderId !== order.id ||
      !sameLocation(result.origin, point) ||
      !sameLocation(result.destination, destination)
    )
      throw new ApiError('Tuyến đường chưa khớp với đơn. Hãy làm mới đơn rồi thử lại.', {
        status: 409,
      })
    return result
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
    const messages = {
      400: 'Điểm xuất phát tạm chưa hợp lệ. Hãy kiểm tra lại cấu hình.',
      409: 'Trạng thái hoặc điểm thu gom đã thay đổi. Hãy làm mới đơn rồi tìm đường lại.',
      422: 'Chưa tìm được tuyến ô tô giữa hai điểm. Hãy kiểm tra vị trí hoặc chọn điểm xuất phát khác.',
      429: 'Hãy chờ một lát rồi tìm đường lại.',
      502: 'Chưa nhận được dữ liệu đường đi hợp lệ. Hãy thử lại sau.',
      503: 'Dịch vụ tìm đường đang bận hoặc chưa kết nối được. Hãy thử lại sau.',
    }
    throw new ApiError(messages[error.status] || error.message, {
      status: error.status,
      cause: error,
    })
  }
}
export const routeDistance = (meters) =>
  meters < 1000
    ? `${Math.round(meters)} m`
    : `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(meters / 1000)} km`
export function routeDuration(seconds) {
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  return minutes < 60
    ? `${minutes} phút`
    : `${Math.floor(minutes / 60)} giờ${minutes % 60 ? ` ${minutes % 60} phút` : ''}`
}
