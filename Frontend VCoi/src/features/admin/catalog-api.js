import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { catalogConfig, catalogId } from './catalog-model'

function config(kind) {
  z.enum(['categories', 'materials']).parse(kind)
  return catalogConfig[kind]
}
async function request(path, options) {
  try {
    return await apiRequest(path, options)
  } catch (error) {
    const messages = {
      400: 'Thông tin danh mục hoặc vật liệu chưa hợp lệ. Hãy kiểm tra các trường đã nhập.',
      404: 'Không tìm thấy danh mục hoặc vật liệu. Hãy tải lại dữ liệu.',
      409: 'Tên danh mục hoặc tổ hợp danh mục, tên vật liệu và phân hạng đã tồn tại. Hãy kiểm tra và chọn thông tin khác.',
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
export async function listCatalog(
  kind,
  { page = 0, size = 20, status = '', categoryId = '', signal } = {},
) {
  const meta = config(kind)
  z.number().int().min(0).max(2147483647).parse(page)
  z.number().int().min(1).max(100).parse(size)
  z.enum(['', 'true', 'false']).parse(status)
  if (categoryId) catalogId.parse(Number(categoryId))
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (status) params.set(meta.field, status)
  if (kind === 'materials' && categoryId) params.set('categoryId', String(categoryId))
  const result = parseApi(
    z.object({
      data: z.array(meta.schema).max(size),
      page: z.number().int().min(0),
      totalElements: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      totalPages: z.number().int().min(0),
    }),
    await request(`/api/admin/${meta.endpoint}?${params}`, { signal }),
  )
  if (
    result.page !== page ||
    result.totalPages !== Math.ceil(result.totalElements / size) ||
    new Set(result.data.map((row) => row.id)).size !== result.data.length ||
    result.data.some(
      (row) =>
        (status && row[meta.field] !== (status === 'true')) ||
        (kind === 'materials' && categoryId && row.categoryId !== Number(categoryId)),
    )
  )
    throw new ApiError('Danh sách chưa đồng bộ. Hãy tải lại để kiểm tra.', { status: 409 })
  return result
}
export async function getCategoryOptions({ signal } = {}) {
  const rows = []
  let expected,
    pages = 1
  for (let page = 0; page < pages; page++) {
    const result = await listCatalog('categories', { page, size: 100, signal })
    expected ??= result.totalElements
    if (result.totalElements !== expected || result.totalPages > 100)
      throw new ApiError('Danh sách danh mục đã thay đổi hoặc quá lớn. Hãy tải lại.', {
        status: 409,
      })
    rows.push(...result.data)
    pages = result.totalPages
  }
  if (rows.length !== expected || new Set(rows.map((row) => row.id)).size !== rows.length)
    throw new ApiError('Chưa tải đủ danh mục. Hãy tải lại.', { status: 409 })
  return rows
}
export async function getCatalogItem(kind, id, { signal } = {}) {
  catalogId.parse(id)
  const meta = config(kind)
  const result = parseApi(
    meta.schema,
    await request(`/api/admin/${meta.endpoint}/${id}`, { signal }),
  )
  if (result.id !== id)
    throw new ApiError('Thông tin phản hồi chưa đúng bản ghi. Hãy tải lại.', { status: 409 })
  return result
}
export async function saveCatalogItem(kind, id, values) {
  const meta = config(kind),
    body = meta.form.parse(values)
  if (id !== null) catalogId.parse(id)
  const result = parseApi(
    meta.schema,
    await request(`/api/admin/${meta.endpoint}${id === null ? '' : `/${id}`}`, {
      method: id === null ? 'POST' : 'PUT',
      body,
    }),
    true,
  )
  if (
    (id !== null && result.id !== id) ||
    Object.entries(body).some(([key, value]) => result[key] !== value) ||
    (id === null && !result[meta.field])
  )
    throw new ApiError('Kết quả lưu chưa khớp. Hãy tải lại và kiểm tra trước khi lưu tiếp.', {
      uncertain: true,
    })
  return result
}
export async function setCatalogStatus(kind, id, value) {
  const meta = config(kind)
  catalogId.parse(id)
  z.boolean().parse(value)
  const result = parseApi(
    meta.schema,
    await request(`/api/admin/${meta.endpoint}/${id}/status`, {
      method: 'PATCH',
      body: { [meta.field]: value },
    }),
    true,
  )
  if (result.id !== id || result[meta.field] !== value)
    throw new ApiError('Trạng thái phản hồi chưa khớp. Hãy tải lại.', { uncertain: true })
  return result
}
