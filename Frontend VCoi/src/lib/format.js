const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})
const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
})

export function formatPrice(row) {
  return row.priceStatus === 'CONTACT_FOR_QUOTE'
    ? 'Liên hệ báo giá'
    : `${money.format(row.unitPrice)} / kg`
}

export function formatUpdatedAt(value) {
  return dateTime.format(new Date(value))
}
