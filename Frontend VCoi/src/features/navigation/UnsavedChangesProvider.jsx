import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { WarningCircleIcon } from '@phosphor-icons/react/WarningCircle'
import { AuthContext } from '../auth/context'
import { NavigationGuardContext } from './context'
import '../../styles/navigation.css'

export default function UnsavedChangesProvider({ children }) {
  const auth = useContext(AuthContext)
  const owner = auth?.user ? auth.user.role + ':' + auth.user.id : 'public'
  const entries = useRef(new Map())
  const [pending, setPending] = useState(null)
  const [routeLabels, setRouteLabels] = useState([])
  const dirtyEntries = useCallback(
    (ids) =>
      [...entries.current.entries()].filter(
        ([id, entry]) => entry.dirty && entry.owner === owner && (!ids || ids.includes(id)),
      ),
    [owner],
  )
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => {
        const affected = dirtyEntries()
        const blocking =
          affected.length > 0 &&
          (currentLocation.pathname !== nextLocation.pathname ||
            currentLocation.search !== nextLocation.search)
        if (blocking) setRouteLabels(affected.map(([, entry]) => entry.label))
        return blocking
      },
      [dirtyEntries],
    ),
  )
  const value = useMemo(
    () => ({
      owner,
      register(id, entry) {
        entries.current.set(id, entry)
        return () => entries.current.delete(id)
      },
      isDirty(id) {
        return dirtyEntries([id]).length > 0
      },
      clear(id) {
        entries.current.delete(id)
      },
      confirmDiscard(action, ids) {
        const affected = dirtyEntries(ids)
        if (!affected.length) return action()
        setPending({ action, owner, labels: affected.map(([, entry]) => entry.label) })
      },
    }),
    [owner, dirtyEntries],
  )
  const routing = blocker.state === 'blocked'
  const prompt = routing ? { labels: routeLabels } : pending?.owner === owner ? pending : null
  function stay() {
    setPending(null)
    if (routing) blocker.reset()
  }
  function leave() {
    setPending(null)
    if (routing) blocker.proceed()
    else pending?.action()
  }
  // A session ending or an editor completing must never trap the user on a protected page.
  useEffect(() => {
    if (blocker.state === 'blocked' && !dirtyEntries().length) blocker.reset()
  }, [blocker, dirtyEntries])
  return (
    <NavigationGuardContext.Provider value={value}>
      {children}
      {prompt && <LeaveDialog labels={prompt.labels} onStay={stay} onLeave={leave} />}
    </NavigationGuardContext.Provider>
  )
}

function LeaveDialog({ labels, onStay, onLeave }) {
  const dialog = useRef(null),
    stay = useRef(null)
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    stay.current.focus()
    return () => element.close()
  }, [])
  return (
    <dialog
      ref={dialog}
      role="alertdialog"
      className="leave-dialog"
      aria-labelledby="leave-title"
      aria-describedby="leave-description"
      onCancel={(event) => {
        event.preventDefault()
        onStay()
      }}
    >
      <WarningCircleIcon size={30} aria-hidden="true" />
      <h2 id="leave-title">Bạn có thay đổi chưa lưu</h2>
      <p className="leave-form-name">{[...new Set(labels)].join(', ')}</p>
      <p id="leave-description">
        Nội dung chưa được gửi. Nếu rời đi, dữ liệu chưa lưu có thể bị mất.
      </p>
      <div className="leave-actions">
        <button ref={stay} className="button button-primary" type="button" onClick={onStay}>
          Tiếp tục chỉnh sửa
        </button>
        <button className="button button-secondary" type="button" onClick={onLeave}>
          Rời đi
        </button>
      </div>
    </dialog>
  )
}
