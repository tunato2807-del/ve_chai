import { z } from 'zod'
import { requiredText } from '../../lib/validation'
import { vietnamInputToDate } from '../booking/schema'
import { orderStatuses } from '../orders/model'
import { ApiError } from '../../lib/api'
import { id, instant, version, evidenceUrl } from './schemas'

export const orderStatus = z.enum(Object.keys(orderStatuses))
export const orderContext = z.object({ orderId: id, orderStatus, orderVersion: version })
export const beforeTrip = (order) => ['PENDING', 'CONFIRMED', 'ASSIGNED'].includes(order.status)
export const canCancel = (order) => !['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(order.status)
export const canReschedule = (order) =>
  beforeTrip(order) ? 'DIRECT' : order.status === 'EN_ROUTE' ? 'REQUEST' : null
export const canDispute = (order) =>
  [
    'EN_ROUTE',
    'ARRIVED',
    'AWAITING_SELLER_APPROVAL',
    'AWAITING_PAYMENT',
    'COMPLETED',
    'CANCELLED',
  ].includes(order.status)
export const changeFormSchema = z
  .strictObject({ reason: requiredText(500), pickupStart: z.string(), pickupEnd: z.string() })
  .superRefine((value, ctx) => {
    const start = vietnamInputToDate(value.pickupStart),
      end = vietnamInputToDate(value.pickupEnd)
    if (!start || start.getTime() <= Date.now())
      ctx.addIssue({
        code: 'custom',
        path: ['pickupStart'],
        message: 'Chọn giờ bắt đầu trong tương lai, theo giờ Việt Nam.',
      })
    if (!end || !start || end <= start)
      ctx.addIssue({
        code: 'custom',
        path: ['pickupEnd'],
        message: 'Giờ kết thúc phải sau giờ bắt đầu.',
      })
  })
  .transform(({ reason, pickupStart, pickupEnd }) => ({
    reason,
    pickupStart: vietnamInputToDate(pickupStart).toISOString(),
    pickupEnd: vietnamInputToDate(pickupEnd).toISOString(),
  }))
export const changeSchema = orderContext.extend({
  id,
  requestedBy: id,
  requestType: z.enum(['CANCEL', 'RESCHEDULE']),
  reason: z.string(),
  oldPickupStart: instant,
  oldPickupEnd: instant,
  newPickupStart: instant.nullable(),
  newPickupEnd: instant.nullable(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN']),
  processedBy: id.nullable(),
  processedAt: instant.nullable(),
  responseNote: z.string().nullable(),
  version,
  createdAt: instant,
})
export const disputeSchema = orderContext.extend({
  id,
  openedBy: id,
  reason: z.string(),
  evidenceUrl: evidenceUrl.nullable(),
  previousOrderStatus: orderStatus,
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED']),
  resolution: z.string().nullable(),
  resolvedBy: id.nullable(),
  resolvedAt: instant.nullable(),
  createdAt: instant,
})
export function assertOrderUpdate(order, result, next = order.status) {
  if (
    result.orderId !== order.id ||
    result.orderVersion !== order.version + 1 ||
    result.orderStatus !== next
  )
    throw new ApiError('Kết quả chưa khớp với đơn. Hãy tải lại để xác định kết quả.', {
      uncertain: true,
    })
}
export function writeableOrder(order) {
  id.parse(order.id)
  version.max(2147483646).parse(order.version)
}
