import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRightIcon } from '@phosphor-icons/react/ArrowUpRight'
import { orderStatuses, orderTime } from '../orders/model'

export default function AdminOrderTable({ rows }) {
  const location = useLocation()
  return (
    <div
      className="admin-table-scroll"
      role="region"
      aria-label="Bảng đơn thu gom, có thể cuộn ngang"
      tabIndex={0}
    >
      <table className="admin-order-table">
        <caption className="sr-only">Các đơn thu gom của đại lý</caption>
        <thead>
          <tr>
            {['Mã đơn', 'Khách hàng', 'Lịch thu gom', 'Trạng thái', 'Thao tác'].map((label) => (
              <th scope="col" key={label}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => (
            <tr key={order.id}>
              <td>
                <strong>{order.code}</strong>
                <small>Tạo {orderTime(order.createdAt)}</small>
              </td>
              <td>
                <strong>{order.contactName}</strong>
                <small>{order.contactPhone}</small>
              </td>
              <td className="admin-pickup-cell">
                <span>{orderTime(order.pickupStart)}</span>
                <small>đến {orderTime(order.pickupEnd)}</small>
                <small className="admin-address">{order.address}</small>
              </td>
              <td>
                <span className={`order-status status-${order.status.toLowerCase()}`}>
                  {orderStatuses[order.status]}
                </span>
              </td>
              <td>
                <Link
                  className="admin-detail-link"
                  to={`/quan-tri/don/${order.id}`}
                  state={{ listPath: location.pathname + location.search }}
                  aria-label={`Xem và xử lý đơn ${order.code}`}
                >
                  Xem và xử lý <ArrowUpRightIcon size={15} aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
