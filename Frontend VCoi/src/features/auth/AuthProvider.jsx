import { useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSession } from './api'
import { AuthContext } from './context'

const SESSION = ['session']
const privateQuery = (query) => query.queryKey[0] === 'private'

export default function AuthProvider({ children }) {
  const client = useQueryClient()
  const session = useQuery({
    queryKey: SESSION,
    queryFn: getSession,
    retry: false,
    throwOnError: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
  const clearPrivate = useCallback(
    (preserveLists = false) => {
      const predicate = (query) =>
        privateQuery(query) && !(preserveLists && query.queryKey[3] === 'list-location')
      void client.cancelQueries({ predicate })
      client.removeQueries({ predicate })
    },
    [client],
  )
  const acceptUser = useCallback(
    async (user) => {
      await client.cancelQueries({ queryKey: SESSION })
      const current = client.getQueryData(SESSION)
      clearPrivate(Boolean(current && user && current.id === user.id && current.role === user.role))
      client.setQueryData(SESSION, user)
    },
    [client, clearPrivate],
  )

  useEffect(() => {
    const expired = () => {
      clearPrivate()
      client.setQueryData(SESSION, null)
    }
    window.addEventListener('vcoi:session-expired', expired)
    return () => window.removeEventListener('vcoi:session-expired', expired)
  }, [client, clearPrivate])
  useEffect(() => {
    if (session.data === undefined) return
    const obsolete = (query) =>
      privateQuery(query) &&
      (!session.data ||
        query.queryKey[1] !== session.data.id ||
        query.queryKey[2] !== session.data.role)
    void client.cancelQueries({ predicate: obsolete })
    client.removeQueries({ predicate: obsolete })
  }, [session.data, client])

  return (
    <AuthContext.Provider
      value={{
        user: session.data ?? null,
        isChecking: session.isPending,
        error: session.error,
        retry: session.refetch,
        acceptUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
