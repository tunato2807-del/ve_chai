import { ApiError } from '../../lib/api'
import { getWeighings } from '../orders/weighing-api'

export async function readAdminWeighings(order, { signal } = {}) {
  const result = await getWeighings(order, { signal, role: 'ADMIN' })
  if (result.orderVersion !== order.version)
    throw new ApiError('Đơn và kết quả cân vừa thay đổi. Hãy tải lại hồ sơ.', { status: 409 })
  return result
}
