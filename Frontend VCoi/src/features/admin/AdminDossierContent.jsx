import { Link } from 'react-router-dom'
import WeighingHistory from '../orders/WeighingHistory'
import QuoteCard from '../orders/QuoteCard'
import PaymentRecords from '../orders/PaymentRecords'
import AdminDossierEvidence from './AdminDossierEvidence'
import AdminOrderTimeline from './AdminOrderTimeline'

export default function AdminDossierContent({ selected, order, data, page, busy, onPage }) {
  if (selected === 'weighings')
    return data.records.length ? (
      <WeighingHistory order={order} records={data.records} />
    ) : (
      <p className="dossier-empty">Nhân viên chưa ghi nhận kết quả cân cho đơn này.</p>
    )
  if (selected === 'photos') return <AdminDossierEvidence order={order} records={data.records} />
  if (selected === 'quotes')
    return data.length ? (
      <div className="dossier-quotes">
        <p className="dossier-note">Khối lượng và đơn giá được lưu tại thời điểm gửi báo giá.</p>
        {data.map((quote) => (
          <div key={quote.id}>
            <p className="dossier-quote-label">
              {quote.current ? 'Báo giá hiện hành' : 'Phiên bản lưu trữ'}
            </p>
            <QuoteCard quote={quote} />
          </div>
        ))}
      </div>
    ) : (
      <p className="dossier-empty">Chưa có báo giá cho đơn này.</p>
    )
  if (selected === 'payments')
    return (
      <div className="dossier-payments">
        <p className="dossier-note">
          Khoản đại lý chi trả cho khách được đối chiếu với báo giá đã chấp thuận. Thanh toán của đồ
          án là mô phỏng.
        </p>
        {data.payments.length ? (
          <PaymentRecords records={data.payments} />
        ) : (
          <p className="dossier-empty">Chưa ghi nhận khoản chi cho đơn này.</p>
        )}
        {data.payments.some((row) => row.status === 'COMPLETED') ? (
          <Link className="button button-primary" to={'/quan-tri/don/' + order.id + '/bien-nhan'}>
            Xem biên nhận
          </Link>
        ) : (
          <p className="dossier-note">Biên nhận được lập sau khi ghi nhận thanh toán hoàn tất.</p>
        )}
      </div>
    )
  return <AdminOrderTimeline feed={data} page={page} busy={busy} onPage={onPage} />
}
