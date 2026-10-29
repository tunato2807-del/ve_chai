import { useContext, useEffect, useId, useRef, useState } from 'react'
import { NavigationGuardContext } from './context'

export default function useUnsavedChanges(dirty, label = 'Biểu mẫu') {
  const guard = useContext(NavigationGuardContext)
  const id = useId()
  const [owner] = useState(() => guard?.owner)
  const cleared = useRef(false)
  useEffect(() => {
    cleared.current = false
    return guard?.register(id, { dirty, label, owner })
  }, [guard, id, dirty, label, owner])
  useEffect(() => {
    if (!dirty) return
    const warn = (event) => {
      if (cleared.current || (guard && !guard.isDirty(id))) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, guard, id])
  return {
    clear() {
      cleared.current = true
      guard?.clear(id)
    },
    confirmDiscard(action) {
      if (guard) guard.confirmDiscard(action, [id])
      else action()
    },
  }
}

export function useConfirmDiscard() {
  const guard = useContext(NavigationGuardContext)
  return (action) => (guard ? guard.confirmDiscard(action) : action())
}
