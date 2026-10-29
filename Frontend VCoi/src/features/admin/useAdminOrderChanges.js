import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/context'
import { ApiError } from '../../lib/api'
import { listAdminChanges, loadChangeContext, reviewAdminChange } from './order-changes-api'

export default function useAdminOrderChanges(filters) {
  const { user } = useAuth(),
    client = useQueryClient(),
    lock = useRef(false)
  const scope = ['private', user.id, 'ADMIN'],
    listKey = [...scope, 'order-changes']
  const rows = useQuery({
    queryKey: [...listKey, filters],
    queryFn: ({ signal }) => listAdminChanges({ ...filters, signal }),
    retry: false,
    staleTime: 0,
  })
  const [selected, setSelected] = useState(null),
    [action, setAction] = useState(null),
    [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false),
    [blocked, setBlocked] = useState(false),
    [failure, setFailure] = useState(null)
  const sameSession = () => {
    const current = client.getQueryData(['session'])
    return current?.id === user.id && current?.role === 'ADMIN' && current?.status === 'ACTIVE'
  }
  async function execute(work, { writing = false, recovery = false } = {}) {
    if (lock.current || (!recovery && blocked) || !sameSession()) return
    lock.current = true
    setBusy(true)
    setFailure(null)
    try {
      await work()
    } catch (error) {
      if (sameSession()) {
        const problem =
          error instanceof ApiError
            ? error
            : new ApiError('Chưa thực hiện được thao tác. Hãy tải lại danh sách.', {
                uncertain: writing,
              })
        setFailure(problem)
        setBlocked(
          Boolean(recovery || problem.uncertain || [400, 404, 409].includes(problem.status)),
        )
      }
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  async function invalidate(orderId) {
    const keys = [
      listKey,
      [...scope, 'order', String(orderId)],
      [...scope, 'orders'],
      [...scope, 'order-counts'],
    ]
    await Promise.all(keys.map((queryKey) => client.cancelQueries({ queryKey })))
    if (!sameSession()) return
    await Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })))
  }
  function open(row) {
    return execute(async () => {
      const context = await loadChangeContext(row, filters)
      if (!sameSession()) return
      setSelected(context)
      setAction(null)
      setResult(null)
    })
  }
  function choose(next) {
    if (!busy && !blocked && sameSession()) setAction(next)
  }
  function submit(values) {
    if (!selected || !action) return
    return execute(
      async () => {
        const official = await reviewAdminChange(selected, action, values, user.id)
        if (!sameSession()) return
        setResult(official)
        setSelected(null)
        setAction(null)
        await invalidate(official.orderId)
      },
      { writing: true },
    )
  }
  function refresh() {
    return execute(
      async () => {
        await rows.refetch({ throwOnError: true })
        if (!sameSession()) return
        if (selected) await invalidate(selected.order.id)
        if (!sameSession()) return
        setSelected(null)
        setAction(null)
        setBlocked(false)
      },
      { recovery: true },
    )
  }
  return {
    rows,
    selected,
    action,
    result,
    busy,
    blocked,
    failure,
    open,
    choose,
    submit,
    refresh,
    close: () => {
      if (!lock.current) {
        setSelected(null)
        setAction(null)
        setResult(null)
      }
    },
  }
}
