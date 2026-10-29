import useListSearchParams from '../features/navigation/useListSearchParams'
import { useQuery } from '@tanstack/react-query'
import { ArrowsClockwiseIcon } from '@phosphor-icons/react/ArrowsClockwise'
import { useAuth } from '../features/auth/context'
import { getAdminCounts, getAdminOrders, readOrderFilters } from '../features/admin/api'
import { orderStatuses } from '../features/orders/model'
import AdminStats from '../features/admin/AdminStats'
import AdminOrderTable from '../features/admin/AdminOrderTable'
import AsyncState from '../components/AsyncState'
import Pagination from '../components/Pagination'
import '../styles/workspace.css'

export default function AdminOrdersPage() {
  const { user } = useAuth()
  const [params, setParams] = useListSearchParams()
  const { status, page } = readOrderFilters(params)
  const scope = ['private', user.id, 'ADMIN']
  const orders = useQuery({
    queryKey: [...scope, 'orders', page, status],
    queryFn: ({ signal }) => getAdminOrders({ page, status, signal }),
    retry: false,
    staleTime: 0,
  })
  const counts = useQuery({
    queryKey: [...scope, 'order-counts'],
    queryFn: getAdminCounts,
    retry: false,
    staleTime: 0,
  })
  function change(nextStatus, nextPage = 0) {
    setParams({
      ...(nextStatus && { status: nextStatus }),
      ...(nextPage > 0 && { page: String(nextPage) }),
    })
  }
  return (
    <section className="admin-orders-page">
      <header className="admin-page-heading">
        <div>
          <p className="admin-breadcrumb">Quản trị / Đơn thu gom</p>
          <h1>Đơn thu gom tại đại lý</h1>
        </div>
        <button
          className="button button-secondary"
          type="button"
          disabled={orders.isFetching || counts.isFetching}
          onClick={() => {
            void orders.refetch()
            void counts.refetch()
          }}
        >
          <ArrowsClockwiseIcon size={17} aria-hidden="true" />
          Tải lại danh sách
        </button>
      </header>
      <AdminStats query={counts} />
      <section
        className="workspace-panel admin-orders-panel"
        aria-labelledby="admin-orders-heading"
      >
        <div className="admin-panel-heading">
          <div>
            <h2 id="admin-orders-heading">Danh sách đơn thu gom</h2>
          </div>
          <div className="admin-status-filter">
            <label htmlFor="admin-order-status">Trạng thái</label>
            <select
              id="admin-order-status"
              value={status}
              onChange={(event) => change(event.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(orderStatuses).map(([key, label]) => (
                <option value={key} key={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {orders.isPending ? (
          <AsyncState title="Đang tải đơn thu gom" busy />
        ) : orders.isError ? (
          <AsyncState
            title="Chưa tải được danh sách"
            message={orders.error.message}
            retry={() => void orders.refetch()}
          />
        ) : orders.data.data.length ? (
          <AdminOrderTable rows={orders.data.data} />
        ) : (
          <AsyncState
            title="Chưa có đơn thu gom phù hợp"
            message={
              status
                ? 'Thử chọn trạng thái khác để xem các đơn còn lại.'
                : 'Lịch mới của khách hàng sẽ xuất hiện tại đây.'
            }
          />
        )}
        {orders.data && !orders.isError && (
          <Pagination
            page={page}
            totalPages={orders.data.totalPages}
            totalElements={orders.data.totalElements}
            busy={orders.isFetching}
            onChange={(next) => change(status, next)}
          />
        )}
      </section>
    </section>
  )
}
