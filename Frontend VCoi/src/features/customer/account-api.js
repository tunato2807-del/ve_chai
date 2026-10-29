import { z } from 'zod'
import { apiRequest, ApiError } from '../../lib/api'
import { parseApi } from '../../lib/parse-api'
import { optionalText, phoneSchema, requiredText } from '../../lib/validation'
import { id, instant, pageOf } from './schemas'
import { optionalLocation } from '../maps/location'

export const addressFields = {
  contactName: requiredText(100),
  contactPhone: phoneSchema,
  addressLine: requiredText(300),
  ward: optionalText(100),
  district: optionalText(100),
  province: requiredText(100),
  location: optionalLocation,
}
export const addressFormSchema = z
  .strictObject({ ...addressFields, isDefault: z.boolean() })
  .superRefine((value, ctx) => {
    if (
      [value.addressLine, value.ward, value.district, value.province].filter(Boolean).join(', ')
        .length > 600
    )
      ctx.addIssue({
        code: 'custom',
        path: ['addressLine'],
        message: 'Địa chỉ đầy đủ tối đa 600 ký tự.',
      })
  })
  .transform(({ isDefault, location, ...pickupAddress }) => ({
    pickupAddress: { ...pickupAddress, ...(location && { location }) },
    isDefault,
  }))
export const addressSchema = z.object({
  id,
  pickupAddress: z.object({
    contactName: z.string(),
    contactPhone: z.string(),
    addressLine: z.string(),
    ward: z.string().nullable(),
    district: z.string().nullable(),
    province: z.string(),
    location: optionalLocation,
  }),
  isDefault: z.boolean(),
  createdAt: instant,
})
export async function getAddresses({ signal } = {}) {
  const rows = []
  let page = 0,
    totalPages
  do {
    const result = parseApi(
      pageOf(addressSchema),
      await apiRequest(`/api/customer/addresses?page=${page}&size=100`, { signal }),
    )
    if (result.page !== page || result.totalPages > 100 || result.totalElements > 100)
      throw new ApiError('Danh sách địa chỉ chưa hợp lệ.')
    rows.push(...result.data)
    totalPages = result.totalPages
    page++
  } while (page < totalPages)
  if (
    new Set(rows.map((row) => row.id)).size !== rows.length ||
    rows.filter((row) => row.isDefault).length > 1
  )
    throw new ApiError('Danh sách địa chỉ chưa đồng bộ. Hãy tải lại.')
  return rows
}
export async function saveAddress(old, values) {
  if (old) id.parse(old.id)
  const body = addressFormSchema.parse(values)
  const result = parseApi(
    addressSchema,
    await apiRequest(`/api/customer/addresses${old ? `/${old.id}` : ''}`, {
      method: old ? 'PUT' : 'POST',
      body,
    }),
    true,
  )
  if (old && result.id !== old.id)
    throw new ApiError('Địa chỉ lưu chưa khớp. Hãy tải lại.', { uncertain: true })
  return result
}
export async function makeDefaultAddress(addressId) {
  id.parse(addressId)
  const result = parseApi(
    addressSchema,
    await apiRequest(`/api/customer/addresses/${addressId}/default`, { method: 'PUT' }),
    true,
  )
  if (result.id !== addressId || !result.isDefault)
    throw new ApiError('Chưa xác định địa chỉ mặc định. Hãy tải lại.', { uncertain: true })
  return result
}
export function deleteAddress(addressId) {
  id.parse(addressId)
  return apiRequest(`/api/customer/addresses/${addressId}`, { method: 'DELETE' })
}
