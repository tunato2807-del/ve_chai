import { ApiError } from './api'

export function parseApi(schema, value, uncertain = false) {
  const result = schema.safeParse(value)
  if (!result.success)
    throw new ApiError('Dữ liệu hệ thống chưa hợp lệ. Vui lòng tải lại để kiểm tra.', { uncertain })
  return result.data
}
