import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { catalogId } from './catalog-model'
import { listCatalog } from './catalog-api'
import { priceId, priceSchema, priceFormSchema, samePrice } from './prices-model'

const conflict = () =>
  new ApiError(
    'Phiên bản giá đã thay đổi hoặc không còn là giá nháp. Hãy tải lại trước khi tiếp tục.',
    { status: 409 },
  )
async function request(path, options) {
  try {
    return await apiRequest(path, options)
  } catch (error) {
    const messages = {
      400: 'Đơn giá hoặc khoảng hiệu lực chưa hợp lệ. Hãy kiểm tra thông tin đã nhập.',
      404: 'Không tìm thấy phiên bản giá hoặc vật liệu. Hãy tải lại dữ liệu.',
      409: 'Không thể cập nhật phiên bản giá hiện tại. Hãy tải lại để kiểm tra trạng thái và dữ liệu mới nhất.',
    }
    if (error instanceof ApiError && messages[error.status])
      throw new ApiError(messages[error.status], {
        status: error.status,
        uncertain: error.uncertain,
        cause: error,
      })
    throw error
  }
}
export async function listPrices({
  materialId = '',
  approvalStatus = '',
  page = 0,
  size = 20,
  history = false,
  signal,
} = {}) {
  z.number().int().min(0).max(2147483647).parse(page)
  z.number().int().min(1).max(100).parse(size)
  z.enum(['', 'DRAFT', 'APPROVED', 'REJECTED']).parse(approvalStatus)
  if (materialId) catalogId.parse(Number(materialId))
  if (history && !materialId) throw new ApiError('Chọn vật liệu để xem lịch sử.')
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (!history) {
    if (materialId) params.set('materialId', materialId)
    if (approvalStatus) params.set('approvalStatus', approvalStatus)
  }
  const result = parseApi(
    z.object({
      data: z.array(priceSchema).max(size),
      page: z.number().int().min(0),
      totalElements: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      totalPages: z.number().int().min(0),
    }),
    await request(
      history
        ? `/api/admin/materials/${materialId}/price-rules?${params}`
        : `/api/admin/price-rules?${params}`,
      { signal },
    ),
  )
  if (
    result.page !== page ||
    result.totalPages !== Math.ceil(result.totalElements / size) ||
    new Set(result.data.map((row) => row.id)).size !== result.data.length ||
    result.data.some(
      (row) =>
        (materialId && row.materialId !== Number(materialId)) ||
        (!history && approvalStatus && row.approvalStatus !== approvalStatus),
    )
  )
    throw new ApiError('Danh sách phiên bản giá chưa đồng bộ. Hãy tải lại.', { status: 409 })
  return result
}
export async function getMaterialOptions({ signal } = {}) {
  const rows = []
  let expected,
    pages = 1
  for (let page = 0; page < pages; page++) {
    const result = await listCatalog('materials', { page, size: 100, signal })
    expected ??= result.totalElements
    if (expected !== result.totalElements || result.totalPages > 100) throw conflict()
    rows.push(...result.data)
    pages = result.totalPages
  }
  if (rows.length !== expected || new Set(rows.map((row) => row.id)).size !== rows.length)
    throw conflict()
  return rows
}
export async function getPrice(id, { signal } = {}) {
  priceId.parse(id)
  const result = parseApi(priceSchema, await request(`/api/admin/price-rules/${id}`, { signal }))
  if (result.id !== id) throw conflict()
  return result
}
async function checkDraft(initial) {
  priceSchema.parse(initial)
  if (initial.approvalStatus !== 'DRAFT') throw conflict()
  const fresh = await getPrice(initial.id)
  if (!samePrice(initial, fresh)) throw conflict()
}
function checkWrite(result, expected) {
  if (
    !samePrice(result, expected) ||
    (expected.approvalStatus === 'DRAFT' && result.approvedBy !== null)
  )
    throw new ApiError('Kết quả ghi chưa khớp. Hãy tải lại để kiểm tra trước khi tiếp tục.', {
      uncertain: true,
    })
  return result
}
export async function savePriceDraft(initial, values) {
  const { materialId, ...body } = priceFormSchema.parse(values)
  if (initial) {
    if (materialId !== initial.materialId) throw conflict()
    await checkDraft(initial)
  }
  const result = parseApi(
    priceSchema,
    await request(`/api/admin/price-rules${initial ? `/${initial.id}` : ''}`, {
      method: initial ? 'PUT' : 'POST',
      body: initial
        ? { ...body, expectedRevision: initial.draftRevision }
        : { materialId, ...body },
    }),
    true,
  )
  return checkWrite(result, {
    ...result,
    ...(initial && {
      id: initial.id,
      versionNumber: initial.versionNumber,
      createdBy: initial.createdBy,
      createdAt: initial.createdAt,
    }),
    ...body,
    materialId,
    approvalStatus: 'DRAFT',
  })
}
export async function reviewPrice(initial, action) {
  z.enum(['approve', 'reject']).parse(action)
  await checkDraft(initial)
  const result = parseApi(
    priceSchema,
    await request(`/api/admin/price-rules/${initial.id}/${action}`, {
      method: 'POST',
      body: { expectedRevision: initial.draftRevision },
    }),
    true,
  )
  return checkWrite(result, {
    ...initial,
    approvalStatus: action === 'approve' ? 'APPROVED' : 'REJECTED',
    draftRevision: result.draftRevision,
  })
}
