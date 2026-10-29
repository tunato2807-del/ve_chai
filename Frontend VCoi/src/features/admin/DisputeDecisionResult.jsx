import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { orderTime, orderStatuses } from '../orders/model'

export default function DisputeDecisionResult({ result, disabled, onOpen, onClose }) {
  const heading = useRef(null),
    reviewing = result.status === 'IN_REVIEW'
  const label = { IN_REVIEW: 'tiếp nhận', RESOLVED: 'giải quyết', REJECTED: 'từ chối' }[
    result.status
  ]
  useEffect(() => {
    heading.current?.focus()
  }, [result.id, result.status])
  return (
    <section
      className="workspace-panel catalog-confirm dispute-result"
      aria-labelledby="dispute-result-title"
    >
      <p className="admin-breadcrumb">Kết quả từ hệ thống</p>
      <h2 id="dispute-result-title" ref={heading} tabIndex={-1}>
        Đã {label} khiếu nại #{result.id}
      </h2>
      <p>
        Đơn #{result.orderId} · {orderStatuses[result.orderStatus]}
      </p>
      {reviewing ? (
        <p>
          Khiếu nại đang được xem xét. Bạn có thể mở lại để đối chiếu thông tin và lưu kết luận.
        </p>
      ) : (
        <div className="dispute-conclusion">
          <h3>Kết luận đã lưu</h3>
          <p className="dispute-copy">{result.resolution}</p>
          <p className="field-hint">
            Admin #{result.resolvedBy} · {orderTime(result.resolvedAt)}
          </p>
        </div>
      )}
      <div className="catalog-actions">
        {reviewing && (
          <button
            className="button button-primary"
            type="button"
            disabled={disabled}
            onClick={() => void onOpen(result)}
          >
            Tiếp tục xem xét
          </button>
        )}
        <Link
          className={reviewing ? 'text-link' : 'button button-primary'}
          to={`/quan-tri/don/${result.orderId}`}
        >
          Xem đơn sau xử lý
        </Link>
        <button className="text-button" type="button" disabled={disabled} onClick={onClose}>
          Đóng kết quả
        </button>
      </div>
    </section>
  )
}
