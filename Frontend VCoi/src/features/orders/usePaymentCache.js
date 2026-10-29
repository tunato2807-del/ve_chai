import { useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../lib/api'
import { getPaymentContext } from './payment-api'

export default function usePaymentCache(user, order, reloadOrder) {
  const client = useQueryClient()
  const scope = ['private', user.id, 'COLLECTOR']
  const detailKey = [...scope, 'order', String(order.id)]
  const key = (version) => [...scope, 'payment-context', String(order.id), version]
  const sameSession = () => {
    const actor = client.getQueryData(['session'])
    return actor?.id === user.id && actor?.role === 'COLLECTOR'
  }
  async function apply(context) {
    const fresh = context.order
    await Promise.all([
      client.cancelQueries({ queryKey: detailKey, exact: true }),
      client.cancelQueries({ queryKey: key(fresh.version), exact: true }),
    ])
    if (!sameSession()) return false
    if (fresh.id !== order.id || fresh.collectorId !== user.id)
      throw new ApiError('Đơn không còn trong phân công của bạn.', { status: 404 })
    if ((client.getQueryData(detailKey)?.version ?? 0) > fresh.version)
      throw new ApiError('Đơn vừa thay đổi. Hãy tải lại.', { status: 409 })
    client.setQueryData(key(fresh.version), context)
    client.setQueryData(detailKey, fresh)
    return true
  }
  async function read() {
    const fresh = (await reloadOrder({ throwOnError: true })).data
    if (!sameSession()) return null
    if (fresh?.id !== order.id || fresh.collectorId !== user.id)
      throw new ApiError('Đơn không còn trong phân công của bạn.', { status: 404 })
    const context = await getPaymentContext(fresh)
    return (await apply(context)) ? context : null
  }
  async function commit(review, result) {
    const next = { ...review.order, status: result.orderStatus, version: result.orderVersion }
    const quotes = review.quotes.map((quote) => ({
      ...quote,
      orderStatus: next.status,
      orderVersion: next.version,
    }))
    const payments = [result, ...review.payments.filter((row) => row.id !== result.id)].map(
      (row) => ({ ...row, orderStatus: next.status, orderVersion: next.version }),
    )
    if (!(await apply({ order: next, quotes, quote: quotes.find((row) => row.current), payments })))
      return
    await Promise.all([
      client.invalidateQueries({ queryKey: [...scope, 'orders'] }),
      client.invalidateQueries({ queryKey: [...scope, 'quotes', String(order.id)] }),
    ])
  }
  return { client, detailKey, key, sameSession, apply, read, commit }
}
