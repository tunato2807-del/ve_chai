import { z } from 'zod'
import { catalogId } from './catalog-model'

export const priceId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
export const priceStatuses = { DRAFT: 'Giá nháp', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' }
const instant = z.iso.datetime({ offset: true }).refine((value) => {
  const year = new Date(value).getUTCFullYear()
  return year >= 1 && year <= 9999
})
export const priceSchema = z
  .object({
    id: priceId,
    materialId: catalogId,
    materialName: z.string().min(1),
    grade: z.string(),
    unit: z.literal('KG'),
    currency: z.literal('VND'),
    unitPrice: priceId,
    validFrom: instant,
    validTo: instant.nullable(),
    approvalStatus: z.enum(['DRAFT', 'APPROVED', 'REJECTED']),
    draftRevision: z.string().regex(/^[a-f0-9]{64}$/),
    versionNumber: catalogId,
    createdBy: priceId,
    createdAt: instant,
    approvedBy: priceId.nullable(),
    approvedAt: instant.nullable(),
  })
  .refine((row) => !row.validTo || new Date(row.validTo) > new Date(row.validFrom))
  .refine((row) =>
    row.approvalStatus === 'APPROVED'
      ? row.approvedBy !== null && row.approvedAt !== null
      : row.approvedBy === null && row.approvedAt === null,
  )

export function priceTimeInput(value) {
  return new Date(new Date(value).getTime() + 7 * 3600_000).toISOString().slice(0, -1)
}
function fromInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(value)) return null
  const full = value.length === 16 ? `${value}:00` : value
  const date = new Date(`${full}+07:00`)
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999)
    return null
  const normalized = full.includes('.') ? full.padEnd(23, '0') : `${full}.000`
  return priceTimeInput(date) === normalized ? date.toISOString() : null
}
export const priceFormSchema = z
  .strictObject({
    materialId: z
      .string()
      .regex(/^[1-9]\d*$/, 'Chọn vật liệu.')
      .transform(Number)
      .pipe(catalogId),
    unitPrice: z
      .string()
      .trim()
      .regex(/^[1-9]\d*$/, 'Nhập số nguyên VND lớn hơn 0, không dấu phân cách.')
      .transform(Number)
      .refine(
        (value) => Number.isSafeInteger(value) && value > 0,
        'Đơn giá tối đa 9.007.199.254.740.991 VND.',
      ),
    validFrom: z.string(),
    validTo: z.string(),
  })
  .superRefine((value, context) => {
    const start = fromInput(value.validFrom),
      end = value.validTo ? fromInput(value.validTo) : null
    if (!start)
      context.addIssue({
        code: 'custom',
        path: ['validFrom'],
        message: 'Chọn thời gian hợp lệ theo giờ Việt Nam, năm UTC 0001–9999.',
      })
    if (value.validTo && (!end || (start && new Date(end) <= new Date(start))))
      context.addIssue({
        code: 'custom',
        path: ['validTo'],
        message: 'Thời điểm kết thúc phải hợp lệ và sau thời điểm bắt đầu.',
      })
  })
  .transform((value) => ({
    ...value,
    validFrom: fromInput(value.validFrom),
    validTo: value.validTo ? fromInput(value.validTo) : null,
  }))

export function readPriceFilters(params) {
  const materialId = params.get('materialId') || '',
    approvalStatus = params.get('approvalStatus') || ''
  const rawPage = params.get('page') || '0',
    page = /^\d+$/.test(rawPage) ? Number(rawPage) : 0
  return {
    materialId:
      /^[1-9]\d*$/.test(materialId) && catalogId.safeParse(Number(materialId)).success
        ? materialId
        : '',
    approvalStatus: Object.hasOwn(priceStatuses, approvalStatus) ? approvalStatus : '',
    page: Number.isSafeInteger(page) && page >= 0 && page <= 2147483647 ? page : 0,
  }
}
export function samePrice(a, b) {
  return (
    [
      'id',
      'materialId',
      'versionNumber',
      'unitPrice',
      'approvalStatus',
      'draftRevision',
      'createdBy',
    ].every((key) => a[key] === b[key]) &&
    ['validFrom', 'validTo', 'createdAt'].every((key) =>
      a[key] === null ? b[key] === null : new Date(a[key]).getTime() === new Date(b[key]).getTime(),
    )
  )
}
export function priceTime(value) {
  if (!value) return 'Không giới hạn'
  const date = new Date(value)
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .map((part) =>
      part.type === 'second' && date.getUTCMilliseconds()
        ? `${part.value}.${String(date.getUTCMilliseconds()).padStart(3, '0')}`
        : part.value,
    )
    .join('')
}
