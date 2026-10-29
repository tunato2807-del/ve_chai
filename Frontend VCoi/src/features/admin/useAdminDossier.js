import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/context'
import { readAdminWeighings } from './order-dossier-api'
import { getQuotes } from '../orders/quotation-api'
import { getPaymentContext } from '../orders/payment-api'
import { readTimeline } from '../orders/history-api'

export default function useAdminDossier(order, selected, page, reloadOrder) {
  const { user } = useAuth()
  const client = useQueryClient()
  const kind = selected === 'photos' ? 'weighings' : selected
  const key = [
    'private',
    user?.id,
    'ADMIN',
    'order-dossier',
    String(order.id),
    order.version,
    kind,
    page,
  ]
  const operation = key.join('|')
  const [action, setAction] = useState(null)
  const allowed = user?.role === 'ADMIN' && user.status === 'ACTIVE'
  const query = useQuery({
    queryKey: key,
    enabled: allowed,
    retry: false,
    staleTime: 0,
    queryFn: ({ signal }) => {
      if (kind === 'weighings') return readAdminWeighings(order, { signal })
      if (kind === 'quotes') return getQuotes(order, { signal, role: 'ADMIN' })
      if (kind === 'payments') return getPaymentContext(order, { signal, role: 'ADMIN' })
      return readTimeline(order, { signal, page, role: 'ADMIN' })
    },
  })
  const sameSession = () => {
    const actor = client.getQueryData(['session'])
    return actor?.id === user?.id && actor?.role === 'ADMIN'
  }
  async function refresh() {
    if (!allowed || query.isFetching || (action?.operation === operation && action.busy)) return
    setAction({ operation, busy: true, error: null })
    try {
      const fresh = (await reloadOrder({ throwOnError: true })).data
      if (!sameSession() || fresh?.id !== order.id) return
      // A new parent revision gets its own query; never refetch it under the old revision key.
      if (fresh.version === order.version) await query.refetch({ throwOnError: true })
    } catch (error) {
      if (sameSession()) setAction({ operation, busy: false, error })
    } finally {
      setAction((current) =>
        current?.operation === operation ? { ...current, busy: false } : current,
      )
    }
  }
  return {
    allowed,
    query,
    refresh,
    busy: query.isFetching || (action?.operation === operation && action.busy),
    error: query.error || (action?.operation === operation ? action.error : null),
  }
}
