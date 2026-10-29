import { z } from 'zod'
import { ApiError, apiRequest } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { periodSchema } from './reports-period'
import {
  overviewSchema,
  materialReportSchema,
  collectorReportSchema,
  materialReportKey,
} from './reports-model'

async function request(path, signal) {
  try {
    return await apiRequest(path, { signal })
  } catch (error) {
    if (error instanceof ApiError && error.status === 400)
      throw new ApiError('Kỳ thống kê chưa hợp lệ. Hãy chọn lại khoảng ngày từ 1 đến 366 ngày.', {
        status: 400,
        cause: error,
      })
    throw error
  }
}
export async function getReportOverview({ period, signal }) {
  const range = periodSchema.parse(period),
    params = new URLSearchParams(range)
  const result = parseApi(
    overviewSchema,
    await request(`/api/admin/reports/overview?${params}`, signal),
  )
  if (result.period.from !== range.from || result.period.to !== range.to)
    throw new ApiError('Kết quả chưa khớp kỳ thống kê. Hãy tải lại số liệu.')
  return result
}
export async function getReportBreakdown({
  period,
  group = 'materials',
  page = 0,
  size = 20,
  signal,
}) {
  const range = periodSchema.parse(period)
  z.enum(['materials', 'collectors']).parse(group)
  z.number().int().min(0).max(2147483647).parse(page)
  z.number().int().min(1).max(100).parse(size)
  const params = new URLSearchParams({ ...range, page: String(page), size: String(size) })
  const result = parseApi(
    z.object({
      data: z.array(group === 'materials' ? materialReportSchema : collectorReportSchema).max(size),
      page: z.number().int().min(0),
      totalElements: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      totalPages: z.number().int().min(0),
    }),
    await request(`/api/admin/reports/${group}?${params}`, signal),
  )
  const keys = result.data.map(group === 'materials' ? materialReportKey : (row) => row.collectorId)
  if (
    result.page !== page ||
    result.totalPages !== Math.ceil(result.totalElements / size) ||
    new Set(keys).size !== keys.length
  )
    throw new ApiError('Chi tiết thống kê chưa khớp trang đã chọn. Hãy tải lại số liệu.')
  return result
}

export async function getAllReportMaterials({ period, signal }) {
  const firstPage = await getReportBreakdown({
    period,
    group: 'materials',
    page: 0,
    size: 100,
    signal,
  })
  const rows = [...firstPage.data]
  for (let start = 1; start < firstPage.totalPages; start += 4) {
    const pages = await Promise.all(
      Array.from({ length: Math.min(4, firstPage.totalPages - start) }, (_, index) =>
        getReportBreakdown({ period, group: 'materials', page: start + index, size: 100, signal }),
      ),
    )
    if (pages.some((page) => page.totalElements !== firstPage.totalElements))
      throw new ApiError(
        'Dữ liệu vật liệu vừa thay đổi. Hãy tải lại báo cáo để xem số liệu nhất quán.',
      )
    rows.push(...pages.flatMap((page) => page.data))
  }
  return rows
}
