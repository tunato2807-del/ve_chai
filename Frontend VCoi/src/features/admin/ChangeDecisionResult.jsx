import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { orderTime, orderStatuses } from '../orders/model'

export default function ChangeDecisionResult({ result, onClose }) {
  const heading = useRef(null),
    accepted = result.status === 'APPROVED'
  useEffect(() => {
    heading.current?.focus()
  }, [result.id, result.status])
  const reassign =
    accepted && result.requestType === 'RESCHEDULE' && result.orderStatus === 'CONFIRMED'
  return (
    <section
      className="workspace-panel catalog-confirm change-result"
      aria-labelledby="change-result-title"
    >
      <p className="admin-breadcrumb">Kết quả từ hệ thống</p>
      <h2 id="change-result-title" ref={heading} tabIndex={-1}>
        Đã {accepted ? 'chấp thuận' : 'từ chối'} yêu cầu #{result.id}
      </h2>
      <p>
        Đơn #{result.orderId} · {orderStatuses[result.orderStatus]}
      </p>
      <p>
        Admin #{result.processedBy} · {orderTime(result.processedAt)}
      </p>
      {accepted && result.requestType === 'RESCHEDULE' && (
        <p>
          Lịch được chấp thuận: {orderTime(result.newPickupStart)} đến{' '}
          {orderTime(result.newPickupEnd)} (giờ Việt Nam).
        </p>
      )}
      {result.responseNote && <p className="change-result-note">Phản hồi: {result.responseNote}</p>}
      <div className="catalog-actions">
        <Link className="button button-primary" to={`/quan-tri/don/${result.orderId}`}>
          {reassign ? 'Mở đơn để phân công lại' : 'Xem đơn sau xử lý'}
        </Link>
        <button className="text-button" type="button" onClick={onClose}>
          Đóng kết quả
        </button>
      </div>
    </section>
  )
}
