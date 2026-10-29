import { z } from 'zod'
import { optionalText, phoneSchema, requiredText } from '../../lib/validation'
import { optionalLocation } from '../maps/location'

export function vietnamInputToDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(`${value}:00+07:00`)
  if (!Number.isFinite(date.getTime())) return null
  const calendar = new Date(date.getTime() + 7 * 3600_000).toISOString().slice(0, 16)
  return calendar === value ? date : null
}

export function vietnamDateInput(date) {
  return new Date(date.getTime() + 7 * 3600_000).toISOString().slice(0, 16)
}

const quantity = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true
    const normalized = value.replace(',', '.')
    return (
      /^\d{1,9}(\.\d{1,3})?$/.test(normalized) &&
      Number(normalized) > 0 &&
      Number(normalized) <= 999999999.999
    )
  }, 'Nhập kg lớn hơn 0, tối đa 9 số nguyên và 3 số thập phân.')
  .transform((value) => (value ? Number(value.replace(',', '.')) : null))

export const bookingSchema = z
  .strictObject({
    contactName: requiredText(100),
    contactPhone: phoneSchema,
    addressLine: requiredText(300),
    ward: optionalText(100),
    district: optionalText(100),
    province: requiredText(100),
    location: optionalLocation,
    pickupStart: z.string(),
    pickupEnd: z.string(),
    sellerNote: optionalText(1000),
    items: z
      .array(
        z.strictObject({
          materialId: z
            .string()
            .regex(/^[1-9]\d*$/, 'Vui lòng chọn vật liệu.')
            .transform(Number)
            .refine(
              (id) => Number.isSafeInteger(id) && id <= 2147483647,
              'Mã vật liệu chưa hợp lệ.',
            ),
          estimatedQty: quantity,
          note: optionalText(500),
        }),
      )
      .min(1, 'Chọn ít nhất một vật liệu.')
      .max(50, 'Mỗi lịch tối đa 50 loại vật liệu.'),
  })
  .superRefine((value, context) => {
    const issue = (path, message) => context.addIssue({ code: 'custom', path, message })
    const start = vietnamInputToDate(value.pickupStart)
    const end = vietnamInputToDate(value.pickupEnd)
    if (!start || start.getTime() <= Date.now())
      issue(['pickupStart'], 'Chọn giờ bắt đầu trong tương lai, theo giờ Việt Nam.')
    if (!end || !start || end <= start) issue(['pickupEnd'], 'Giờ kết thúc phải sau giờ bắt đầu.')
    const seen = new Set()
    value.items.forEach((item, index) => {
      if (seen.has(item.materialId))
        issue(['items', index, 'materialId'], 'Vật liệu đã có trong lịch này.')
      seen.add(item.materialId)
    })
    if (
      [value.addressLine, value.ward, value.district, value.province].filter(Boolean).join(', ')
        .length > 600
    )
      issue(['addressLine'], 'Địa chỉ đầy đủ tối đa 600 ký tự; hãy rút gọn thông tin.')
  })
  .transform((value) => ({
    pickupAddress: {
      contactName: value.contactName,
      contactPhone: value.contactPhone,
      addressLine: value.addressLine,
      ward: value.ward,
      district: value.district,
      province: value.province,
      ...(value.location && { location: value.location }),
    },
    pickupStart: vietnamInputToDate(value.pickupStart).toISOString(),
    pickupEnd: vietnamInputToDate(value.pickupEnd).toISOString(),
    sellerNote: value.sellerNote,
    items: value.items,
  }))
