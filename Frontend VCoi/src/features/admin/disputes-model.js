import { z } from 'zod'
import { requiredText } from '../../lib/validation'
import { disputeSchema } from '../customer/order-action-model'

export const disputeStatuses = {
  OPEN: 'Chờ tiếp nhận',
  IN_REVIEW: 'Đang xem xét',
  RESOLVED: 'Đã giải quyết',
  REJECTED: 'Đã từ chối',
}
export const disputeActions = {
  review: 'Tiếp nhận khiếu nại',
  resolve: 'Giải quyết khiếu nại',
  reject: 'Từ chối khiếu nại',
}
export const activeDispute = (row) => ['OPEN', 'IN_REVIEW'].includes(row.status)
export const adminDisputeSchema = disputeSchema
  .refine((row) => row.reason.trim().length > 0 && row.reason.length <= 1000)
  .refine((row) =>
    [
      'EN_ROUTE',
      'ARRIVED',
      'AWAITING_SELLER_APPROVAL',
      'AWAITING_PAYMENT',
      'COMPLETED',
      'CANCELLED',
    ].includes(row.previousOrderStatus),
  )
  .refine((row) =>
    activeDispute(row)
      ? row.orderStatus === 'DISPUTED' &&
        row.resolution === null &&
        row.resolvedBy === null &&
        row.resolvedAt === null
      : row.resolvedBy !== null &&
        row.resolvedAt !== null &&
        row.resolution !== null &&
        row.resolution.trim().length > 0 &&
        row.resolution.length <= 1000,
  )
export const conclusionSchema = z.strictObject({ resolution: requiredText(1000) })
export function readDisputeFilters(params) {
  const raw = params.get('status'),
    text = params.get('page') || '0'
  const page = /^\d+$/.test(text) ? Number(text) : 0
  return {
    status: raw === 'ALL' ? '' : Object.hasOwn(disputeStatuses, raw) ? raw : 'OPEN',
    page: Number.isSafeInteger(page) && page >= 0 && page <= 2147483647 ? page : 0,
  }
}
export function disputeProblem({ dispute, order }, action) {
  if (!activeDispute(dispute)) return 'Khiếu nại đã có kết luận, chỉ có thể xem lại.'
  if (action === 'review' && dispute.status !== 'OPEN') return 'Khiếu nại đã được tiếp nhận.'
  if (
    order.id !== dispute.orderId ||
    order.status !== 'DISPUTED' ||
    order.version !== dispute.orderVersion
  )
    return 'Đơn hoặc khiếu nại đã thay đổi. Hãy tải lại và xem thông tin mới.'
  if (order.version >= 2147483647) return 'Đã đạt giới hạn cập nhật. Không thể ghi thêm quyết định.'
  return ''
}
export function sameDispute(a, b) {
  return (
    ['id', 'orderId', 'openedBy', 'reason', 'evidenceUrl', 'previousOrderStatus'].every(
      (key) => a[key] === b[key],
    ) && Date.parse(a.createdAt) === Date.parse(b.createdAt)
  )
}
