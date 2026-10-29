import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { orderTime, orderStatuses } from '../orders/model'
import { changeStatuses, changeTypes, approvalProblem, reviewProblem } from './order-changes-model'

export default function ChangeRequestDetail({ context, disabled, onChoose, onClose }) {
  const heading = useRef(null),
    { request, order } = context
  const approval = approvalProblem(context),
    reviewing = reviewProblem(context)
  useEffect(() => {
    heading.current?.focus()
  }, [request.id])
  return (
    <section
      className="workspace-panel catalog-confirm change-detail"
      aria-labelledby="change-detail-title"
    >
      <div className="change-panel-heading">
        <div>
          <p className="admin-breadcrumb">
            {changeTypes[request.requestType]} · Đơn {order.code}
          </p>
          <h2 id="change-detail-title" ref={heading} tabIndex={-1}>
            Yêu cầu #{request.id}
          </h2>
        </div>
        <span className="catalog-state">{changeStatuses[request.status]}</span>
      </div>
      <p className="change-detail-reason">{request.reason}</p>
      <dl className="change-detail-grid">
        <div>
          <dt>Khách gửi / Thời điểm</dt>
          <dd>
            Khách hàng #{request.requestedBy}
            <small>{orderTime(request.createdAt)}</small>
          </dd>
        </div>
        <div>
          <dt>Trạng thái đơn hiện tại</dt>
          <dd>
            {orderStatuses[order.status]}
            <small>
              {order.collectorId ? `Nhân viên #${order.collectorId}` : 'Chưa phân công nhân viên'}
            </small>
          </dd>
        </div>
        <div>
          <dt>Lịch đang lưu trong đơn · UTC+7</dt>
          <dd>
            {orderTime(order.pickupStart)}
            <small>Đến {orderTime(order.pickupEnd)}</small>
          </dd>
        </div>
        <div>
          <dt>Lịch lúc gửi yêu cầu · UTC+7</dt>
          <dd>
            {orderTime(request.oldPickupStart)}
            <small>Đến {orderTime(request.oldPickupEnd)}</small>
          </dd>
        </div>
        {request.requestType === 'RESCHEDULE' && (
          <div className="change-proposed">
            <dt>Lịch khách đề xuất · UTC+7</dt>
            <dd>
              {orderTime(request.newPickupStart)}
              <small>Đến {orderTime(request.newPickupEnd)}</small>
            </dd>
          </div>
        )}
        {request.processedAt && (
          <div>
            <dt>Đã xử lý / Phản hồi</dt>
            <dd>
              Tài khoản #{request.processedBy}
              <small>{orderTime(request.processedAt)}</small>
              {request.responseNote && <p>{request.responseNote}</p>}
            </dd>
          </div>
        )}
      </dl>
      {approval && <p className="form-notice">{approval}</p>}
      <div className="catalog-actions">
        {request.status === 'PENDING' && (
          <>
            <button
              className="button button-primary"
              type="button"
              disabled={disabled || Boolean(approval)}
              onClick={() => onChoose('approve')}
            >
              Chấp thuận yêu cầu
            </button>
            <button
              className="button button-secondary"
              type="button"
              disabled={disabled || Boolean(reviewing)}
              onClick={() => onChoose('reject')}
            >
              Từ chối yêu cầu
            </button>
          </>
        )}
        <Link className="text-link" to={`/quan-tri/don/${order.id}`}>
          Xem đơn thu gom
        </Link>
        <button className="text-button" type="button" disabled={disabled} onClick={onClose}>
          Đóng chi tiết
        </button>
      </div>
    </section>
  )
}
