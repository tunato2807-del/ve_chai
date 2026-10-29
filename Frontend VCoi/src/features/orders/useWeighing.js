import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../lib/api'
import { getWeighings, recordWeighings } from './weighing-api'
import { getQuotes } from './quotation-api'
import { uploadWeighingPhoto } from './weighing-photo-api'

export default function useWeighing({ user, order, reloadOrder }) {
  const client = useQueryClient()
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [failure, setFailure] = useState(null)
  const [notice, setNotice] = useState('')
  const scope = ['private', user.id, 'COLLECTOR']
  const historyKey = [...scope, 'weighings', String(order.id)]
  const quoteKey = (version) => [...scope, 'quotes', String(order.id), version]
  const history = useQuery({
    queryKey: historyKey,
    queryFn: ({ signal }) => getWeighings(order, { signal }),
    retry: false,
    staleTime: 0,
  })
  const quotes = useQuery({
    queryKey: quoteKey(order.version),
    queryFn: ({ signal }) => getQuotes(order, { signal }),
    enabled: Boolean(history.data?.records.length),
    retry: false,
    staleTime: 0,
  })
  const sameSession = () => {
    const session = client.getQueryData(['session'])
    return session?.id === user.id && session?.role === 'COLLECTOR'
  }
  const synced = history.data?.orderVersion === order.version
  async function uploadPhoto(rowId, file) {
    if (
      lock.current ||
      blocked ||
      !synced ||
      !sameSession() ||
      quotes.isPending ||
      quotes.isError ||
      quotes.isFetching
    )
      return
    lock.current = true
    setBusy(true)
    setFailure(null)
    setNotice('')
    try {
      const result = await uploadWeighingPhoto(order, history.data, quotes.data, rowId, file)
      const detailKey = [...scope, 'order', String(order.id)]
      await Promise.all([
        client.cancelQueries({ queryKey: detailKey, exact: true }),
        client.cancelQueries({ queryKey: historyKey, exact: true }),
      ])
      if (!sameSession()) return
      if ((client.getQueryData(detailKey)?.version ?? order.version) > result.orderVersion)
        throw new ApiError('Đơn đã thay đổi sau khi tải ảnh. Hãy tải lại để đối chiếu.', {
          status: 409,
        })
      client.setQueryData(detailKey, { ...order, version: result.orderVersion })
      client.setQueryData(historyKey, {
        ...history.data,
        orderVersion: result.orderVersion,
        records: history.data.records.map((row) =>
          row.id === rowId ? { ...row, photoUrl: result.url } : row,
        ),
      })
      await client.invalidateQueries({ queryKey: [...scope, 'orders'] })
      if (sameSession()) setNotice('Đã lưu ảnh phiếu cân. Ảnh được bảo vệ theo quyền với đơn.')
    } catch (error) {
      if (!sameSession()) return
      setFailure(
        error instanceof ApiError
          ? error
          : new ApiError('Chưa tải được ảnh. Hãy tải lại đơn để kiểm tra.'),
      )
      setBlocked(Boolean(error.uncertain || [404, 409].includes(error.status)))
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  async function submit(values) {
    if (lock.current || blocked || !synced || !sameSession()) return
    lock.current = true
    setBusy(true)
    setFailure(null)
    setNotice('')
    try {
      const result = await recordWeighings(order, history.data, values)
      const detailKey = [...scope, 'order', String(order.id)]
      await Promise.all([
        client.cancelQueries({ queryKey: detailKey, exact: true }),
        client.cancelQueries({ queryKey: historyKey, exact: true }),
      ])
      if (!sameSession()) return
      if ((client.getQueryData(detailKey)?.version ?? order.version) > result.orderVersion)
        throw new ApiError('Đơn đã thay đổi. Hãy tải lại để đối chiếu kết quả cân.', {
          status: 409,
        })
      // The weighing endpoint confirms ARRIVED and returns the new order version.
      client.setQueryData(detailKey, { ...order, version: result.orderVersion })
      client.setQueryData(historyKey, result)
      await client.invalidateQueries({ queryKey: [...scope, 'orders'] })
      if (sameSession()) setNotice('Đã lưu kết quả cân thực tế. Lịch sử trước đó được giữ nguyên.')
    } catch (error) {
      if (!sameSession()) return
      setFailure(
        error instanceof ApiError
          ? error
          : new ApiError('Chưa lưu được kết quả cân. Hãy kiểm tra thông tin và tải lại.'),
      )
      setBlocked(Boolean(error.uncertain || [404, 409].includes(error.status)))
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
      await client.cancelQueries({ queryKey: historyKey, exact: true })
      const fresh = (await reloadOrder({ throwOnError: true })).data
      if (!sameSession()) return
      if (fresh?.id !== order.id || fresh.collectorId !== user.id || fresh.status !== 'ARRIVED')
        throw new ApiError('Đơn không còn phù hợp để nhập cân.', { status: 409 })
      const records = await getWeighings(fresh)
      if (!sameSession()) return
      if (records.orderVersion !== fresh.version)
        throw new ApiError('Đơn vẫn đang thay đổi. Hãy tải lại lần nữa.', { status: 409 })
      const rows = records.records.length ? await getQuotes(fresh) : []
      if (!sameSession()) return
      if (
        (client.getQueryData([...scope, 'order', String(order.id)])?.version ?? fresh.version) >
        fresh.version
      )
        throw new ApiError('Đơn vẫn đang thay đổi.', { status: 409 })
      client.setQueryData(historyKey, records)
      client.setQueryData(quoteKey(fresh.version), rows)
      setBlocked(false)
      setFailure(null)
      setNotice('Đã tải lại đơn và lịch sử. Hãy kiểm tra trước khi lưu.')
    } catch {
      if (sameSession()) {
        setBlocked(true)
        setFailure(new ApiError('Chưa tải lại đủ đơn và lịch sử cân. Vui lòng thử lại.'))
      }
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return { history, quotes, busy, blocked, failure, notice, synced, submit, refresh, uploadPhoto }
}
