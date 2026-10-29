import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../lib/api'
import { getQuotes, prepareQuote, sendQuote } from './quotation-api'

export default function useQuotation({ user, order, reloadOrder }) {
  const client = useQueryClient()
  const lock = useRef(false)
  const [busy, setBusy] = useState(false),
    [blocked, setBlocked] = useState(false)
  const [failure, setFailure] = useState(null),
    [notice, setNotice] = useState('')
  const [draft, setDraft] = useState(null),
    [sent, setSent] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])
  const scope = ['private', user.id, 'COLLECTOR']
  const detailKey = [...scope, 'order', String(order.id)]
  const quoteKey = (version) => [...scope, 'quotes', String(order.id), version]
  const quotes = useQuery({
    queryKey: quoteKey(order.version),
    queryFn: ({ signal }) => getQuotes(order, { signal }),
    retry: false,
    staleTime: 0,
  })
  const sameSession = () => {
    const session = client.getQueryData(['session'])
    return session?.id === user.id && session?.role === 'COLLECTOR'
  }
  const fail = (error) =>
    setFailure(
      error instanceof ApiError
        ? error
        : new ApiError('Chưa tải hoặc gửi được báo giá. Vui lòng kiểm tra kết nối và thử lại.'),
    )
  async function preview() {
    if (lock.current || blocked || !sameSession()) return
    lock.current = true
    setBusy(true)
    setFailure(null)
    setNotice('')
    setDraft(null)
    try {
      const fresh = await prepareQuote(order.id)
      await Promise.all([
        client.cancelQueries({ queryKey: detailKey, exact: true }),
        client.cancelQueries({ queryKey: [...scope, 'weighings', String(order.id)], exact: true }),
      ])
      if (!sameSession()) return
      if (
        fresh.order.collectorId !== user.id ||
        (client.getQueryData(detailKey)?.version ?? order.version) > fresh.order.version
      )
        throw new ApiError('Kết quả cân đã được cập nhật trong lúc tải. Hãy xem trước lại.', {
          status: 409,
        })
      client.setQueryData(detailKey, fresh.order)
      client.setQueryData([...scope, 'weighings', String(order.id)], fresh.weights)
      client.setQueryData(quoteKey(fresh.order.version), fresh.quotes)
      setDraft(fresh)
    } catch (error) {
      if (sameSession()) fail(error)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  async function submit() {
    if (lock.current || blocked || !draft || !sameSession()) return
    lock.current = true
    setBusy(true)
    setFailure(null)
    setNotice('')
    try {
      const current = client.getQueryData(detailKey)
      if (
        !draft.ready ||
        current?.version !== draft.order.version ||
        current.collectorId !== user.id ||
        current.status !== draft.order.status
      )
        throw new ApiError('Đơn hoặc kết quả cân đã đổi. Hãy tải lại và xem trước báo giá.', {
          status: 409,
        })
      const result = await sendQuote(draft)
      await client.cancelQueries({ queryKey: detailKey, exact: true })
      if (!sameSession()) return
      if ((client.getQueryData(detailKey)?.version ?? 0) <= result.orderVersion)
        client.setQueryData(detailKey, {
          ...draft.order,
          status: result.orderStatus,
          version: result.orderVersion,
        })
      setSent(result)
      setDraft(null)
      setNotice('Đã gửi báo giá cho khách duyệt.')
      await Promise.all([
        client.invalidateQueries({ queryKey: [...scope, 'orders'] }),
        client.invalidateQueries({ queryKey: [...scope, 'quotes', String(order.id)] }),
      ])
    } catch (error) {
      if (sameSession()) {
        fail(error)
        setBlocked(Boolean(error.uncertain || [404, 409].includes(error.status)))
      }
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  async function refresh() {
    if (lock.current || !sameSession()) return
    lock.current = true
    setBusy(true)
    try {
      const fresh = (await reloadOrder({ throwOnError: true })).data
      if (!sameSession()) return
      if (fresh?.id !== order.id || fresh.collectorId !== user.id)
        throw new ApiError('Đơn không còn trong phân công của bạn.', { status: 404 })
      const rows = await getQuotes(fresh)
      await client.cancelQueries({ queryKey: quoteKey(fresh.version), exact: true })
      if (!sameSession()) return
      if ((client.getQueryData(detailKey)?.version ?? 0) > fresh.version)
        throw new ApiError('Đơn vẫn đang thay đổi.', { status: 409 })
      client.setQueryData(quoteKey(fresh.version), rows)
      setDraft(null)
      setSent(null)
      setBlocked(false)
      setFailure(null)
      setNow(Date.now())
      setNotice('Đã tải lại đơn và báo giá. Hãy kiểm tra trước khi tiếp tục.')
    } catch {
      if (sameSession()) {
        setBlocked(true)
        setFailure(new ApiError('Chưa tải lại đủ đơn và báo giá. Vui lòng thử lại.'))
      }
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return {
    quotes,
    busy,
    blocked,
    failure,
    notice,
    draft,
    sent,
    now,
    preview,
    submit,
    refresh,
    closeDraft: () => setDraft(null),
  }
}
