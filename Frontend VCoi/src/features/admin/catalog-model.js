import { z } from 'zod'
import { requiredText, optionalText } from '../../lib/validation'

export const catalogId = z.number().int().positive().max(2147483647)
const idInput = z
  .union([catalogId, z.string().regex(/^[1-9]\d*$/, 'Hãy chọn danh mục.')])
  .transform(Number)
  .pipe(catalogId)
const imageUrl = optionalText(1000).refine((value) => {
  if (value === null) return true
  if (!/^https?:\/\//i.test(value) || /[\s\\]/.test(value)) return false
  try {
    const url = new URL(value)
    return Boolean(url.hostname && !url.username && !url.password)
  } catch {
    return false
  }
}, 'Nhập URL HTTP/HTTPS có tên miền, không chứa tài khoản hoặc khoảng trắng.')
export const categoryFormSchema = z.strictObject({
  name: requiredText(100),
  description: optionalText(500),
})
export const materialFormSchema = z.strictObject({
  categoryId: idInput,
  name: requiredText(150),
  grade: requiredText(50),
  unit: z.literal('KG'),
  description: optionalText(1000),
  excludedItems: optionalText(1000),
  imageUrl,
})
export const categorySchema = z.object({
  id: catalogId,
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  isActive: z.boolean(),
})
export const materialSchema = z
  .object({
    id: catalogId,
    categoryId: catalogId,
    categoryName: z.string(),
    categoryActive: z.boolean(),
    name: z.string().min(1).max(150),
    grade: z.string().min(1).max(50),
    unit: z.literal('KG'),
    description: z.string().nullable(),
    excludedItems: z.string().nullable(),
    imageUrl: z.string().nullable(),
    accepted: z.boolean(),
    available: z.boolean(),
  })
  .refine((row) => row.available === (row.accepted && row.categoryActive))
export const catalogConfig = {
  categories: {
    endpoint: 'material-categories',
    field: 'isActive',
    title: 'Danh mục thu mua',
    noun: 'danh mục',
    schema: categorySchema,
    form: categoryFormSchema,
  },
  materials: {
    endpoint: 'materials',
    field: 'accepted',
    title: 'Vật liệu thu mua',
    noun: 'vật liệu',
    schema: materialSchema,
    form: materialFormSchema,
  },
}
export function readCatalogFilters(kind, params) {
  const status = params.get(catalogConfig[kind].field) || ''
  const rawPage = params.get('page') || '0',
    page = /^\d+$/.test(rawPage) ? Number(rawPage) : 0
  const categoryId = kind === 'materials' ? params.get('categoryId') || '' : ''
  return {
    status: ['true', 'false'].includes(status) ? status : '',
    categoryId:
      /^[1-9]\d*$/.test(categoryId) && catalogId.safeParse(Number(categoryId)).success
        ? categoryId
        : '',
    page: Number.isSafeInteger(page) && page >= 0 && page <= 2147483647 ? page : 0,
  }
}
export function statusAction(kind, target) {
  return kind === 'categories'
    ? target
      ? 'hiện danh mục'
      : 'ẩn danh mục'
    : target
      ? 'thu mua trở lại'
      : 'ngừng thu mua'
}
