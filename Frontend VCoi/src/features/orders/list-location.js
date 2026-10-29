export function readListPage(params) {
  const value = params.get('page') || '0'
  const page = /^\d+$/.test(value) ? Number(value) : 0
  return Number.isSafeInteger(page) && page >= 0 && page <= 2147483647 ? page : 0
}
export function listBackPath(home, candidate) {
  if (
    typeof candidate !== 'string' ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\')
  )
    return home
  const url = new URL(candidate, 'https://vcoi.invalid')
  return url.origin === 'https://vcoi.invalid' && url.pathname === home
    ? url.pathname + url.search
    : home
}
