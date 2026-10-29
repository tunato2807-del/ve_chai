import { z } from 'zod'
import { optionalLocation } from '../maps/location'

export const orderStatuses = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  ASSIGNED: 'Đã phân công',
  EN_ROUTE: 'Đang đến',
  ARRIVED: 'Đã đến điểm thu gom',
  AWAITING_SELLER_APPROVAL: 'Chờ khách duyệt báo giá',
  AWAITING_PAYMENT: 'Chờ thanh toán',
  COMPLETED: 'Đã hoàn tất',
  CANCELLED: 'Đã hủy',
  DISPUTED: 'Đang có khiếu nại',
}
export const utcOrderDate = (value) =>
  new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`)
const dateTime = z.string().refine((value) => Number.isFinite(utcOrderDate(value).getTime()))
const status = z.enum(Object.keys(orderStatuses))
const money = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable()
export const orderSummarySchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  status,
  pickupStart: dateTime,
  pickupEnd: dateTime,
  createdAt: dateTime,
})
export const orderPageSchema = z.object({
  data: z.array(orderSummarySchema),
  page: z.number().int().nonnegative(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})
export const orderSchema = orderSummarySchema.extend({
  collectorId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable(),
  contactName: z.string(),
  contactPhone: z.string(),
  address: z.string(),
  pickupLocation: optionalLocation,
  sellerNote: z.string().nullable(),
  version: z.number().int().nonnegative(),
  currency: z.literal('VND'),
  estimatedTotal: money,
  items: z.array(
    z.object({
      itemId: z.number().int().positive(),
      materialId: z.number().int().positive(),
      materialName: z.string(),
      grade: z.string().nullable(),
      unit: z.literal('KG'),
      estimatedQty: z.number().positive().nullable(),
      estimatedUnitPrice: money,
      estimatedLineTotal: money,
      priceStatus: z.enum(['AVAILABLE', 'CONTACT_FOR_QUOTE']),
      note: z.string().nullable(),
      photoUrl: z.string().nullable().optional(),
    }),
  ),
})
const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
})
const vndFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})
const qtyFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 })
export const orderTime = (value) => dateFormat.format(utcOrderDate(value))
export const orderMoney = (value) => (value === null ? 'Chưa xác định' : vndFormat.format(value))
export const orderQty = (value) => (value === null ? 'Chưa rõ' : `${qtyFormat.format(value)} kg`)
