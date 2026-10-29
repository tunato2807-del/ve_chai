import { Link } from 'react-router-dom'
import { orderTime, orderStatuses } from '../orders/model'
import { changeStatuses, changeTypes } from './order-changes-model'

export default function ChangeRequestTable({ rows, disabled, onOpen }) {
  return (
    <div
      className="catalog-table-scroll"
      role="region"
      aria-label="Bảng yêu cầu hủy và đổi lịch, cuộn ngang để xem đủ cột"
      tabIndex={0}
    >
      <table className="catalog-table change-table" aria-label="Danh sách yêu cầu thay đổi">
        <thead>
          <tr>
            <th scope="col">Yêu cầu</th>
            <th scope="col">Đơn thu gom</th>
            <th scope="col">Lý do của khách</th>
            <th scope="col">Trạng thái</th>
            <th scope="col">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                {changeTypes[row.requestType]}
                <small>
                  #{row.id} · {orderTime(row.createdAt)}
                </small>
              </th>
              <td>
                <Link className="text-link" to={`/quan-tri/don/${row.orderId}`}>
                  Đơn #{row.orderId}
                </Link>
                <small>{orderStatuses[row.orderStatus]}</small>
              </td>
              <td>
                <p className="change-table-reason">{row.reason}</p>
                {row.newPickupStart && <small>Đề xuất: {orderTime(row.newPickupStart)}</small>}
              </td>
              <td>
                <span className={`catalog-state ${row.status === 'APPROVED' ? 'is-on' : ''}`}>
                  {changeStatuses[row.status]}
                </span>
              </td>
              <td>
                <button
                  className="text-button"
                  type="button"
                  disabled={disabled}
                  aria-label={`Xem yêu cầu #${row.id}`}
                  onClick={() => onOpen(row)}
                >
                  Xem
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
