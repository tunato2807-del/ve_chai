import { useEffect, useRef } from 'react'
import { priceStatuses, priceTime } from './prices-model'
import { orderMoney } from '../orders/model'

export default function PriceDetail({
  panel,
  disabled,
  busy,
  onOpen,
  onConfirm,
  onHistory,
  onClose,
}) {
  const { row, kind, action } = panel,
    heading = useRef(null),
    reviewing = kind === 'review'
  const label = action === 'approve' ? 'duyệt giá' : 'từ chối giá'
  useEffect(() => {
    heading.current?.focus()
  }, [row.id, kind, action])
  return (
    <section
      className="workspace-panel catalog-confirm price-detail"
      aria-labelledby="price-detail-title"
    >
      <div className="price-detail-heading">
        <div>
          <p className="admin-breadcrumb">
            {row.materialName} · {row.grade}
          </p>
          <h2 id="price-detail-title" ref={heading} tabIndex={-1}>
            {reviewing ? `Xác nhận ${label}` : `Chi tiết giá · Phiên bản ${row.versionNumber}`}
          </h2>
        </div>
        <span className={`catalog-state price-state-${row.approvalStatus.toLowerCase()}`}>
          {priceStatuses[row.approvalStatus]}
        </span>
      </div>
      <dl className="price-detail-grid">
        <div>
          <dt>Đơn giá thu mua</dt>
          <dd className="price-detail-amount">
            {orderMoney(row.unitPrice)}
            <small>/ kg</small>
          </dd>
        </div>
        <div>
          <dt>Hiệu lực từ · UTC+7</dt>
          <dd>{priceTime(row.validFrom)}</dd>
        </div>
        <div>
          <dt>Hiệu lực đến · UTC+7</dt>
          <dd>{priceTime(row.validTo)}</dd>
        </div>
        <div>
          <dt>Người tạo / Thời gian</dt>
          <dd>
            Admin #{row.createdBy}
            <small>{priceTime(row.createdAt)}</small>
          </dd>
        </div>
        <div>
          <dt>Người duyệt / Thời gian</dt>
          <dd>
            {row.approvedBy ? `Admin #${row.approvedBy}` : 'Chưa có'}
            {row.approvedAt && <small>{priceTime(row.approvedAt)}</small>}
          </dd>
        </div>
        <div>
          <dt>Mã bản giá</dt>
          <dd>
            #{row.id} · Phiên bản {row.versionNumber}
          </dd>
        </div>
      </dl>
      {reviewing ? (
        <p>
          {action === 'approve'
            ? 'Sau khi duyệt, phiên bản này không thể sửa. Nếu nhiều giá cùng hiệu lực, hệ thống chọn phiên bản cao nhất. Giá cũ không tự kết thúc và có thể được dùng lại khi bản mới hết hạn.'
            : 'Phiên bản bị từ chối sẽ được lưu trong lịch sử và không thể sửa hoặc duyệt lại. Để điều chỉnh, hãy tạo giá nháp mới.'}
        </p>
      ) : row.approvalStatus !== 'DRAFT' ? (
        <p>Phiên bản đã chốt. Để điều chỉnh, hãy tạo giá nháp mới.</p>
      ) : (
        <p>
          Giá nháp chưa được dùng cho bảng giá công khai. Xem lại đơn giá và thời gian trước khi
          duyệt.
        </p>
      )}
      <div className="catalog-actions">
        {reviewing ? (
          <>
            <button
              className="button button-primary"
              type="button"
              disabled={disabled}
              onClick={onConfirm}
            >
              {busy ? 'Đang xử lý…' : `Xác nhận ${label}`}
            </button>
            <button
              className="text-button"
              type="button"
              disabled={disabled}
              onClick={() => onOpen(row)}
            >
              Quay lại chi tiết
            </button>
          </>
        ) : (
          <>
            {row.approvalStatus === 'DRAFT' && (
              <>
                <button
                  className="button button-primary"
                  type="button"
                  disabled={disabled}
                  onClick={() => onOpen(row, 'review', 'approve')}
                >
                  Duyệt giá
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={disabled}
                  onClick={() => onOpen(row, 'review', 'reject')}
                >
                  Từ chối giá
                </button>
                <button
                  className="text-button"
                  type="button"
                  disabled={disabled}
                  onClick={() => onOpen(row, 'edit')}
                >
                  Sửa bản nháp
                </button>
              </>
            )}
            <button
              className="text-button"
              type="button"
              disabled={disabled}
              onClick={() => onHistory(row.materialId, row.materialName)}
            >
              Xem lịch sử vật liệu
            </button>
            <button className="text-button" type="button" disabled={disabled} onClick={onClose}>
              Đóng chi tiết
            </button>
          </>
        )}
      </div>
    </section>
  )
}
