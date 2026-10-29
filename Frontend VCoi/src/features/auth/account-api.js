import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { passwordSchema, requiredText } from '../../lib/validation'
import { userSchema } from './schemas'
const email = z
  .string()
  .trim()
  .max(254)
  .refine((text) => !text || /^[^\s@]+@[^\s@]+$/.test(text), 'Email chưa hợp lệ.')
  .transform((text) => (text ? text.toLowerCase() : null))
export const profileFormSchema = z.strictObject({ fullName: requiredText(100), email })
export const passwordFormSchema = z
  .strictObject({
    currentPassword: passwordSchema(1),
    newPassword: passwordSchema(12),
    confirmPassword: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword === value.currentPassword)
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
      })
    if (value.newPassword !== value.confirmPassword)
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Hai mật khẩu mới chưa khớp.',
      })
  })
  .transform(({ currentPassword, newPassword }) => ({ currentPassword, newPassword }))
export async function updateProfile(user, values) {
  userSchema.parse(user)
  const body = profileFormSchema.parse(values)
  const result = parseApi(
    userSchema,
    await apiRequest('/api/auth/profile', { method: 'PUT', body }),
    true,
  )
  if (
    result.id !== user.id ||
    result.role !== user.role ||
    result.phone !== user.phone ||
    result.fullName !== body.fullName ||
    result.email !== body.email
  )
    throw new ApiError('Hồ sơ phản hồi chưa khớp. Hãy tải lại tài khoản.', { uncertain: true })
  return result
}
export async function changePassword(values) {
  const body = passwordFormSchema.parse(values)
  const result = await apiRequest('/api/auth/password', { method: 'POST', body })
  if (result !== null)
    throw new ApiError('Chưa xác nhận được đổi mật khẩu. Hãy đăng nhập lại để kiểm tra.', {
      uncertain: true,
    })
  return result
}
