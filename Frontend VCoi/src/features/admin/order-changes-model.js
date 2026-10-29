import { z } from 'zod'
import { optionalText } from '../../lib/validation'
import { changeSchema } from '../customer/order-action-model'

export const changeStatuses = {
  PENDING: 'Chờ xử lý',
  APPROVED: 'Đã chấp thuận',
  REJECTED: 'Đã từ chối',
  WITHDRAWN: 'Đã rút',
}
export const changeTypes = { CANCEL: 'Hủy thu gom', RESCHEDULE: 'Đổi lịch' }
export const reviewNoteSchema = z.strictObject({ responseNote: optionalText(500) })
export const changeRequestSchema = changeSchema
  .refine((row) => row.reason.trim().length > 0 && row.reason.length <= 500)
  .refine((row) => Date.parse(row.oldPickupEnd) > Date.parse(row.oldPickupStart))
  .refine((row) =>
    row.requestType === 'CANCEL'
      ? row.newPickupStart === null && row.newPickupEnd === null
      : row.newPickupStart !== null &&
        row.newPickupEnd !== null &&
        Date.parse(row.newPickupEnd) > Date.parse(row.newPickupStart),
  )
  .refine((row) =>
    row.status === 'PENDING'
      ? row.processedBy === null && row.processedAt === null
      : row.processedBy !== null && row.processedAt !== null,
  )

export function readChangeFilters(params) {
  const rawStatus = params.get('status'),
    rawPage = params.get('page') || '0'
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : 0
  return {
    status:
      rawStatus === 'ALL' ? '' : Object.hasOwn(changeStatuses, rawStatus) ? rawStatus : 'PENDING',
    page: Number.isSafeInteger(page) && page >= 0 && page <= 2147483647 ? page : 0,
  }
}
export function reviewProblem({ request, order }) {
  if (request.status !== 'PENDING') return 'Yêu cầu đã được xử lý hoặc rút, chỉ có thể xem lại.'
  if (request.version >= 2147483647 || order.version >= 2147483647)
    return 'Đã đạt giới hạn cập nhật. Không thể ghi thêm quyết định.'
  return ''
}
export function approvalProblem(context, now = Date.now()) {
  const problem = reviewProblem(context)
  if (problem) return problem
  const { request, order } = context
  if (['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(order.status))
    return 'Đơn đã hoàn tất, hủy hoặc có khiếu nại. Không thể chấp thuận yêu cầu này; có thể từ chối để lưu kết luận.'
  if (request.requestType === 'RESCHEDULE') {
    if (!['PENDING', 'CONFIRMED', 'ASSIGNED', 'EN_ROUTE'].includes(order.status))
      return 'Đơn đã đến điểm thu gom hoặc đang xử lý sau đó. Không thể dời lịch; có thể từ chối yêu cầu.'
    if (!request.newPickupStart || Date.parse(request.newPickupStart) <= now)
      return 'Khung giờ đề xuất đã qua. Hãy từ chối hoặc trao đổi để khách gửi yêu cầu mới.'
  }
  return ''
}
export function expectedChangeStatus(context, action) {
  if (action === 'reject') return context.order.status
  if (context.request.requestType === 'CANCEL') return 'CANCELLED'
  return context.order.status === 'EN_ROUTE' ? 'CONFIRMED' : context.order.status
}
export function sameChangeRequest(a, b) {
  return (
    ['id', 'orderId', 'requestedBy', 'requestType', 'reason'].every((key) => a[key] === b[key]) &&
    ['oldPickupStart', 'oldPickupEnd', 'newPickupStart', 'newPickupEnd', 'createdAt'].every(
      (key) => (a[key] === null ? b[key] === null : Date.parse(a[key]) === Date.parse(b[key])),
    )
  )
}
