import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { requiredText } from '../../lib/validation'
import { orderSchema } from '../orders/model'
import {
  canCancel,
  canReschedule,
  changeFormSchema,
  changeSchema,
  assertOrderUpdate,
  writeableOrder,
} from './order-action-model'
import { id } from './schemas'

export async function submitOrderChange(order, mode, values, userId) {
  writeableOrder(order)
  id.parse(userId)
  z.enum(['CANCEL', 'RESCHEDULE']).parse(mode)
  if ((mode === 'CANCEL' && !canCancel(order)) || (mode === 'RESCHEDULE' && !canReschedule(order)))
    throw new ApiError('Đơn không còn cho phép thao tác này.', { status: 409 })
  const direct = mode === 'RESCHEDULE' && canReschedule(order) === 'DIRECT'
  const detail =
    mode === 'CANCEL'
      ? { reason: requiredText(500).parse(values.reason) }
      : changeFormSchema.parse(values)
  const body = {
    version: order.version,
    ...detail,
    ...(mode === 'RESCHEDULE' && !direct && { requestType: 'RESCHEDULE' }),
  }
  const action = mode === 'CANCEL' ? 'cancel' : direct ? 'reschedule' : 'change-requests'
  const raw = await apiRequest(`/api/customer/orders/${order.id}/${action}`, {
    method: 'POST',
    body,
  })
  if (direct) {
    const result = parseApi(orderSchema, raw, true)
    if (
      result.id !== order.id ||
      result.version !== order.version + 1 ||
      result.status !== order.status ||
      Date.parse(result.pickupStart) !== Date.parse(detail.pickupStart) ||
      Date.parse(result.pickupEnd) !== Date.parse(detail.pickupEnd)
    )
      throw new ApiError('Lịch mới phản hồi chưa khớp. Hãy tải lại đơn.', { uncertain: true })
    return result
  }
  const result = parseApi(changeSchema, raw, true)
  assertOrderUpdate(order, result)
  if (
    result.requestedBy !== userId ||
    result.requestType !== mode ||
    result.status !== 'PENDING' ||
    result.version !== 0
  )
    throw new ApiError('Yêu cầu chưa khớp. Hãy tải lại lịch sử.', { uncertain: true })
  return result
}
export async function withdrawChange(order, request, userId) {
  writeableOrder(order)
  id.parse(request.id)
  if (
    request.status !== 'PENDING' ||
    request.orderId !== order.id ||
    request.requestedBy !== userId
  )
    throw new ApiError('Yêu cầu không còn cho phép rút.', { status: 409 })
  const result = parseApi(
    changeSchema,
    await apiRequest(`/api/customer/orders/${order.id}/change-requests/${request.id}/withdraw`, {
      method: 'POST',
      body: { version: order.version, requestVersion: request.version, responseNote: null },
    }),
    true,
  )
  assertOrderUpdate(order, result)
  if (
    result.id !== request.id ||
    result.status !== 'WITHDRAWN' ||
    result.version !== request.version + 1 ||
    result.processedBy !== userId
  )
    throw new ApiError('Chưa xác định kết quả rút yêu cầu. Hãy tải lại.', { uncertain: true })
  return result
}
