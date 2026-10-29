import { apiRequest } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { roleConfig } from '../auth/roles'
import { orderPageSchema, orderSchema } from './model'
import { getCurrentPrices } from '../../lib/catalog'

export async function getOrders({ role, page = 0, signal }) {
  return parseApi(
    orderPageSchema,
    await apiRequest(`${roleConfig[role].ordersApi}?page=${page}&size=10`, { signal }),
  )
}
export async function getOrder({ role, id, signal }) {
  return parseApi(orderSchema, await apiRequest(`${roleConfig[role].ordersApi}/${id}`, { signal }))
}
export async function createOrder(body) {
  return parseApi(
    orderSchema,
    await apiRequest('/api/customer/orders', { method: 'POST', body }),
    true,
  )
}
export async function getBookingMaterials({ signal }) {
  const materials = []
  let page = 0
  let totalPages
  do {
    const result = await getCurrentPrices({ page, signal })
    totalPages = result.totalPages
    if (totalPages > 1000) throw new Error('Danh sách vật liệu quá lớn. Vui lòng liên hệ đại lý.')
    materials.push(...result.data)
    page += 1
  } while (page < totalPages)
  return materials
}
