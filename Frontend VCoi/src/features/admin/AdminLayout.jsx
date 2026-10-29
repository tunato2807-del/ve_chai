import { Link, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { SquaresFourIcon } from '@phosphor-icons/react/SquaresFour'
import { ClipboardTextIcon } from '@phosphor-icons/react/ClipboardText'
import { ClockIcon } from '@phosphor-icons/react/Clock'
import { UsersThreeIcon } from '@phosphor-icons/react/UsersThree'
import { TruckIcon } from '@phosphor-icons/react/Truck'
import { ArrowUpRightIcon } from '@phosphor-icons/react/ArrowUpRight'
import { RecycleIcon } from '@phosphor-icons/react/Recycle'
import { FoldersIcon } from '@phosphor-icons/react/Folders'
import { PackageIcon } from '@phosphor-icons/react/Package'
import { TagIcon } from '@phosphor-icons/react/Tag'
import { ArrowClockwiseIcon } from '@phosphor-icons/react/ArrowClockwise'
import { ChatCircleTextIcon } from '@phosphor-icons/react/ChatCircleText'
import { ChartBarIcon } from '@phosphor-icons/react/ChartBar'
import { UserCircleIcon } from '@phosphor-icons/react/UserCircle'
import { useAuth } from '../auth/context'
import AccountNav from '../auth/AccountNav'
import { adminQueues, readOrderFilters } from './api'
import '../../styles/admin.css'
import MotionMain from '../../components/MotionMain'
import ThemeToggle from '../../components/ThemeToggle'

const icons = [ClipboardTextIcon, ClockIcon, UsersThreeIcon, TruckIcon]
const closeMenu = () => {}
export default function AdminLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [params] = useSearchParams()
  const { status } = readOrderFilters(params)
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link className="admin-brand" to="/quan-tri" aria-label="VCoi quản trị đại lý">
          <RecycleIcon size={28} weight="bold" aria-hidden="true" />
          VCoi<span>/ Quản trị đại lý</span>
        </Link>
        <div className="admin-topbar-actions">
          <ThemeToggle />
          <Link className="button button-secondary admin-store-link" to="/">
            Về website <ArrowUpRightIcon size={16} aria-hidden="true" />
          </Link>
          <AccountNav closeMenu={closeMenu} showWorkspace={false} />
        </div>
      </header>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-heading">
            <SquaresFourIcon size={19} aria-hidden="true" />
            <span>Không gian quản trị</span>
          </div>
          <nav aria-label="Quản trị đại lý">
            {adminQueues.map((queue, index) => {
              const Icon = icons[index]
              const active = location.pathname === '/quan-tri' && queue.status === status
              return (
                <Link
                  key={queue.key}
                  className={active ? 'is-active' : undefined}
                  aria-current={active ? 'page' : undefined}
                  to={`/quan-tri${queue.status ? `?status=${queue.status}` : ''}`}
                  state={{ listExplicit: true }}
                >
                  <Icon size={19} aria-hidden="true" />
                  {queue.label}
                </Link>
              )
            })}
            {[
              ['/quan-tri/danh-muc', 'Danh mục', FoldersIcon],
              ['/quan-tri/vat-lieu', 'Vật liệu', PackageIcon],
              ['/quan-tri/bang-gia', 'Bảng giá', TagIcon],
              ['/quan-tri/tai-khoan', 'Tài khoản', UsersThreeIcon],
              ['/quan-tri/yeu-cau', 'Yêu cầu hủy/đổi lịch', ArrowClockwiseIcon],
              ['/quan-tri/khieu-nai', 'Khiếu nại', ChatCircleTextIcon],
              ['/quan-tri/thong-ke', 'Thống kê', ChartBarIcon],
              ['/quan-tri/ho-so', 'Hồ sơ của tôi', UserCircleIcon],
            ].map(([path, label, Icon]) => (
              <Link
                key={path}
                to={path}
                className={location.pathname === path ? 'is-active' : undefined}
                aria-current={location.pathname === path ? 'page' : undefined}
              >
                <Icon size={19} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="admin-sidebar-account">
            <span className="admin-avatar" aria-hidden="true">
              {user.fullName.trim().slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{user.fullName}</strong>
              <span>Quản trị viên</span>
            </div>
          </div>
        </aside>
        <MotionMain className="admin-content" motionPreset="admin">
          <Outlet />
        </MotionMain>
      </div>
    </div>
  )
}
