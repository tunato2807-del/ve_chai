import { z } from 'zod'
import { passwordSchema, phoneSchema, requiredText } from '../../lib/validation'

export const loginSchema = z.strictObject({
  identifier: requiredText(254).transform((value) =>
    value.includes('@') ? value.toLowerCase() : value,
  ),
  password: passwordSchema(1),
})

export const registrationSchema = z
  .strictObject({
    fullName: requiredText(100),
    phone: phoneSchema,
    email: z
      .string()
      .trim()
      .max(254, 'Email tối đa 254 ký tự.')
      .refine((value) => !value || /^[^\s@]+@[^\s@]+$/.test(value), 'Địa chỉ email chưa hợp lệ.')
      .transform((value) => (value ? value.toLowerCase() : null)),
    password: passwordSchema(12),
    confirmPassword: z.string(),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword)
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Hai mật khẩu chưa khớp nhau.',
      })
  })
  .transform(({ fullName, phone, email, password }) => ({ fullName, phone, email, password }))

export const userSchema = z.object({
  id: z.number().int().positive(),
  fullName: z.string(),
  phone: z.string(),
  email: z.string().nullable().optional(),
  role: z.enum(['CUSTOMER', 'COLLECTOR', 'ADMIN']),
  status: z.literal('ACTIVE'),
})
