import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { orderSchema } from './model'

const idSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
export const confirmSchema = z.strictObject({
  version: z.number().int().min(0).max(2147483646),
  reason: z
    .string()
    .trim()
    .max(500, 'Lý do tối đa 500 ký tự.')
    .transform((value) => value || null),
})
export const assignSchema = confirmSchema.extend({ collectorId: idSchema })
export const reassignSchema = assignSchema.extend({
  reason: z
    .string()
    .trim()
    .min(1, 'Hãy nhập lý do phân công lại.')
    .max(500, 'Lý do tối đa 500 ký tự.'),
})
const userPageSchema = z.object({
  data: z.array(
    z.object({
      id: idSchema,
      fullName: z.string(),
      phone: z.string(),
      role: z.enum(['CUSTOMER', 'COLLECTOR', 'ADMIN']),
      status: z.enum(['ACTIVE', 'LOCKED']),
    }),
  ),
  page: z.number().int().nonnegative(),
  totalPages: z.number().int().min(0).max(1000),
})

export async function getCollectors({ signal } = {}) {
  const collectors = new Map()
  let page = 0
  let totalPages
  do {
    const result = parseApi(
      userPageSchema,
      await apiRequest(`/api/admin/users?page=${page}&size=100`, { signal }),
    )
    if (result.page !== page) throw new ApiError('Phân trang nhân viên chưa hợp lệ. Hãy tải lại.')
    totalPages = result.totalPages
    for (const user of result.data)
      if (user.role === 'COLLECTOR' && user.status === 'ACTIVE') collectors.set(user.id, user)
    page++
  } while (page < totalPages)
  return [...collectors.values()]
}

async function dispatch(id, action, body, schema) {
  idSchema.parse(Number(id))
  const payload = schema.parse(body)
  const result = parseApi(
    orderSchema,
    await apiRequest(`/api/admin/orders/${id}/${action}`, { method: 'POST', body: payload }),
    true,
  )
  const expectedStatus = action === 'confirm' ? 'CONFIRMED' : 'ASSIGNED'
  if (
    result.id !== Number(id) ||
    result.status !== expectedStatus ||
    result.version !== payload.version + 1 ||
    result.collectorId !== (payload.collectorId ?? null)
  )
    throw new ApiError('Kết quả thao tác chưa khớp với đơn. Hãy tải lại để kiểm tra.', {
      uncertain: true,
    })
  return result
}
export const confirmOrder = (id, body) => dispatch(id, 'confirm', body, confirmSchema)
export const assignOrder = (id, body) => dispatch(id, 'assign', body, assignSchema)
export const reassignOrder = (id, body) => dispatch(id, 'reassign', body, reassignSchema)
