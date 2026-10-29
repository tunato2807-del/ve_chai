import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../lib/api'
import { moveCollectorOrder, progressSteps } from './progress-api'

export default function useCollectorProgress({ user, order, reloadOrder }) {
  const client = useQueryClient()
  const inFlight = useRef(false)
  const [busy, setBusy] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [failure, setFailure] = useState(null)
  const [notice, setNotice] = useState('')
  const scope = ['private', user.id, 'COLLECTOR']
  const sameSession = () => {
    const current = client.getQueryData(['session'])
    return current?.id === user.id && current?.role === 'COLLECTOR'
  }
  async function submit({ reason }) {
    if (inFlight.current || blocked || !sameSession()) return
    inFlight.current = true
    setBusy(true)
    setFailure(null)
    setNotice('')
    try {
      if (
        user.role !== 'COLLECTOR' ||
        order.collectorId !== user.id ||
        !progressSteps[order.status]
      )
        throw new ApiError('Đơn đã thay đổi. Hãy tải lại tiến độ trước khi tiếp tục.', {
          status: 409,
        })
      const result = await moveCollectorOrder(order, reason)
      const detailKey = [...scope, 'order', String(order.id)]
      await client.cancelQueries({ queryKey: detailKey, exact: true })
      if (!sameSession()) return
      client.setQueryData(detailKey, result)
      await client.invalidateQueries({ queryKey: [...scope, 'orders'] })
      if (sameSession())
        setNotice(
          result.status === 'EN_ROUTE'
            ? 'Đã ghi nhận khởi hành. Hãy xác nhận khi bạn đến điểm thu gom.'
            : 'Đã ghi nhận bạn đến điểm thu gom.',
        )
    } catch (error) {
      if (!sameSession()) return
      setFailure(
        error instanceof ApiError
          ? error
          : new ApiError('Chưa cập nhật được tiến độ. Hãy tải lại đơn để kiểm tra.'),
      )
      setBlocked(error.uncertain || [404, 409].includes(error.status))
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  async function refresh() {
    if (inFlight.current || !sameSession()) return
    inFlight.current = true
    setBusy(true)
    try {
      const fresh = await reloadOrder({ throwOnError: true })
      if (!sameSession()) return
      if (fresh.data?.id !== order.id || fresh.data.collectorId !== user.id)
        throw new ApiError(
          'Đơn không còn thuộc phân công của bạn. Vui lòng quay về danh sách đơn.',
          { status: 404 },
        )
      setBlocked(false)
      setFailure(null)
      setNotice('Đã tải lại tiến độ. Hãy kiểm tra trạng thái trước khi tiếp tục.')
    } catch {
      if (sameSession()) {
        setBlocked(true)
        setFailure(new ApiError('Chưa tải lại được đơn. Vui lòng kiểm tra kết nối và thử lại.'))
      }
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return { busy, blocked, failure, notice, submit, refresh }
}
