import { z } from 'zod'

const rounded = (value) => Math.round(value * 1e6) / 1e6
export const locationSchema = z.strictObject({
  lat: z.number().min(-90).max(90).transform(rounded),
  lng: z.number().min(-180).max(180).transform(rounded),
})
export const optionalLocation = locationSchema.nullable().optional()

export function currentLocation({ signal } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false,
      timer
    const finish = (error, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
      if (error) reject(error)
      else resolve(value)
    }
    const cancel = () => finish(new DOMException('Đã hủy lấy vị trí.', 'AbortError'))
    if (signal?.aborted) return cancel()
    if (!navigator.geolocation)
      return finish(
        new Error('Trình duyệt chưa hỗ trợ lấy vị trí. Bạn có thể chọn điểm trên bản đồ.'),
      )
    signal?.addEventListener('abort', cancel, { once: true })
    // Browser timeout can exclude the permission prompt; bound the UI wait as well.
    timer = setTimeout(
      () => finish(new Error('Lấy vị trí mất quá lâu. Hãy chọn điểm trên bản đồ hoặc thử lại.')),
      6000,
    )
    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const point = locationSchema.safeParse({ lat: coords.latitude, lng: coords.longitude })
          if (point.success) finish(null, point.data)
          else finish(new Error('Vị trí nhận được chưa hợp lệ. Hãy chọn điểm trên bản đồ.'))
        },
        (error) =>
          finish(
            new Error(
              {
                1: 'Bạn chưa cho phép lấy vị trí. Hãy cho phép trong trình duyệt hoặc chọn điểm trên bản đồ.',
                2: 'Chưa xác định được vị trí. Hãy thử lại hoặc chọn điểm trên bản đồ.',
                3: 'Lấy vị trí mất quá lâu. Hãy thử lại hoặc chọn điểm trên bản đồ.',
              }[error.code] || 'Chưa lấy được vị trí. Hãy thử lại hoặc chọn điểm trên bản đồ.',
            ),
          ),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
      )
    } catch {
      finish(new Error('Chưa lấy được vị trí. Hãy chọn điểm trên bản đồ.'))
    }
  })
}
