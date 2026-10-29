import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../features/auth/context'
import { roleConfig } from '../features/auth/roles'
import { getOrder } from '../features/orders/api'
import { orderStatuses } from '../features/orders/model'
import { listBackPath } from '../features/orders/list-location'
import OrderSummary from '../features/orders/OrderSummary'
import AdminDispatch from '../features/orders/AdminDispatch'
import AdminOrderDossier from '../features/admin/AdminOrderDossier'
import CollectorProgress from '../features/orders/CollectorProgress'
import CollectorWeighing from '../features/orders/CollectorWeighing'
import CollectorQuotation from '../features/orders/CollectorQuotation'
import CollectorPayment from '../features/orders/CollectorPayment'
import CollectorDirections from '../features/maps/CollectorDirections'
import OsmMap from '../features/maps/OsmMap'
import CustomerQuotation from '../features/customer/CustomerQuotation'
import CustomerOrderExtras from '../features/customer/CustomerOrderExtras'
import AsyncState from '../components/AsyncState'
import '../styles/workspace.css'
import { useConfirmDiscard } from '../features/navigation/useUnsavedChanges'

export default function OrderDetailPage() {
  const { user } = useAuth()
  const { id } = useParams()
  const location = useLocation()
  const confirmDiscard = useConfirmDiscard()
  const validId = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))
  const order = useQuery({
    queryKey: ['private', user.id, user.role, 'order', id],
    queryFn: ({ signal }) => getOrder({ role: user.role, id, signal }),
    enabled: validId,
    retry: false,
    staleTime: 0,
  })
  const home = roleConfig[user.role].home
  const backTo = listBackPath(home, location.state?.listPath)
  if (!validId) return <AsyncState title="Mã đơn chưa hợp lệ" />
  return (
    <section className="container workspace-page">
      <Link className="back-link" to={backTo}>
        ← Danh sách đơn thu gom
      </Link>
      {order.isPending ? (
        <AsyncState title="Đang tải chi tiết đơn" busy />
      ) : order.isError ? (
        <AsyncState
          title="Chưa xem được đơn này"
          message={order.error.message}
          retry={() => void order.refetch()}
        />
      ) : (
        <>
          <header className="workspace-heading detail-heading">
            <div>
              <p className="role-label">Đơn thu gom</p>
              <h1>{order.data.code}</h1>
            </div>
            <span className={`order-status status-${order.data.status.toLowerCase()}`}>
              {orderStatuses[order.data.status]}
            </span>
          </header>
          {location.state?.justBooked && (
            <p className="form-notice" role="status">
              Đã gửi lịch thành công. Đại lý sẽ kiểm tra và xác nhận lịch thu gom của bạn.
            </p>
          )}
          {user.role === 'ADMIN' && (
            <AdminDispatch
              key={`dispatch-${order.data.id}`}
              order={order.data}
              reloadOrder={order.refetch}
            />
          )}
          {user.role === 'COLLECTOR' && (
            <CollectorProgress
              key={`progress-${order.data.id}`}
              order={order.data}
              reloadOrder={order.refetch}
            />
          )}
          {user.role === 'COLLECTOR' && (
            <CollectorWeighing
              key={`weighing-${order.data.id}`}
              order={order.data}
              reloadOrder={order.refetch}
            />
          )}
          {user.role === 'CUSTOMER' && (
            <CustomerQuotation key={`customer-quote-${order.data.id}`} order={order.data} />
          )}
          {user.role === 'COLLECTOR' && (
            <CollectorPayment
              key={`payment-${order.data.id}`}
              order={order.data}
              reloadOrder={order.refetch}
            />
          )}
          <OrderSummary order={order.data} />
          {user.role === 'COLLECTOR' ? (
            <CollectorDirections key={`route-${user.id}-${order.data.id}`} order={order.data} />
          ) : (
            order.data.pickupLocation && (
              <section className="workspace-panel order-route" aria-label="Vị trí thu gom">
                <h2>Vị trí trên bản đồ</h2>
                <OsmMap point={order.data.pickupLocation} />
              </section>
            )
          )}
          {user.role === 'ADMIN' && (
            <AdminOrderDossier key={order.data.id} order={order.data} reloadOrder={order.refetch} />
          )}
          {user.role === 'CUSTOMER' && (
            <CustomerOrderExtras key={`customer-extras-${order.data.id}`} order={order.data} />
          )}
          {user.role === 'COLLECTOR' && (
            <CollectorQuotation
              key={`quotation-${order.data.id}`}
              order={order.data}
              reloadOrder={order.refetch}
            />
          )}
          <div className="detail-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={() => confirmDiscard(() => void order.refetch())}
              disabled={order.isFetching}
            >
              Làm mới trạng thái
            </button>
            {user.role === 'CUSTOMER' && (
              <Link className="text-link" to="/dat-lich">
                Đặt lịch khác →
              </Link>
            )}
          </div>
        </>
      )}
    </section>
  )
}
