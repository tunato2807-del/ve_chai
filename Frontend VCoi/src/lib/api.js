export class ApiError extends Error {
  constructor(message, { status = 0, uncertain = false, cause } = {}) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
    this.uncertain = uncertain
  }
}

function errorMessage(path, status) {
  if (status === 400 && path === '/api/auth/password')
    return 'Mật khẩu hiện tại chưa đúng hoặc mật khẩu mới chưa hợp lệ.'
  if (status === 400 && path.startsWith('/api/auth/'))
    return 'Thông tin tài khoản chưa hợp lệ. Vui lòng kiểm tra các trường đã nhập.'
  if (status === 401)
    return path === '/api/auth/login'
      ? 'Số điện thoại, email hoặc mật khẩu chưa đúng.'
      : 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403)
    return 'Bạn không có quyền thực hiện hoặc phiên bảo mật đã thay đổi. Hãy tải lại trang và thử lại.'
  if (status === 404)
    return path.startsWith('/api/customer/addresses')
      ? 'Không tìm thấy địa chỉ trong tài khoản của bạn.'
      : 'Không tìm thấy đơn trong phạm vi tài khoản của bạn.'
  if (status === 409 && path === '/api/auth/register')
    return 'Số điện thoại hoặc email này đã được đăng ký.'
  if (status === 409 && path === '/api/auth/profile')
    return 'Email này đã được sử dụng. Hãy tải lại hồ sơ và chọn email khác.'
  if (status === 409) return 'Dữ liệu đã thay đổi. Hãy tải lại thông tin trước khi tiếp tục.'
  if (status === 429) return 'Bạn thao tác quá nhanh. Vui lòng đợi một lúc rồi thử lại.'
  if (status === 413) return 'Ảnh vượt giới hạn 5 MB. Hãy chọn ảnh nhỏ hơn.'
  if (status === 415) return 'Định dạng chưa phù hợp. Hãy chọn ảnh JPEG hoặc PNG.'
  if (status === 400)
    return 'Thông tin chưa hợp lệ hoặc vật liệu không còn được tiếp nhận. Vui lòng kiểm tra và tải lại dữ liệu.'
  return 'Chưa thể kết nối hệ thống. Vui lòng thử lại sau.'
}

async function send(path, { method = 'GET', body, formData, signal, token } = {}) {
  const writing = method !== 'GET'
  let response
  try {
    const timeout = AbortSignal.timeout(writing ? 30_000 : 10_000)
    response = await fetch(path, {
      method,
      credentials: 'include',
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !formData && { 'Content-Type': 'application/json' }),
        ...(token && { 'X-CSRF-TOKEN': token }),
      },
      ...(formData ? { body: formData } : body !== undefined && { body: JSON.stringify(body) }),
    })
  } catch (cause) {
    if (signal?.aborted) throw cause
    throw new ApiError(errorMessage(path, 0), { cause, uncertain: writing })
  }
  signal?.throwIfAborted()
  if (!response.ok) {
    if (
      response.status === 401 &&
      (!path.startsWith('/api/auth/') || ['/api/auth/profile', '/api/auth/password'].includes(path))
    )
      window.dispatchEvent(new Event('vcoi:session-expired'))
    throw new ApiError(errorMessage(path, response.status), {
      status: response.status,
      uncertain: writing && response.status >= 500,
    })
  }
  if (response.status === 204) return null
  try {
    return await response.json()
  } catch (cause) {
    throw new ApiError(
      'Phản hồi chưa hợp lệ. Vui lòng kiểm tra lại trạng thái trước khi thử tiếp.',
      { cause, uncertain: writing },
    )
  }
}

export async function apiRequest(path, options = {}) {
  if (!path.startsWith('/api/') || path.includes('\\'))
    throw new ApiError('Đường dẫn API không hợp lệ.')
  if (options.formData && options.body !== undefined)
    throw new ApiError('Không thể gửi đồng thời JSON và ảnh trong cùng yêu cầu.')
  if (options.method && options.method !== 'GET') {
    const csrf = await send('/api/auth/csrf', { signal: options.signal })
    if (csrf?.headerName !== 'X-CSRF-TOKEN' || typeof csrf.token !== 'string' || !csrf.token)
      throw new ApiError('Chưa lấy được mã bảo mật. Vui lòng tải lại trang.')
    return send(path, { ...options, token: csrf.token })
  }
  return send(path, options)
}
