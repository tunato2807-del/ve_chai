import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { registrationSchema } from '../auth/schemas'
import { accountId, accountSchema, sameAccount } from './accounts-model'

const conflict = () =>
  new ApiError(
    'Thông tin tài khoản đã thay đổi hoặc không được phép xử lý. Hãy tải lại danh sách.',
    { status: 409 },
  )
async function request(path, options) {
  try {
    return await apiRequest(path, options)
  } catch (error) {
    const messages = {
      400: 'Thông tin tài khoản chưa hợp lệ. Hãy kiểm tra các trường đã nhập.',
      404: 'Không tìm thấy tài khoản. Hãy tải lại danh sách.',
      409:
        options?.method === 'POST'
          ? 'Số điện thoại hoặc email đã được sử dụng. Hãy kiểm tra và chọn thông tin khác.'
          : 'Không thể thay đổi trạng thái tài khoản này. Hãy tải lại danh sách.',
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
export async function listAccounts({ page = 0, size = 20, signal } = {}) {
  z.number().int().min(0).max(2147483647).parse(page)
  z.number().int().min(1).max(100).parse(size)
  const result = parseApi(
    z.object({
      data: z.array(accountSchema).max(size),
      page: z.number().int().min(0),
      totalElements: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      totalPages: z.number().int().min(0),
    }),
    await request(`/api/admin/users?page=${page}&size=${size}`, { signal }),
  )
  if (
    result.page !== page ||
    result.totalPages !== Math.ceil(result.totalElements / size) ||
    new Set(result.data.map((row) => row.id)).size !== result.data.length
  )
    throw new ApiError('Danh sách tài khoản chưa đồng bộ. Hãy tải lại.', { status: 409 })
  return result
}
export async function readAccount(id, page, { signal } = {}) {
  accountId.parse(id)
  const rows = await listAccounts({ page, signal })
  const account = rows.data.find((row) => row.id === id)
  if (!account)
    throw new ApiError('Tài khoản không còn ở trang đang xem. Hãy tải lại danh sách.', {
      status: 404,
    })
  return account
}
export async function createCollector(values) {
  const body = registrationSchema.parse(values)
  const result = parseApi(
    accountSchema,
    await request('/api/admin/collectors', { method: 'POST', body }),
    true,
  )
  if (
    result.role !== 'COLLECTOR' ||
    result.status !== 'ACTIVE' ||
    ['fullName', 'phone', 'email'].some((key) => result[key] !== body[key])
  )
    throw new ApiError(
      'Kết quả tạo nhân viên chưa khớp. Hãy tải lại để kiểm tra trước khi tạo tiếp.',
      { uncertain: true },
    )
  return result
}
export async function changeAccountStatus(initial, target, page) {
  const snapshot = accountSchema.parse(initial)
  z.enum(['ACTIVE', 'LOCKED']).parse(target)
  if (snapshot.role === 'ADMIN') throw conflict()
  const fresh = await readAccount(snapshot.id, page)
  if (fresh.role === 'ADMIN' || !sameAccount(snapshot, fresh)) throw conflict()
  if (fresh.status === target) return fresh
  const result = parseApi(
    accountSchema,
    await request(`/api/admin/users/${snapshot.id}/status`, {
      method: 'PATCH',
      body: { status: target },
    }),
    true,
  )
  if (!sameAccount(result, fresh) || result.status !== target)
    throw new ApiError(
      'Trạng thái trả về chưa khớp. Hãy tải lại để kiểm tra trước khi thao tác tiếp.',
      { uncertain: true },
    )
  return result
}
