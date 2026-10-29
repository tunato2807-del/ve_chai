import { z } from 'zod'
export const evidencePathSchema = z.string().regex(/^\/api\/evidence\/[a-f0-9]{32}\.(png|jpg)$/)

export const requiredText = (max) =>
  z.string().trim().min(1, 'Vui lòng nhập thông tin này.').max(max, `Tối đa ${max} ký tự.`)
export const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max, `Tối đa ${max} ký tự.`)
    .transform((value) => value || null)
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^0[35789][0-9]{8}$/, 'Nhập số điện thoại Việt Nam gồm 10 số, đầu 03, 05, 07, 08 hoặc 09.')
export const passwordSchema = (minimum) =>
  z
    .string()
    .min(minimum, `Mật khẩu cần ít nhất ${minimum} ký tự.`)
    .max(64, 'Mật khẩu tối đa 64 ký tự.')
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      'Mật khẩu tối đa 72 byte UTF-8; hãy giảm ký tự có dấu hoặc ký tự đặc biệt.',
    )
