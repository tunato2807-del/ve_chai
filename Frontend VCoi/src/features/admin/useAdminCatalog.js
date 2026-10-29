import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/context'
import { ApiError } from '../../lib/api'
import { catalogConfig } from './catalog-model'
import {
  listCatalog,
  getCategoryOptions,
  getCatalogItem,
  saveCatalogItem,
  setCatalogStatus,
} from './catalog-api'

export default function useAdminCatalog(kind, filters) {
  const { user } = useAuth(),
    client = useQueryClient(),
    lock = useRef(false)
  const scope = ['private', user.id, 'ADMIN', 'catalog'],
    meta = catalogConfig[kind]
  const rows = useQuery({
    queryKey: [...scope, kind, filters],
    queryFn: ({ signal }) => listCatalog(kind, { ...filters, signal }),
    retry: false,
    staleTime: 0,
  })
  const options = useQuery({
    queryKey: [...scope, 'category-options'],
    queryFn: getCategoryOptions,
    enabled: kind === 'materials',
    retry: false,
    staleTime: 0,
  })
  const [editor, setEditor] = useState(null),
    [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false),
    [blocked, setBlocked] = useState(false)
  const [failure, setFailure] = useState(null),
    [notice, setNotice] = useState('')
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
            : new ApiError('Chưa thực hiện được thao tác. Hãy tải lại danh sách.', {
                uncertain: writing,
              })
        setFailure(problem)
        setBlocked(Boolean(recovery || problem.uncertain || problem.status === 404))
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
      ...['material-categories', 'current-prices', 'booking-materials'].map((key) =>
        client.invalidateQueries({ queryKey: [key] }),
      ),
    ])
  }
  function openNew() {
    if (busy || blocked) return
    setFailure(null)
    setNotice('')
    setEditor({ initial: null })
    setStatus(null)
  }
  function openEdit(row) {
    return execute(async () => {
      const fresh = await getCatalogItem(kind, row.id)
      if (sameSession()) {
        setEditor({ initial: fresh })
        setStatus(null)
      }
    })
  }
  function openStatus(row) {
    return execute(async () => {
      const target = !row[meta.field],
        fresh = await getCatalogItem(kind, row.id)
      if (!sameSession()) return
      if (fresh[meta.field] === target) {
        await invalidate()
        if (sameSession())
          setNotice('Trạng thái đã được cập nhật trước đó. Danh sách đã được tải lại.')
        return
      }
      setStatus({ row: fresh, target })
      setEditor(null)
    })
  }
  function save(values) {
    return execute(
      async () => {
        await saveCatalogItem(kind, editor.initial?.id || null, values)
        if (!sameSession()) return
        setEditor(null)
        setNotice(`Đã lưu ${meta.noun}.`)
        await invalidate()
      },
      { writing: true },
    )
  }
  function confirmStatus() {
    return execute(
      async () => {
        await setCatalogStatus(kind, status.row.id, status.target)
        if (!sameSession()) return
        setStatus(null)
        setNotice(`Đã cập nhật trạng thái ${meta.noun}.`)
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
          ...(kind === 'materials' ? [options.refetch({ throwOnError: true })] : []),
        ])
        if (!sameSession()) return
        setEditor(null)
        setStatus(null)
        setBlocked(false)
        setNotice('Đã tải lại dữ liệu. Hãy kiểm tra danh sách trước khi tiếp tục.')
      },
      { recovery: true },
    )
  }
  return {
    rows,
    options,
    editor,
    status,
    busy,
    blocked,
    failure,
    notice,
    openNew,
    openEdit,
    openStatus,
    save,
    confirmStatus,
    refresh,
    close: () => {
      setEditor(null)
      setStatus(null)
    },
  }
}
