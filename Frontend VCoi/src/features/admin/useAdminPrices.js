import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/context'
import { ApiError } from '../../lib/api'
import { listPrices, getMaterialOptions, getPrice, savePriceDraft, reviewPrice } from './prices-api'

export default function useAdminPrices(filters) {
  const { user } = useAuth(),
    client = useQueryClient(),
    lock = useRef(false)
  const scope = ['private', user.id, 'ADMIN', 'prices']
  const [panel, setPanel] = useState(null),
    [busy, setBusy] = useState(false)
  const [blocked, setBlocked] = useState(false),
    [failure, setFailure] = useState(null),
    [notice, setNotice] = useState('')
  const rows = useQuery({
    queryKey: [...scope, 'list', filters],
    queryFn: ({ signal }) => listPrices({ ...filters, signal }),
    retry: false,
    staleTime: 0,
  })
  const options = useQuery({
    queryKey: [...scope, 'materials'],
    queryFn: getMaterialOptions,
    retry: false,
    staleTime: 0,
  })
  const history = useQuery({
    queryKey: [...scope, 'history', panel?.materialId, panel?.page],
    queryFn: ({ signal }) =>
      listPrices({ materialId: String(panel.materialId), page: panel.page, history: true, signal }),
    enabled: panel?.kind === 'history',
    retry: false,
    staleTime: 0,
  })
  const sameSession = () => {
    const actor = client.getQueryData(['session'])
    return actor?.id === user.id && actor?.role === 'ADMIN'
  }
  async function execute(work, { writing = false, recovery = false } = {}) {
    if (lock.current || (!recovery && blocked) || !sameSession()) return
    lock.current = true
    setBusy(true)
    setFailure(null)
    setNotice('')
    try {
      await work()
    } catch (error) {
      if (sameSession()) {
        const problem =
          error instanceof ApiError
            ? error
            : new ApiError('Chưa thực hiện được thao tác. Hãy tải lại dữ liệu.', {
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
  async function invalidate() {
    await client.cancelQueries({ queryKey: scope })
    if (!sameSession()) return
    await Promise.all([
      client.invalidateQueries({ queryKey: scope }),
      ...['current-prices', 'booking-materials'].map((key) =>
        client.invalidateQueries({ queryKey: [key] }),
      ),
    ])
  }
  function openNew() {
    if (busy || blocked || !sameSession()) return
    setFailure(null)
    setNotice('')
    setPanel({ kind: 'edit', row: null })
  }
  function open(row, kind = 'detail', action) {
    return execute(async () => {
      const fresh = await getPrice(row.id)
      if (!sameSession()) return
      if (kind !== 'detail' && fresh.approvalStatus !== 'DRAFT')
        throw new ApiError('Phiên bản này không còn là giá nháp. Hãy tải lại danh sách.', {
          status: 409,
        })
      setPanel({ kind, row: fresh, action })
    })
  }
  function openHistory(materialId, name) {
    if (busy || blocked || !sameSession()) return
    setFailure(null)
    setNotice('')
    setPanel({ kind: 'history', materialId, name, page: 0 })
  }
  function save(values) {
    if (panel?.kind !== 'edit') return
    return execute(
      async () => {
        const result = await savePriceDraft(panel.row, values)
        if (!sameSession()) return
        setPanel({ kind: 'detail', row: result })
        setNotice(
          'Đã lưu giá nháp. Giá công khai chỉ thay đổi sau khi được duyệt và đến thời gian hiệu lực.',
        )
        await invalidate()
      },
      { writing: true },
    )
  }
  function confirm() {
    if (panel?.kind !== 'review') return
    return execute(
      async () => {
        const result = await reviewPrice(panel.row, panel.action)
        if (!sameSession()) return
        setPanel({ kind: 'detail', row: result })
        setNotice(
          result.approvalStatus === 'APPROVED'
            ? 'Đã duyệt phiên bản giá.'
            : 'Đã từ chối phiên bản giá.',
        )
        await invalidate()
      },
      { writing: true },
    )
  }
  function refresh() {
    return execute(
      async () => {
        await Promise.all([
          rows.refetch({ throwOnError: true }),
          options.refetch({ throwOnError: true }),
          ...(panel?.kind === 'history' ? [history.refetch({ throwOnError: true })] : []),
        ])
        if (!sameSession()) return
        setPanel(null)
        setBlocked(false)
        setNotice('Đã tải lại dữ liệu. Hãy kiểm tra phiên bản mới nhất trước khi tiếp tục.')
      },
      { recovery: true },
    )
  }
  return {
    rows,
    options,
    history,
    panel,
    busy,
    blocked,
    failure,
    notice,
    openNew,
    open,
    openHistory,
    save,
    confirm,
    refresh,
    close: () => {
      if (!lock.current) setPanel(null)
    },
    historyPage: (page) => {
      if (!lock.current && sameSession()) setPanel((current) => ({ ...current, page }))
    },
  }
}
