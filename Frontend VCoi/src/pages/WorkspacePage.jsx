import useListSearchParams from '../features/navigation/useListSearchParams'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { useAuth } from '../features/auth/context'
import { roleConfig } from '../features/auth/roles'
import { getOrders } from '../features/orders/api'
import OrderList from '../features/orders/OrderList'
import { readListPage } from '../features/orders/list-location'
import Pagination from '../components/Pagination'
import AsyncState from '../components/AsyncState'
import '../styles/workspace.css'

export default function WorkspacePage() {
  const { user } = useAuth()
  const [params, setParams] = useListSearchParams()
  const location = useLocation()
  const page = readListPage(params)
  function setPage(next) {
    setParams((current) => {
      const changed = new URLSearchParams(current)
      if (next === 0) changed.delete('page')
      else changed.set('page', String(next))
      return changed
    })
  }
  const config = roleConfig[user.role]
  const orders = useQuery({
    queryKey: ['private', user.id, user.role, 'orders', page],
    queryFn: ({ signal }) => getOrders({ role: user.role, page, signal }),
    retry: false,
    staleTime: 0,
  })
  return (
    <section className="container workspace-page">
      <header className="workspace-heading">
        <div>
          <p className="role-label">{config.label}</p>
          <h1>{config.title}</h1>
          <p className="muted">
            Chào {user.fullName}. {config.description}
          </p>
        </div>
        {user.role === 'CUSTOMER' && (
          <Link className="button button-primary" to="/dat-lich">
            <PlusIcon size={19} aria-hidden="true" />
            Đặt lịch mới
          </Link>
        )}
      </header>
      <section className="workspace-panel" aria-label="Danh sách đơn thu gom">
        <div className="panel-heading">
          <h2>Đơn thu gom</h2>
          <button
            className="text-button"
            type="button"
            onClick={() => void orders.refetch()}
            disabled={orders.isFetching}
          >
            {orders.isFetching ? 'Đang tải...' : 'Tải lại danh sách'}
          </button>
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
          <OrderList
            rows={orders.data.data}
            home={config.home}
            listPath={location.pathname + location.search}
          />
        ) : (
          <AsyncState
            title={user.role === 'COLLECTOR' ? 'Chưa có đơn được phân công' : 'Chưa có đơn thu gom'}
            message={
              user.role === 'CUSTOMER'
                ? 'Bạn có thể gửi lịch đầu tiên bằng nút Đặt lịch mới.'
                : 'Các đơn phù hợp sẽ xuất hiện tại đây.'
            }
          />
        )}
        {orders.data && !orders.isError && (
          <Pagination
            page={page}
            totalPages={orders.data.totalPages}
            totalElements={orders.data.totalElements}
            busy={orders.isFetching}
            onChange={setPage}
          />
        )}
      </section>
    </section>
  )
}
