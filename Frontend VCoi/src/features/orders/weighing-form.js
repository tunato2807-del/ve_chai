import { z } from 'zod'
import { latestWeighings, parseKg, weighingId } from './weighing-model'

export function weighingFormSchema(order, history) {
  const latest = latestWeighings(history.records)
  return z
    .strictObject({
      items: z.array(
        z.strictObject({
          selected: z.boolean(),
          itemId: weighingId,
          grossWeight: z.string(),
          tareWeight: z.string(),
          correctionReason: z.string(),
        }),
      ),
    })
    .superRefine((value, context) => {
      const issue = (path, message) => context.addIssue({ code: 'custom', path, message })
      const selected = value.items.filter((row) => row.selected)
      if (!selected.length || selected.length > 50)
        issue(['items', 'root'], 'Chọn từ 1 đến 50 vật liệu để lưu một lần.')
      const seen = new Set()
      value.items.forEach((row, index) => {
        if (!row.selected) return
        if (seen.has(row.itemId) || !order.items.some((item) => item.itemId === row.itemId))
          issue(['items', index, 'selected'], 'Vật liệu bị lặp hoặc không thuộc đơn này.')
        seen.add(row.itemId)
        const gross = parseKg(row.grossWeight),
          tare = parseKg(row.tareWeight)
        if (gross === null || gross <= 0)
          issue(
            ['items', index, 'grossWeight'],
            'Nhập tổng lớn hơn 0, tối đa 9 số nguyên và 3 số lẻ.',
          )
        if (tare === null)
          issue(['items', index, 'tareWeight'], 'Nhập bì từ 0, tối đa 9 số nguyên và 3 số lẻ.')
        if (gross !== null && tare !== null && gross <= tare)
          issue(['items', index, 'grossWeight'], 'Khối lượng tổng phải lớn hơn khối lượng bì.')
        if (
          (latest.has(row.itemId) && !row.correctionReason.trim()) ||
          row.correctionReason.trim().length > 500
        )
          issue(
            ['items', index, 'correctionReason'],
            'Cân điều chỉnh cần lý do từ 1 đến 500 ký tự.',
          )
      })
    })
    .transform((value) => ({
      version: order.version,
      items: value.items
        .filter((row) => row.selected)
        .map((row) => ({
          itemId: row.itemId,
          grossWeight: parseKg(row.grossWeight) / 1000,
          tareWeight: parseKg(row.tareWeight) / 1000,
          correctionOf: latest.get(row.itemId)?.id ?? null,
          correctionReason: latest.has(row.itemId) ? row.correctionReason.trim() : null,
        })),
    }))
}

export function weighingDefaults(order, history) {
  const latest = latestWeighings(history.records)
  return {
    items: order.items.map((item) => {
      const previous = latest.get(item.itemId)
      return {
        selected: !previous,
        itemId: item.itemId,
        grossWeight: previous ? String(previous.grossWeight) : '',
        tareWeight: previous ? String(previous.tareWeight) : '0',
        correctionReason: '',
      }
    }),
  }
}
