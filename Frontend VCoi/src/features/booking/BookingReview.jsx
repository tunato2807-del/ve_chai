import { orderQty, orderTime } from '../orders/model'
import { formatPrice } from '../../lib/format'
import OsmMap from '../maps/OsmMap'

export default function BookingReview({ booking, materials, busy, error, onEdit, onConfirm }) {
  const address = booking.pickupAddress
  return (
    <section className="booking-review workspace-panel" aria-label="Xem lại lịch thu gom">
      <h2>Kiểm tra lịch trước khi gửi</h2>
      <dl className="detail-fields">
        <div>
          <dt>Người liên hệ</dt>
          <dd>
            {address.contactName} · {address.contactPhone}
          </dd>
        </div>
        <div>
          <dt>Điểm thu gom</dt>
          <dd>
            {[address.addressLine, address.ward, address.district, address.province]
              .filter(Boolean)
              .join(', ')}
          </dd>
        </div>
        <div>
          <dt>Khung giờ (Việt Nam)</dt>
          <dd>
            {orderTime(booking.pickupStart)}
            <br />
            đến {orderTime(booking.pickupEnd)}
          </dd>
        </div>
        {booking.sellerNote && (
          <div>
            <dt>Ghi chú cho đại lý</dt>
            <dd>{booking.sellerNote}</dd>
          </div>
        )}
      </dl>
      {address.location && <OsmMap point={address.location} label="Vị trí thu gom sắp gửi" />}
      <h3 className="review-materials-title">Vật liệu</h3>
      <ul className="review-items">
        {booking.items.map((item) => {
          const material = materials.find((row) => row.materialId === item.materialId)
          return (
            <li key={item.materialId}>
              <div>
                <strong>{material?.materialName}</strong>
                <p>
                  {material?.grade} · {orderQty(item.estimatedQty)}
                </p>
                {item.note && <p>{item.note}</p>}
              </div>
              <span>{material && formatPrice(material)}</span>
            </li>
          )
        })}
      </ul>
      <p className="field-hint">
        Giá hiển thị là tham khảo lúc tải vật liệu. Đại lý xác định giá theo dữ liệu hiện hành và
        kết quả cân thực tế.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="review-actions">
        <button className="button button-secondary" type="button" onClick={onEdit} disabled={busy}>
          Sửa thông tin
        </button>
        <button className="button button-primary" type="button" onClick={onConfirm} disabled={busy}>
          {busy ? 'Đang gửi lịch...' : 'Xác nhận gửi lịch'}
        </button>
      </div>
    </section>
  )
}
