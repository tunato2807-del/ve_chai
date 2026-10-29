import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/context'
import { getOrder } from '../orders/api'
import { ApiError } from '../../lib/api'

export default function useCustomerOrder(order) {
  const { user } = useAuth(),
    client = useQueryClient()
  const scope = ['private', user.id, 'CUSTOMER']
  const key = [...scope, 'order', String(order.id)]
  const sameSession = () =>
    client.getQueryData(['session'])?.id === user.id &&
    client.getQueryData(['session'])?.role === 'CUSTOMER'
  async function commit(result) {
    await client.cancelQueries({ queryKey: scope })
    if (!sameSession()) return
    const next =
      result.order ||
      (result.items && result.id === order.id
        ? result
        : { ...order, status: result.orderStatus, version: result.orderVersion })
    if (next.id !== order.id || !Number.isInteger(next.version) || !next.status)
      throw new ApiError('Thông tin đơn chưa khớp.', { uncertain: true })
    if ((client.getQueryData(key)?.version ?? 0) <= next.version) client.setQueryData(key, next)
    await client.invalidateQueries({ queryKey: scope })
  }
  async function read() {
    const fresh = await getOrder({ role: 'CUSTOMER', id: order.id })
    await client.cancelQueries({ queryKey: key, exact: true })
    if (!sameSession()) throw new ApiError('Phiên đăng nhập đã thay đổi.')
    if (fresh.id !== order.id || (client.getQueryData(key)?.version ?? 0) > fresh.version)
      throw new ApiError('Đơn vừa thay đổi. Hãy tải lại.', { status: 409 })
    client.setQueryData(key, fresh)
    return fresh
  }
  return { user, client, scope, key, read, commit, sameSession }
}
