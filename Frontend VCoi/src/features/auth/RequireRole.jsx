import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './context'
import { roleConfig } from './roles'
import AsyncState from '../../components/AsyncState'
import ServiceLayout from '../../components/ServiceLayout'

export default function RequireRole({ role }) {
  const auth = useAuth()
  const location = useLocation()
  if (auth.isChecking)
    return (
      <ServiceLayout>
        <AsyncState title="Đang kiểm tra phiên đăng nhập" busy />
      </ServiceLayout>
    )
  if (auth.error)
    return (
      <ServiceLayout>
        <AsyncState
          title="Chưa kiểm tra được phiên đăng nhập"
          message="Bạn hãy kiểm tra kết nối rồi thử lại."
          retry={() => void auth.retry()}
        />
      </ServiceLayout>
    )
  if (!auth.user)
    return (
      <Navigate
        to="/dang-nhap"
        replace
        state={{ returnTo: `${location.pathname}${location.search}` }}
      />
    )
  if (auth.user.role !== role)
    return (
      <ServiceLayout>
        <section className="container not-found">
          <h1>Trang này dành cho vai trò khác</h1>
          <p>Tài khoản của bạn là {roleConfig[auth.user.role].label.toLowerCase()}.</p>
          <Link to={roleConfig[auth.user.role].home} className="button button-primary">
            Về khu vực của tôi
          </Link>
        </section>
      </ServiceLayout>
    )
  return <Outlet />
}
