export const roleConfig = {
  CUSTOMER: {
    home: '/khach-hang',
    label: 'Khách hàng',
    title: 'Lịch thu gom của bạn',
    ordersApi: '/api/customer/orders',
    description: 'Theo dõi các lịch đã gửi và thông tin đại lý phản hồi.',
  },
  COLLECTOR: {
    home: '/nhan-vien',
    label: 'Nhân viên thu gom',
    title: 'Lịch được phân công',
    ordersApi: '/api/collector/orders',
    description: 'Xem các đơn bạn được giao và thông tin thu gom.',
  },
  ADMIN: {
    home: '/quan-tri',
    label: 'Quản trị viên',
    title: 'Đơn thu gom tại đại lý',
    ordersApi: '/api/admin/orders',
    description: 'Theo dõi danh sách và chi tiết các đơn của đại lý.',
  },
}

export function loginDestination(role, candidate) {
  const config = roleConfig[role]
  if (!config) return '/dang-nhap'
  if (
    typeof candidate !== 'string' ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\')
  )
    return config.home
  const url = new URL(candidate, 'https://vcoi.invalid')
  const allowed =
    url.pathname === config.home ||
    url.pathname.startsWith(`${config.home}/`) ||
    (role === 'CUSTOMER' && url.pathname === '/dat-lich')
  return url.origin === 'https://vcoi.invalid' && allowed
    ? `${url.pathname}${url.search}${url.hash}`
    : config.home
}
