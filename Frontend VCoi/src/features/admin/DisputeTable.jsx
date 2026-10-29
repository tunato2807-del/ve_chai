import { Link } from 'react-router-dom'
import { orderTime, orderStatuses } from '../orders/model'
import { disputeStatuses } from './disputes-model'

export default function DisputeTable({ rows, disabled, onOpen }) {
  return (
    <div
      className="catalog-table-scroll"
      role="region"
      aria-label="Bảng khiếu nại, cuộn ngang để xem đủ cột"
      tabIndex={0}
    >
      <table className="catalog-table dispute-table" aria-label="Danh sách khiếu nại">
        <thead>
          <tr>
            <th scope="col">Khiếu nại</th>
            <th scope="col">Đơn thu gom</th>
            <th scope="col">Nội dung của khách</th>
            <th scope="col">Trạng thái</th>
            <th scope="col">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                Khiếu nại #{row.id}
                <small>{orderTime(row.createdAt)}</small>
              </th>
              <td>
                <Link className="text-link" to={`/quan-tri/don/${row.orderId}`}>
                  Đơn #{row.orderId}
                </Link>
                <small>{orderStatuses[row.orderStatus]}</small>
              </td>
              <td>
                <p className="dispute-table-reason">{row.reason}</p>
                <small>
                  Khách hàng #{row.openedBy}
                  {row.evidenceUrl ? ' · Có ảnh minh chứng' : ''}
                </small>
              </td>
              <td>
                <span className={`catalog-state ${row.status === 'RESOLVED' ? 'is-on' : ''}`}>
                  {disputeStatuses[row.status]}
                </span>
              </td>
              <td>
                <button
                  className="text-button"
                  type="button"
                  disabled={disabled}
                  aria-label={`Xem khiếu nại #${row.id}`}
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
