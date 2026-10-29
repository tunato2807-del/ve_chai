import { actualKg } from './weighing-model'
import { orderMoney, orderTime } from './model'
import { quoteExpired } from './quotation-model'

const labels = {
  DRAFT: 'Bản nháp',
  SENT: 'Đang chờ khách duyệt',
  ACCEPTED: 'Khách đã chấp thuận',
  REJECTED: 'Khách đã từ chối',
  SUPERSEDED: 'Đã được thay thế',
}
export default function QuoteCard({ quote, now, compact = false }) {
  const expired = quoteExpired(quote, now)
  return (
    <article
      className={`quote-card ${compact ? 'quote-card-compact' : ''}`}
      aria-label={`Báo giá lần ${quote.versionNumber}`}
    >
      <header>
        <h3>Báo giá lần {quote.versionNumber}</h3>
        <span className={`order-status ${expired ? 'status-pending' : 'status-assigned'}`}>
          {expired ? 'Báo giá đã hết hạn' : labels[quote.status]}
        </span>
      </header>
      <p className="quote-date">
        Gửi lúc: {quote.sentAt ? orderTime(quote.sentAt) : 'Chưa gửi'}
        {quote.validUntil ? (
          <> · Hiệu lực đến: {orderTime(quote.validUntil)}</>
        ) : (
          ' · Không có hạn hết hiệu lực'
        )}
      </p>
      <ul className="quote-lines">
        {quote.items.map((item) => (
          <li key={item.id}>
            <div className="quote-material">
              <strong>{item.materialName}</strong>
              <small>
                {item.grade || 'Chưa phân hạng'} · Phiếu cân #{item.weighingId}
              </small>
            </div>
            <dl>
              <div>
                <dt>Thực nhận</dt>
                <dd>{actualKg(item.actualQty)}</dd>
              </div>
              <div>
                <dt>Đơn giá đã chốt</dt>
                <dd>{orderMoney(item.unitPrice)}</dd>
              </div>
              <div>
                <dt>Thành tiền</dt>
                <dd>{orderMoney(item.lineTotal)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <div className="quote-total">
        <span>Tổng báo giá</span>
        <strong>{orderMoney(quote.totalAmount)}</strong>
      </div>
      {quote.responseNote && (
        <p className="quote-response">Phản hồi của khách: {quote.responseNote}</p>
      )}
      {quote.respondedAt && (
        <p className="quote-date">Phản hồi lúc: {orderTime(quote.respondedAt)}</p>
      )}
    </article>
  )
}
