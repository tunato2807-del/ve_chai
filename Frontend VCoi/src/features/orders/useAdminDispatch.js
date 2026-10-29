import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../lib/api'
import { assignOrder, confirmOrder, getCollectors, reassignOrder } from './dispatch-api'

export default function useAdminDispatch({ user, order, reloadOrder }) {
  const client = useQueryClient()
  const locked = useRef(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(null)
  const [blocked, setBlocked] = useState(false)
  const [notice, setNotice] = useState('')
  const [formEpoch, setFormEpoch] = useState(0)
  const scope = ['private', user.id, user.role]
  const collectors = useQuery({
    queryKey: [...scope, 'collectors'],
    queryFn: getCollectors,
    enabled: user.role === 'ADMIN' && (order.status === 'CONFIRMED' || order.collectorId !== null),
    retry: false,
    staleTime: 0,
  })
  function sameSession() {
    const current = client.getQueryData(['session'])
    return current?.id === user.id && current?.role === 'ADMIN'
  }
  async function submit(values) {
    if (locked.current || blocked || user.role !== 'ADMIN' || !sameSession()) return
    locked.current = true
    setBusy(true)
    setFailure(null)
    setNotice('')
    try {
      const action = { PENDING: confirmOrder, CONFIRMED: assignOrder, ASSIGNED: reassignOrder }[
        order.status
      ]
      if (
        !action ||
        (order.status === 'ASSIGNED' ? order.collectorId === null : order.collectorId !== null)
      )
        throw new ApiError('Đơn không còn phù hợp để xác nhận hoặc phân công.', { status: 409 })
      if (
        order.status !== 'PENDING' &&
        (collectors.isFetching ||
          !collectors.data?.some((row) => row.id === values.collectorId) ||
          values.collectorId === order.collectorId)
      )
        throw new ApiError('Hãy tải lại và chọn nhân viên đang hoạt động.', { status: 409 })
      const result = await action(order.id, { ...values, version: order.version })
      const detailKey = [...scope, 'order', String(order.id)]
      await client.cancelQueries({ queryKey: detailKey, exact: true })
      if (!sameSession()) return
      client.setQueryData(detailKey, result)
      await client.invalidateQueries({ queryKey: [...scope, 'orders'] })
      await client.invalidateQueries({ queryKey: [...scope, 'order-counts'] })
      setNotice(
        order.status === 'ASSIGNED'
          ? 'Đã phân công lại thành công. Nhân viên mới phụ trách đơn; lịch hẹn được giữ nguyên.'
          : result.status === 'CONFIRMED'
            ? 'Đã xác nhận đơn. Bạn có thể phân công nhân viên bên dưới.'
            : 'Đã phân công nhân viên thu gom thành công.',
      )
    } catch (error) {
      if (!sameSession()) return
      setFailure(error)
      setBlocked(error.uncertain || [404, 409].includes(error.status))
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  async function refresh() {
    if (locked.current || !sameSession()) return
    locked.current = true
    setBusy(true)
    try {
      const [fresh] = await Promise.all([
        reloadOrder({ throwOnError: true }),
        collectors.refetch({ throwOnError: true }),
      ])
      if (!sameSession()) return
      if (fresh.data?.id !== order.id) throw new ApiError('Chưa tải được đúng đơn.')
      setFormEpoch((value) => value + 1)
      setBlocked(false)
      setFailure(null)
      setNotice('Đã tải lại đơn và nhân viên. Hãy kiểm tra thông tin trước khi tiếp tục.')
    } catch {
      if (!sameSession()) return
      setBlocked(true)
      setFailure(new ApiError('Chưa tải lại đủ dữ liệu. Vui lòng kiểm tra kết nối và thử lại.'))
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  return { collectors, busy, failure, blocked, notice, submit, refresh, formEpoch }
}
