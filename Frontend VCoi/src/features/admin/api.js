import { z } from 'zod'
import { apiRequest } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { orderStatuses, orderSummarySchema } from '../orders/model'

export const adminQueues = [
  { key: 'all', status: '', label: 'Tất cả đơn', metric: 'Tổng đơn thu gom' },
  { key: 'PENDING', status: 'PENDING', label: 'Chờ xác nhận', metric: 'Chờ xác nhận' },
  { key: 'CONFIRMED', status: 'CONFIRMED', label: 'Chờ phân công', metric: 'Chờ phân công' },
  { key: 'ASSIGNED', status: 'ASSIGNED', label: 'Đã phân công', metric: 'Đã phân công' },
]
const pageSchema = z.object({
  data: z.array(
    orderSummarySchema.extend({
      contactName: z.string(),
      contactPhone: z.string(),
      address: z.string(),
      collectorId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable(),
      version: z.number().int().nonnegative(),
    }),
  ),
  page: z.number().int().nonnegative(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})
export function readOrderFilters(params) {
  const status = params.get('status') || ''
  const rawPage = params.get('page') || '0'
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : 0
  return {
    status: Object.hasOwn(orderStatuses, status) ? status : '',
    page: Number.isSafeInteger(page) && page <= 2147483647 ? page : 0,
  }
}
export async function getAdminOrders({ page = 0, status = '', size = 10, signal } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (status) params.set('status', status)
  return parseApi(pageSchema, await apiRequest(`/api/admin/orders?${params}`, { signal }))
}
export async function getAdminCounts({ signal } = {}) {
  const values = await Promise.all(
    adminQueues.map(async ({ key, status }) => {
      const result = await getAdminOrders({ size: 1, status, signal })
      return [key, result.totalElements]
    }),
  )
  return Object.fromEntries(values)
}
