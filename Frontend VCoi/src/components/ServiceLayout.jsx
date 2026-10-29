import { Link, NavLink, Outlet } from 'react-router-dom'
import { ArrowUpRightIcon } from '@phosphor-icons/react/ArrowUpRight'
import { RecycleIcon } from '@phosphor-icons/react/Recycle'
import AccountNav from '../features/auth/AccountNav'
import { useAuth } from '../features/auth/context'
import { roleConfig } from '../features/auth/roles'
import '../styles/service.css'
import MotionMain from './MotionMain'
import ThemeToggle from './ThemeToggle'
import { CalendarCheckIcon } from '@phosphor-icons/react/CalendarCheck'
import { MapPinIcon } from '@phosphor-icons/react/MapPin'
import { UserCircleIcon } from '@phosphor-icons/react/UserCircle'
import { PlusIcon } from '@phosphor-icons/react/Plus'

const closeMenu = () => {}
export default function ServiceLayout({ children, account = false }) {
  const { user } = useAuth()
  const config = user ? roleConfig[user.role] : null
  return (
    <div className="service-shell">
      <header className="service-topbar">
        <Link className="service-brand" to={account || !config ? '/' : config.home}>
          <RecycleIcon size={28} weight="bold" aria-hidden="true" />
          VCoi<span>/ {account ? 'Tài khoản' : config?.label || 'Không gian làm việc'}</span>
        </Link>
        <div className="service-topbar-actions">
          <ThemeToggle />
          <Link className="button button-secondary" to="/">
            Về website <ArrowUpRightIcon size={16} aria-hidden="true" />
          </Link>
          {!account && user && <AccountNav closeMenu={closeMenu} showWorkspace={false} />}
        </div>
      </header>
      {!account && config && (
        <nav className="service-navigation" aria-label="Không gian làm việc">
          <NavLink to={config.home} end>
            <CalendarCheckIcon size={18} aria-hidden="true" />
            {user.role === 'COLLECTOR'
              ? 'Đơn được phân công'
              : user.role === 'ADMIN'
                ? 'Quản trị đại lý'
                : 'Lịch thu gom của tôi'}
          </NavLink>
          {user.role === 'CUSTOMER' && (
            <NavLink to="/dat-lich">
              <PlusIcon size={18} aria-hidden="true" />
              Đặt lịch thu gom
            </NavLink>
          )}
          {user.role === 'CUSTOMER' && (
            <NavLink to="/khach-hang/dia-chi">
              <MapPinIcon size={18} aria-hidden="true" />
              Địa chỉ thu gom
            </NavLink>
          )}
          {user.role === 'CUSTOMER' && (
            <NavLink to="/khach-hang/tai-khoan">
              <UserCircleIcon size={18} aria-hidden="true" />
              Tài khoản của tôi
            </NavLink>
          )}
          {user.role === 'COLLECTOR' && (
            <NavLink to="/nhan-vien/tai-khoan">
              <UserCircleIcon size={18} aria-hidden="true" />
              Tài khoản của tôi
            </NavLink>
          )}
          <span>{user.fullName}</span>
        </nav>
      )}
      <MotionMain>{children || <Outlet />}</MotionMain>
    </div>
  )
}
