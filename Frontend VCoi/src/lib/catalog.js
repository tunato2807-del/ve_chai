const CONNECTION_ERROR = 'Chưa thể kết nối bảng giá. Bạn vui lòng thử lại sau.'
const DATA_ERROR = 'Dữ liệu bảng giá chưa hợp lệ. Bạn vui lòng thử lại sau.'

async function readJson(path, signal) {
  let response
  try {
    const timeout = AbortSignal.timeout(10_000)
    response = await fetch(path, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error(CONNECTION_ERROR, { cause: error })
  }
  if (!response.ok) throw new Error(CONNECTION_ERROR)
  try {
    return await response.json()
  } catch {
    throw new Error(DATA_ERROR)
  }
}

function isPriceRow(row) {
  return (
    row &&
    Number.isInteger(row.materialId) &&
    row.materialId > 0 &&
    Number.isInteger(row.categoryId) &&
    row.categoryId > 0 &&
    typeof row.categoryName === 'string' &&
    typeof row.materialName === 'string' &&
    (row.grade === null || typeof row.grade === 'string') &&
    row.unit === 'KG' &&
    row.currency === 'VND' &&
    ((row.priceStatus === 'CONTACT_FOR_QUOTE' && row.unitPrice === null) ||
      (row.priceStatus === 'AVAILABLE' &&
        Number.isSafeInteger(row.unitPrice) &&
        row.unitPrice >= 0))
  )
}

export async function getCurrentPrices({ categoryId = '', page = 0, signal } = {}) {
  const params = new URLSearchParams({ page: String(page), size: '8' })
  if (categoryId) params.set('categoryId', categoryId)
  const result = await readJson(`/api/prices/current?${params}`, signal)
  if (
    !result ||
    !Array.isArray(result.data) ||
    !result.data.every(isPriceRow) ||
    !Number.isInteger(result.page) ||
    result.page < 0 ||
    !Number.isInteger(result.totalPages) ||
    result.totalPages < 0 ||
    !Number.isInteger(result.totalElements) ||
    result.totalElements < 0 ||
    typeof result.asOf !== 'string' ||
    !Number.isFinite(Date.parse(result.asOf))
  ) {
    throw new Error(DATA_ERROR)
  }
  return result
}

export async function getCategories({ signal } = {}) {
  const categories = []
  let page = 0
  let totalPages
  do {
    const result = await readJson(`/api/material-categories?page=${page}&size=100`, signal)
    if (
      !result ||
      !Array.isArray(result.data) ||
      !Number.isInteger(result.totalPages) ||
      result.totalPages < 0 ||
      result.totalPages > 1000 ||
      !result.data.every(
        (row) => row && Number.isInteger(row.id) && row.id > 0 && typeof row.name === 'string',
      )
    ) {
      throw new Error(DATA_ERROR)
    }
    categories.push(...result.data)
    totalPages = result.totalPages
    page += 1
  } while (page < totalPages)
  return categories
}
