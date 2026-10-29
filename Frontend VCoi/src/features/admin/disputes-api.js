import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { getOrder } from '../orders/api'
import { orderSchema } from '../orders/model'
import { id, version } from '../customer/schemas'
import { adminDisputeSchema, conclusionSchema, disputeProblem, sameDispute } from './disputes-model'

const conflict = () =>
  new ApiError(
    'Đơn hoặc khiếu nại đã thay đổi. Hãy tải lại và xem thông tin mới trước khi quyết định.',
    { status: 409 },
  )
async function request(path, options) {
  try {
    return await apiRequest(path, options)
  } catch (error) {
    const messages = {
      400: 'Kết luận hoặc thông tin xử lý chưa hợp lệ. Hãy kiểm tra và tải lại khiếu nại.',
      404: 'Không tìm thấy khiếu nại hoặc đơn trong phạm vi tài khoản. Hãy tải lại danh sách.',
      409: 'Khiếu nại đã được xử lý hoặc đơn vừa thay đổi. Hãy tải lại trước khi quyết định tiếp.',
    }
    if (error instanceof ApiError && messages[error.status])
      throw new ApiError(messages[error.status], {
        status: error.status,
        uncertain: error.uncertain,
        cause: error,
      })
    throw error
  }
}
export async function listAdminDisputes({ status = 'OPEN', page = 0, size = 20, signal } = {}) {
  z.enum(['', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED']).parse(status)
  z.number().int().min(0).max(2147483647).parse(page)
  z.number().int().min(1).max(100).parse(size)
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (status) params.set('status', status)
  const result = parseApi(
    z.object({
      data: z.array(adminDisputeSchema).max(size),
      page: z.number().int().min(0),
      totalElements: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      totalPages: z.number().int().min(0),
    }),
    await request(`/api/admin/disputes?${params}`, { signal }),
  )
  if (
    result.page !== page ||
    result.totalPages !== Math.ceil(result.totalElements / size) ||
    new Set(result.data.map((row) => row.id)).size !== result.data.length ||
    result.data.some((row) => status && row.status !== status)
  )
    throw conflict()
  return result
}
export async function loadDisputeContext(initial, { signal } = {}) {
  id.parse(initial.id)
  id.parse(initial.orderId)
  const [dispute, order] = await Promise.all([
    request(`/api/admin/disputes/${initial.id}`, { signal }).then((value) =>
      parseApi(adminDisputeSchema, value),
    ),
    getOrder({ role: 'ADMIN', id: initial.orderId, signal }),
  ])
  if (
    dispute.id !== initial.id ||
    dispute.orderId !== initial.orderId ||
    order.id !== initial.orderId ||
    dispute.orderStatus !== order.status ||
    dispute.orderVersion !== order.version
  )
    throw conflict()
  return { dispute, order }
}
export async function processDispute(context, action, values, actorId) {
  z.enum(['review', 'resolve', 'reject']).parse(action)
  id.parse(actorId)
  const snapshot = {
    dispute: adminDisputeSchema.parse(context.dispute),
    order: orderSchema.parse(context.order),
  }
  const conclusion = (action === 'review' ? z.strictObject({}) : conclusionSchema).parse(values)
  if (disputeProblem(snapshot, action)) throw conflict()
  const body = { version: version.max(2147483646).parse(snapshot.order.version), ...conclusion }
  const result = parseApi(
    adminDisputeSchema,
    await request(`/api/admin/disputes/${snapshot.dispute.id}/${action}`, { method: 'POST', body }),
    true,
  )
  if (
    !sameDispute(result, snapshot.dispute) ||
    result.status !== { review: 'IN_REVIEW', resolve: 'RESOLVED', reject: 'REJECTED' }[action] ||
    result.orderVersion !== body.version + 1 ||
    result.orderStatus !==
      (action === 'review' ? 'DISPUTED' : snapshot.dispute.previousOrderStatus) ||
    (action !== 'review' &&
      (result.resolvedBy !== actorId || result.resolution !== body.resolution))
  )
    throw new ApiError(
      'Kết quả xử lý chưa khớp. Hãy tải lại để xác định kết quả trước khi thao tác tiếp.',
      { uncertain: true },
    )
  return result
}
