import { lazy, Suspense, useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import PublicLayout from './components/PublicLayout'
import ServiceLayout from './components/ServiceLayout'
import HomePage from './pages/HomePage'
import PricesPage from './pages/PricesPage'
import RequireRole from './features/auth/RequireRole'
import AsyncState from './components/AsyncState'
import PageBoundary from './components/PageBoundary'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const BookingPage = lazy(() => import('./pages/BookingPage'))
const WorkspacePage = lazy(() => import('./pages/WorkspacePage'))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const CustomerAddressesPage = lazy(() => import('./pages/CustomerAddressesPage'))
const CustomerReceiptPage = lazy(() => import('./pages/CustomerReceiptPage'))
const AdminLayout = lazy(() => import('./features/admin/AdminLayout'))
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'))
const AdminCatalogPage = lazy(() => import('./pages/AdminCatalogPage'))
const AdminPricesPage = lazy(() => import('./pages/AdminPricesPage'))
const AdminAccountsPage = lazy(() => import('./pages/AdminAccountsPage'))
const AdminOrderChangesPage = lazy(() => import('./pages/AdminOrderChangesPage'))
const AdminDisputesPage = lazy(() => import('./pages/AdminDisputesPage'))
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage'))
const AdminReceiptPage = lazy(() => import('./pages/AdminReceiptPage'))

const titles = {
  '/bang-gia': 'Bảng giá thu mua',
  '/dang-nhap': 'Đăng nhập',
  '/dang-ky': 'Đăng ký khách hàng',
  '/dat-lich': 'Đặt lịch thu gom',
  '/khach-hang': 'Lịch thu gom của tôi',
  '/khach-hang/tai-khoan': 'Tài khoản của tôi',
  '/khach-hang/dia-chi': 'Địa chỉ thu gom',
  '/nhan-vien': 'Khu vực nhân viên',
  '/nhan-vien/tai-khoan': 'Tài khoản của tôi',
  '/quan-tri': 'Khu vực quản trị',
  '/quan-tri/danh-muc': 'Quản lý danh mục',
  '/quan-tri/vat-lieu': 'Quản lý vật liệu',
  '/quan-tri/bang-gia': 'Quản lý bảng giá',
  '/quan-tri/tai-khoan': 'Quản lý tài khoản',
  '/quan-tri/yeu-cau': 'Yêu cầu hủy và đổi lịch',
  '/quan-tri/khieu-nai': 'Khiếu nại của khách hàng',
  '/quan-tri/thong-ke': 'Thống kê thu mua',
  '/quan-tri/ho-so': 'Hồ sơ của tôi',
}

function ScrollToLocation() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    document.title = titles[pathname]
      ? `${titles[pathname]} | VCoi`
      : pathname.includes('/don/') && pathname.endsWith('/bien-nhan')
        ? 'Biên nhận thu mua | VCoi'
        : pathname.includes('/don/')
          ? 'Chi tiết đơn thu gom | VCoi'
          : 'VCoi | Thu gom hôm nay, xanh hơn ngày mai'
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}

export default function App() {
  const location = useLocation()
  return (
    <>
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <ScrollToLocation />
      <PageBoundary key={location.pathname}>
        <Suspense
          fallback={
            <main id="main-content" tabIndex={-1}>
              <AsyncState title="Đang mở trang" busy />
            </main>
          }
        >
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/bang-gia" element={<PricesPage />} />
            </Route>
            <Route element={<ServiceLayout account />}>
              <Route path="/dang-nhap" element={<LoginPage />} />
              <Route path="/dang-ky" element={<RegisterPage />} />
            </Route>
            <Route element={<RequireRole role="CUSTOMER" />}>
              <Route element={<ServiceLayout />}>
                <Route path="/khach-hang" element={<WorkspacePage />} />
                <Route path="/khach-hang/don/:id" element={<OrderDetailPage />} />
                <Route path="/khach-hang/don/:id/bien-nhan" element={<CustomerReceiptPage />} />
                <Route path="/khach-hang/tai-khoan" element={<AccountPage />} />
                <Route path="/khach-hang/dia-chi" element={<CustomerAddressesPage />} />
                <Route path="/dat-lich" element={<BookingPage />} />
              </Route>
            </Route>
            <Route element={<RequireRole role="COLLECTOR" />}>
              <Route element={<ServiceLayout />}>
                <Route path="/nhan-vien" element={<WorkspacePage />} />
                <Route path="/nhan-vien/don/:id" element={<OrderDetailPage />} />
                <Route path="/nhan-vien/tai-khoan" element={<AccountPage />} />
              </Route>
            </Route>
            <Route element={<RequireRole role="ADMIN" />}>
              <Route path="/quan-tri" element={<AdminLayout />}>
                <Route index element={<AdminOrdersPage />} />
                <Route
                  path="danh-muc"
                  element={<AdminCatalogPage key="categories" kind="categories" />}
                />
                <Route
                  path="vat-lieu"
                  element={<AdminCatalogPage key="materials" kind="materials" />}
                />
                <Route path="don/:id" element={<OrderDetailPage />} />
                <Route path="don/:id/bien-nhan" element={<AdminReceiptPage />} />
                <Route path="bang-gia" element={<AdminPricesPage />} />
                <Route path="tai-khoan" element={<AdminAccountsPage />} />
                <Route path="yeu-cau" element={<AdminOrderChangesPage />} />
                <Route path="khieu-nai" element={<AdminDisputesPage />} />
                <Route path="thong-ke" element={<AdminReportsPage />} />
                <Route path="ho-so" element={<AccountPage />} />
              </Route>
            </Route>
            <Route element={<PublicLayout />}>
              <Route
                path="*"
                element={
                  <section className="container not-found">
                    <p className="muted">Lỗi 404</p>
                    <h1>Trang này chưa có.</h1>
                    <p>Hãy quay về trang chủ để tiếp tục tìm hiểu về VCoi.</p>
                    <Link className="button button-primary" to="/">
                      Về trang chủ
                    </Link>
                  </section>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </PageBoundary>
    </>
  )
}
