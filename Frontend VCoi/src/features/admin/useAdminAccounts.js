import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/context'
import { ApiError } from '../../lib/api'
import { listAccounts, readAccount, createCollector, changeAccountStatus } from './accounts-api'

export default function useAdminAccounts(page) {
  const { user } = useAuth(),
    client = useQueryClient(),
    lock = useRef(false)
  const scope = ['private', user.id, 'ADMIN', 'accounts'],
    collectors = ['private', user.id, 'ADMIN', 'collectors']
  const rows = useQuery({
    queryKey: [...scope, page],
    queryFn: ({ signal }) => listAccounts({ page, signal }),
    retry: false,
    staleTime: 0,
  })
  const [creating, setCreating] = useState(false),
    [change, setChange] = useState(null)
  const [busy, setBusy] = useState(false),
    [blocked, setBlocked] = useState(false)
  const [failure, setFailure] = useState(null),
    [notice, setNotice] = useState('')
  const sameSession = () => {
    const actor = client.getQueryData(['session'])
    return actor?.id === user.id && actor?.role === 'ADMIN' && actor?.status === 'ACTIVE'
  }
  async function execute(
    work,
    { writing = false, recovery = false, duplicateEditable = false } = {},
  ) {
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
        setBlocked(
          Boolean(
            recovery ||
            problem.uncertain ||
            problem.status === 404 ||
            (problem.status === 409 && !duplicateEditable),
          ),
        )
      }
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  async function invalidate() {
    await Promise.all([
      client.cancelQueries({ queryKey: scope }),
      client.cancelQueries({ queryKey: collectors }),
    ])
    if (!sameSession()) return
    await Promise.all([
      client.invalidateQueries({ queryKey: scope }),
      client.invalidateQueries({ queryKey: collectors }),
    ])
  }
  function openCreate() {
    if (busy || blocked || !sameSession()) return
    setFailure(null)
    setNotice('')
    setChange(null)
    setCreating(true)
  }
  function openStatus(row) {
    if (row.role === 'ADMIN') return
    return execute(async () => {
      const target = row.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE',
        fresh = await readAccount(row.id, page)
      if (!sameSession()) return
      if (fresh.role === 'ADMIN')
        throw new ApiError('Không thay đổi trạng thái tài khoản ADMIN.', { status: 409 })
      if (fresh.status === target) {
        await invalidate()
        if (sameSession())
          setNotice('Trạng thái đích đã được cập nhật trước đó. Danh sách đã được tải lại.')
        return
      }
      setCreating(false)
      setChange({ account: fresh, target, page })
    })
  }
  function create(values) {
    if (!creating) return
    return execute(
      async () => {
        const result = await createCollector(values)
        if (!sameSession()) return
        setCreating(false)
        setNotice(`Đã tạo nhân viên ${result.fullName} (#${result.id}).`)
        await invalidate()
      },
      { writing: true, duplicateEditable: true },
    )
  }
  function confirm() {
    if (!change) return
    return execute(
      async () => {
        const result = await changeAccountStatus(change.account, change.target, change.page)
        if (!sameSession()) return
        setChange(null)
        setNotice(
          `Đã ${result.status === 'LOCKED' ? 'khóa' : 'mở khóa'} tài khoản ${result.fullName} (#${result.id}).`,
        )
        await invalidate()
      },
      { writing: true },
    )
  }
  function refresh() {
    return execute(
      async () => {
        await rows.refetch({ throwOnError: true })
        await client.cancelQueries({ queryKey: collectors })
        if (!sameSession()) return
        await client.invalidateQueries({ queryKey: collectors })
        if (!sameSession()) return
        setCreating(false)
        setChange(null)
        setBlocked(false)
        setNotice('Đã tải lại dữ liệu. Hãy kiểm tra tài khoản trước khi tiếp tục.')
      },
      { recovery: true },
    )
  }
  return {
    rows,
    creating,
    change,
    busy,
    blocked,
    failure,
    notice,
    openCreate,
    openStatus,
    create,
    confirm,
    refresh,
    close: () => {
      if (!lock.current) {
        setCreating(false)
        setChange(null)
      }
    },
  }
}
