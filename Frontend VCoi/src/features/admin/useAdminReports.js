import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/context'
import { getAllReportMaterials, getReportOverview, getReportBreakdown } from './reports-api'

export default function useAdminReports({ period, group, page }) {
  const { user } = useAuth()
  const scope = ['private', user.id, 'ADMIN', 'reports', period]
  const enabled = Boolean(period) && user.role === 'ADMIN' && user.status === 'ACTIVE'
  const overview = useQuery({
    queryKey: [...scope, 'overview'],
    queryFn: ({ signal }) => getReportOverview({ period, signal }),
    enabled,
    retry: false,
    staleTime: 0,
  })
  const details = useQuery({
    queryKey: [...scope, group, page],
    queryFn: ({ signal }) => getReportBreakdown({ period, group, page, signal }),
    enabled,
    retry: false,
    staleTime: 0,
  })
  const materials = useQuery({
    queryKey: [...scope, 'all-materials'],
    queryFn: ({ signal }) => getAllReportMaterials({ period, signal }),
    enabled,
    retry: false,
    staleTime: 0,
  })
  const refresh = () => {
    if (enabled) return Promise.all([overview.refetch(), details.refetch(), materials.refetch()])
  }
  return { overview, details, materials, refresh }
}
