import { priceStatuses, priceTime } from './prices-model'
import { orderMoney } from '../orders/model'

export default function PriceTable({ rows, history = false, disabled, onOpen, onHistory }) {
  return (
    <div
      className="catalog-table-scroll"
      role="region"
      aria-label={
        history
          ? 'Bảng lịch sử giá, cuộn ngang để xem đủ cột'
          : 'Bảng phiên bản giá, cuộn ngang để xem đủ cột'
      }
      tabIndex={0}
    >
      <table
        className="catalog-table price-table"
        aria-label={history ? 'Lịch sử phiên bản giá' : 'Danh sách phiên bản giá'}
      >
        <thead>
          <tr>
            <th scope="col">Vật liệu / Phiên bản</th>
            <th scope="col">Đơn giá</th>
            <th scope="col">Khoảng hiệu lực · UTC+7</th>
            <th scope="col">Phê duyệt</th>
            <th scope="col">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                {row.materialName}
                <small>
                  {row.grade} · Phiên bản {row.versionNumber} · #{row.id}
                </small>
                {!history && (
                  <button
                    className="text-button price-history-link"
                    type="button"
                    disabled={disabled}
                    aria-label={`Lịch sử giá của ${row.materialName}`}
                    onClick={() => onHistory(row.materialId, row.materialName)}
                  >
                    Lịch sử
                  </button>
                )}
              </th>
              <td className="price-amount">
                {orderMoney(row.unitPrice)}
                <small>mỗi kg</small>
              </td>
              <td>
                <time dateTime={row.validFrom}>{priceTime(row.validFrom)}</time>
                <small>Đến: {priceTime(row.validTo)}</small>
              </td>
              <td>
                <span className={`catalog-state price-state-${row.approvalStatus.toLowerCase()}`}>
                  {priceStatuses[row.approvalStatus]}
                </span>
                <small>Tạo: {priceTime(row.createdAt)}</small>
              </td>
              <td>
                <div className="catalog-row-actions">
                  <button
                    className="text-button"
                    type="button"
                    disabled={disabled}
                    aria-label={`Xem giá phiên bản ${row.versionNumber} của ${row.materialName}`}
                    onClick={() => onOpen(row)}
                  >
                    Xem
                  </button>
                  {!history && row.approvalStatus === 'DRAFT' && (
                    <button
                      className="text-button"
                      type="button"
                      disabled={disabled}
                      aria-label={`Sửa giá phiên bản ${row.versionNumber} của ${row.materialName}`}
                      onClick={() => onOpen(row, 'edit')}
                    >
                      Sửa
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
