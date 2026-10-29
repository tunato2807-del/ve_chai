import { useContext, useEffect, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AuthContext } from '../auth/context'

export default function useListSearchParams() {
  const auth = useContext(AuthContext),
    client = useQueryClient()
  const location = useLocation(),
    [params, setParams] = useSearchParams()
  const user = auth?.user
  const key = useMemo(
    () =>
      user
        ? ['private', user.id, user.role, 'list-location', location.pathname]
        : ['public-list-location', location.pathname],
    [user, location.pathname],
  )
  const remembered = client.getQueryData(key)
  const restoring = !location.search && !location.state?.listExplicit && Boolean(remembered)
  useEffect(() => {
    client.setQueryDefaults(key, { gcTime: Infinity })
    if (restoring) setParams(remembered, { replace: true, state: location.state })
    else client.setQueryData(key, location.search)
  }, [client, key, location.search, location.state, remembered, restoring, setParams])
  return [
    restoring ? new URLSearchParams(remembered) : params,
    (next, options = {}) =>
      setParams(next, {
        ...options,
        state: { ...location.state, ...options.state, listExplicit: true },
      }),
  ]
}
