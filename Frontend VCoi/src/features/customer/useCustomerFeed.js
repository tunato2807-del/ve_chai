import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useCustomerOrder from './useCustomerOrder'
import { readOrderFeed } from './order-read-api'

export default function useCustomerFeed(kind, order, enabled = true) {
  const cache = useCustomerOrder(order),
    [page, setPage] = useState(0)
  const key = (current) => [...cache.scope, kind, String(order.id), current.version, page]
  const query = useQuery({
    queryKey: key(order),
    queryFn: ({ signal }) => readOrderFeed(kind, order, { page, signal }),
    retry: false,
    staleTime: 0,
    enabled,
  })
  async function refresh() {
    const fresh = await cache.read()
    const result = await readOrderFeed(kind, fresh, { page })
    if (!cache.sameSession()) return
    await cache.client.cancelQueries({ queryKey: key(fresh), exact: true })
    if (!cache.sameSession()) return
    cache.client.setQueryData(key(fresh), result)
  }
  return { ...cache, query, page, setPage, refresh }
}
