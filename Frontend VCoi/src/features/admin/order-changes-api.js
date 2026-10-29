import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { getOrder } from '../orders/api'
import { orderSchema } from '../orders/model'
import { id, version } from '../customer/schemas'
import {
  changeRequestSchema,
  reviewNoteSchema,
  approvalProblem,
  reviewProblem,
  sameChangeRequest,
  expectedChangeStatus,
} from './order-changes-model'

const conflict = () =>
  new ApiError(
    'Đơn hoặc yêu cầu đã thay đổi. Hãy tải lại và xem thông tin mới trước khi quyết định.',
    { status: 409 },
  )
async function request(path, options) {
  try {
    return await apiRequest(path, options)
  } catch (error) {
    const messages = {
      400: 'Khung giờ đề xuất hoặc ghi chú chưa hợp lệ. Hãy tải lại để kiểm tra thời gian hiệu lực.',
      404: 'Không tìm thấy đơn hoặc yêu cầu trong phạm vi tài khoản. Hãy tải lại danh sách.',
      409: 'Đơn, yêu cầu hoặc lịch nhân viên đã thay đổi. Hãy tải lại và kiểm tra trước khi xác nhận lại.',
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
export async function listAdminChanges({ status = 'PENDING', page = 0, size = 20, signal } = {}) {
  z.enum(['', 'PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN']).parse(status)
  z.number().int().min(0).max(2147483647).parse(page)
  z.number().int().min(1).max(100).parse(size)
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (status) params.set('status', status)
  const result = parseApi(
    z.object({
      data: z.array(changeRequestSchema).max(size),
      page: z.number().int().min(0),
      totalElements: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      totalPages: z.number().int().min(0),
    }),
    await request(`/api/admin/order-change-requests?${params}`, { signal }),
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
export async function loadChangeContext(initial, filters, { signal } = {}) {
  id.parse(initial.id)
  id.parse(initial.orderId)
  const [list, order] = await Promise.all([
    listAdminChanges({ ...filters, signal }),
    getOrder({ role: 'ADMIN', id: initial.orderId, signal }),
  ])
  const current = list.data.find((row) => row.id === initial.id)
  if (
    !current ||
    current.orderId !== initial.orderId ||
    order.id !== initial.orderId ||
    current.orderStatus !== order.status ||
    current.orderVersion !== order.version
  )
    throw conflict()
  return { request: current, order }
}
export async function reviewAdminChange(context, action, values, actorId) {
  z.enum(['approve', 'reject']).parse(action)
  id.parse(actorId)
  const snapshot = {
    request: changeRequestSchema.parse(context.request),
    order: orderSchema.parse(context.order),
  }
  const note = reviewNoteSchema.parse(values)
  const problem = action === 'approve' ? approvalProblem(snapshot) : reviewProblem(snapshot)
  if (
    problem ||
    snapshot.request.orderId !== snapshot.order.id ||
    snapshot.request.orderVersion !== snapshot.order.version ||
    snapshot.request.orderStatus !== snapshot.order.status
  )
    throw conflict()
  const body = {
    version: version.max(2147483646).parse(snapshot.order.version),
    requestVersion: version.max(2147483646).parse(snapshot.request.version),
    ...note,
  }
  const result = parseApi(
    changeRequestSchema,
    await request(`/api/admin/order-change-requests/${snapshot.request.id}/${action}`, {
      method: 'POST',
      body,
    }),
    true,
  )
  if (
    !sameChangeRequest(result, snapshot.request) ||
    result.status !== (action === 'approve' ? 'APPROVED' : 'REJECTED') ||
    result.version !== body.requestVersion + 1 ||
    result.orderVersion !== body.version + 1 ||
    result.orderStatus !== expectedChangeStatus(snapshot, action) ||
    result.processedBy !== actorId ||
    result.responseNote !== body.responseNote
  )
    throw new ApiError(
      'Kết quả xử lý chưa khớp. Hãy tải lại để xác định kết quả trước khi thao tác tiếp.',
      { uncertain: true },
    )
  return result
}
