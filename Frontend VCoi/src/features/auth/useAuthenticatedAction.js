import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './context'
import { ApiError } from '../../lib/api'

export default function useAuthenticatedAction(readback, expectedRole) {
  const { user } = useAuth()
  const client = useQueryClient()
  const lock = useRef(false)
  const [busy, setBusy] = useState(false),
    [blocked, setBlocked] = useState(false)
  const [error, setError] = useState(null),
    [notice, setNotice] = useState('')
  const sameSession = () => {
    const current = client.getQueryData(['session'])
    return Boolean(
      user &&
      current &&
      current.id === user.id &&
      current.role === expectedRole &&
      user.role === expectedRole,
    )
  }
  async function run(task, accept, message = 'Đã lưu thay đổi.') {
    if (lock.current || blocked || !sameSession()) return
    lock.current = true
    setBusy(true)
    setError(null)
    setNotice('')
    let committed = false
    try {
      const result = await task()
      committed = true
      if (!sameSession()) return
      await accept?.(result)
      if (sameSession()) setNotice(message)
      return result
    } catch (failure) {
      if (sameSession()) {
        const problem =
          failure instanceof ApiError
            ? failure
            : new ApiError('Chưa thực hiện được thao tác. Vui lòng kiểm tra và thử lại.', {
                uncertain: committed,
              })
        setError(problem)
        setBlocked(Boolean(committed || problem.uncertain || [404, 409].includes(problem.status)))
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
      await readback(sameSession)
      if (sameSession()) {
        setBlocked(false)
        setError(null)
        setNotice('Đã tải lại dữ liệu. Hãy kiểm tra trước khi tiếp tục.')
      }
    } catch {
      if (sameSession()) {
        setBlocked(true)
        setError(new ApiError('Chưa tải lại đủ thông tin. Vui lòng thử lại.'))
      }
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return { busy, blocked, error, notice, run, refresh, sameSession }
}
