import { orderMoney, orderQty, orderTime } from './model'

export default function OrderSummary({ order }) {
  return (
    <div className="order-detail-grid">
      <section className="workspace-panel detail-contact">
        <h2>Điểm thu gom</h2>
        <dl className="detail-fields">
          <div>
            <dt>Người liên hệ</dt>
            <dd>{order.contactName}</dd>
          </div>
          <div>
            <dt>Số điện thoại</dt>
            <dd>{order.contactPhone}</dd>
          </div>
          <div>
            <dt>Địa chỉ</dt>
            <dd>{order.address}</dd>
          </div>
          <div>
            <dt>Khung giờ (Việt Nam)</dt>
            <dd>
              {orderTime(order.pickupStart)}
              <br />
              đến {orderTime(order.pickupEnd)}
            </dd>
          </div>
          {order.sellerNote && (
            <div>
              <dt>Ghi chú</dt>
              <dd>{order.sellerNote}</dd>
            </div>
          )}
        </dl>
      </section>
      <section className="workspace-panel detail-materials">
        <h2>Vật liệu đã đăng ký</h2>
        <ul>
          {order.items.map((item) => (
            <li key={item.itemId}>
              <div>
                <h3>{item.materialName}</h3>
                <p>
                  {item.grade || 'Chưa phân hạng'} · {orderQty(item.estimatedQty)}
                </p>
                {item.note && <p>{item.note}</p>}
              </div>
              <div className="item-estimate">
                <strong>{orderMoney(item.estimatedLineTotal)}</strong>
                <span>
                  {item.priceStatus === 'CONTACT_FOR_QUOTE'
                    ? 'Liên hệ báo giá'
                    : `${orderMoney(item.estimatedUnitPrice)} / kg`}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <div className="order-total">
          <span>Tổng ước tính</span>
          <strong>{orderMoney(order.estimatedTotal)}</strong>
        </div>
        <p className="field-hint">
          Đây là ước tính lúc đặt lịch. Giá thu mua cuối cùng theo cân thực tế và báo giá được
          duyệt.
        </p>
      </section>
    </div>
  )
}
