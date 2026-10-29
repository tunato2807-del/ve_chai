import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiError } from '../../lib/api'
import { canRecordPayment, getPaymentContext, preparePayment, simulatePayment } from './payment-api'
import usePaymentCache from './usePaymentCache'

export default function useCollectorPayment({ user, order, reloadOrder }) {
  const cache = usePaymentCache(user, order, reloadOrder)
  const lock = useRef(false)
  const [busy, setBusy] = useState(false),
    [blocked, setBlocked] = useState(false)
  const [failure, setFailure] = useState(null),
    [notice, setNotice] = useState('')
  const [draft, setDraft] = useState(null),
    [confirmed, setConfirmed] = useState(null)
  const context = useQuery({
    queryKey: cache.key(order.version),
    queryFn: ({ signal }) => getPaymentContext(order, { signal }),
    retry: false,
    staleTime: 0,
  })
  const eligible = context.isSuccess && canRecordPayment({ ...context.data, order, user })
  const stale = Boolean(
    draft &&
    (!eligible ||
      draft.order.version !== order.version ||
      draft.quote.id !== context.data?.quote?.id ||
      draft.quote.version !== context.data?.quote?.version),
  )
  async function execute(work, recovery = false, writing = false) {
    if (lock.current || (!recovery && blocked) || !cache.sameSession()) return
    lock.current = true
    setBusy(true)
    setFailure(null)
    setNotice('')
    try {
      await work()
    } catch (error) {
      if (cache.sameSession()) {
        const problem =
          error instanceof ApiError
            ? error
            : new ApiError('Chưa thực hiện được thao tác. Hãy tải lại thanh toán.', {
                uncertain: writing,
              })
        setFailure(problem)
        setBlocked(Boolean(recovery || problem.uncertain || [404, 409].includes(problem.status)))
      }
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  function preview() {
    return execute(async () => {
      const fresh = await preparePayment(order.id, user)
      if (!(await cache.apply(fresh))) return
      setDraft({ ...fresh, user, method: 'CASH_SIMULATED', requestKey: crypto.randomUUID() })
    })
  }
  function submit() {
    if (!draft || stale) return
    return execute(
      async () => {
        const current = cache.client.getQueryData(cache.detailKey)
        if (
          current?.version !== draft.order.version ||
          !canRecordPayment({ ...draft, order: current })
        )
          throw new ApiError('Đơn đã thay đổi. Hãy tải lại trước khi xác nhận.', { status: 409 })
        const result = await simulatePayment(draft)
        if (!cache.sameSession()) return
        setConfirmed(result)
        setDraft(null)
        try {
          await cache.commit(draft, result)
        } catch {
          throw new ApiError(
            'Khoản chi đã được phản hồi nhưng dữ liệu chưa đồng bộ. Hãy tải lại.',
            { uncertain: true },
          )
        }
        if (cache.sameSession()) setNotice('Đã ghi nhận khoản chi mô phỏng và hoàn tất đơn.')
      },
      false,
      true,
    )
  }
  function refresh() {
    return execute(async () => {
      if (!(await cache.read())) return
      setDraft(null)
      setConfirmed(null)
      setBlocked(false)
      setNotice('Đã tải lại đơn, báo giá và thanh toán. Hãy kiểm tra trước khi tiếp tục.')
    }, true)
  }
  function changeMethod(method) {
    if (!busy && !blocked) setDraft({ ...draft, method, requestKey: crypto.randomUUID() })
  }
  const records = confirmed
    ? [confirmed, ...(context.data?.payments || []).filter((row) => row.id !== confirmed.id)]
    : context.data?.payments || []
  return {
    context,
    busy,
    blocked,
    failure,
    notice,
    draft,
    records,
    eligible,
    stale,
    preview,
    submit,
    refresh,
    changeMethod,
    close: () => setDraft(null),
  }
}
