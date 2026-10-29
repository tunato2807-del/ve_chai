import { z } from 'zod'

const day = z.iso.date({ error: 'Vui lòng chọn một ngày hợp lệ.' })
const dayMs = 86400000
export function shiftDay(value, amount) {
  return new Date(Date.parse(`${value}T00:00:00Z`) + amount * dayMs).toISOString().slice(0, 10)
}
export const periodSchema = z
  .strictObject({ from: day, to: day })
  .refine(
    ({ from, to }) =>
      from >= '0001-01-02' &&
      to <= '9999-12-31' &&
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / dayMs >= 1 &&
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / dayMs <= 366,
    'Chọn kỳ từ 1 đến 366 ngày, trong phạm vi ngày SQL Server.',
  )
export const reportFormSchema = z
  .strictObject({
    from: day.refine((value) => value >= '0001-01-02', 'Ngày bắt đầu phải từ 02/01/0001.'),
    end: day.refine((value) => value <= '9999-12-30', 'Ngày kết thúc tối đa 30/12/9999.'),
  })
  .superRefine(({ from, end }, ctx) => {
    if (!day.safeParse(from).success || !day.safeParse(end).success) return
    const days = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / dayMs + 1
    if (days < 1 || days > 366)
      ctx.addIssue({
        code: 'custom',
        path: ['end'],
        message: 'Ngày kết thúc phải từ ngày bắt đầu, kỳ tối đa 366 ngày.',
      })
  })
export function periodFromForm(values) {
  const { from, end } = reportFormSchema.parse(values)
  return periodSchema.parse({ from, to: shiftDay(end, 1) })
}
export function reportFormValues(period) {
  return { from: period.from, end: day.safeParse(period.to).success ? shiftDay(period.to, -1) : '' }
}
export function periodPreset(kind, now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  )
  const year = Number(parts.year),
    month = Number(parts.month)
  if (kind === 'day') {
    const from = `${parts.year}-${parts.month}-${parts.day}`
    return { from, to: shiftDay(from, 1) }
  }
  const first = (y, m) => `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-01`
  const nextMonth = (y, m) => (m === 12 ? first(y + 1, 1) : first(y, m + 1))
  if (kind === 'previous-month')
    return {
      from: month === 1 ? first(year - 1, 12) : first(year, month - 1),
      to: first(year, month),
    }
  if (kind === 'quarter') {
    const start = Math.floor((month - 1) / 3) * 3 + 1
    return {
      from: first(year, start),
      to: start === 10 ? first(year + 1, 1) : first(year, start + 3),
    }
  }
  if (kind === 'year') return { from: first(year, 1), to: first(year + 1, 1) }
  return { from: first(year, month), to: nextMonth(year, month) }
}
export function readReportFilters(params) {
  const defaults = periodPreset('month')
  const candidate = {
    from: params.get('from') ?? defaults.from,
    to: params.get('to') ?? defaults.to,
  }
  const parsed = periodSchema.safeParse(candidate),
    rawPage = params.get('page') || '0'
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : 0
  return {
    period: parsed.success ? parsed.data : null,
    values: reportFormValues(candidate),
    group: params.get('group') === 'collectors' ? 'collectors' : 'materials',
    page: Number.isSafeInteger(page) && page >= 0 && page <= 2147483647 ? page : 0,
  }
}
const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeZone: 'UTC' })
export function calendarPeriod({ kind, day: selectedDay, month, quarter, year }) {
  if (kind === 'day') return periodFromForm({ from: selectedDay, end: selectedDay })
  if (!['month', 'quarter', 'year'].includes(kind))
    throw new Error('Chọn ngày, tháng, quý hoặc năm.')
  if (kind === 'month' && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month || ''))
    throw new Error('Chọn tháng hợp lệ.')
  const y = Number(kind === 'month' ? month.slice(0, 4) : year)
  if (
    !Number.isInteger(y) ||
    y < 1 ||
    y > 9998 ||
    (kind !== 'month' && !/^\d{4}$/.test(year || ''))
  )
    throw new Error('Nhập năm từ 0001 đến 9998.')
  if (kind === 'quarter' && !/^[1-4]$/.test(quarter || '')) throw new Error('Chọn quý từ I đến IV.')
  const m =
    kind === 'year' ? 1 : kind === 'month' ? Number(month.slice(5)) : (Number(quarter) - 1) * 3 + 1
  const span = kind === 'year' ? 12 : kind === 'month' ? 1 : 3
  const first = (a, b) => `${String(a).padStart(4, '0')}-${String(b).padStart(2, '0')}-01`
  return periodSchema.parse({
    from: first(y, m),
    to: first(y + Math.floor((m - 1 + span) / 12), ((m - 1 + span) % 12) + 1),
  })
}
export const reportDate = (value) => dateFormat.format(new Date(`${value}T00:00:00Z`))
export const periodLabel = (period) =>
  `${reportDate(period.from)} đến hết ${reportDate(shiftDay(period.to, -1))}`
