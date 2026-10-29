import { z } from 'zod'
import { userSchema } from '../auth/schemas'

export const accountId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
export const accountStatuses = { ACTIVE: 'Đang hoạt động', LOCKED: 'Đã khóa' }
export const accountSchema = userSchema.extend({
  id: accountId,
  fullName: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  email: z.string().max(254).nullable(),
  status: z.enum(['ACTIVE', 'LOCKED']),
})
export function readAccountPage(params) {
  const raw = params.get('page') || '0',
    page = /^\d+$/.test(raw) ? Number(raw) : 0
  return Number.isSafeInteger(page) && page >= 0 && page <= 2147483647 ? page : 0
}
export function sameAccount(a, b) {
  return ['id', 'fullName', 'phone', 'email', 'role'].every((key) => a[key] === b[key])
}
export const statusLabel = (target) =>
  target === 'LOCKED' ? 'khóa tài khoản' : 'mở khóa tài khoản'
