import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import EvidenceImage from '../../components/EvidenceImage'
import { orderTime, orderStatuses } from '../orders/model'
import { activeDispute, disputeStatuses, disputeActions, disputeProblem } from './disputes-model'

export default function DisputeDetail({ context, disabled, onChoose, onClose }) {
  const { dispute, order } = context,
    heading = useRef(null),
    active = activeDispute(dispute)
  const problem = active ? disputeProblem(context, 'resolve') : ''
  useEffect(() => {
    heading.current?.focus()
  }, [dispute.id])
  return (
    <section
      className="workspace-panel catalog-confirm dispute-detail"
      aria-labelledby="dispute-detail-title"
    >
      <div className="dispute-panel-heading">
        <div>
          <p className="admin-breadcrumb">Đơn {order.code}</p>
          <h2 id="dispute-detail-title" ref={heading} tabIndex={-1}>
            Khiếu nại #{dispute.id}
          </h2>
        </div>
        <span className="catalog-state">{disputeStatuses[dispute.status]}</span>
      </div>
      <div className="dispute-body">
        <div>
          <h3>Nội dung khách gửi</h3>
          <p className="dispute-copy">{dispute.reason}</p>
          {dispute.evidenceUrl ? (
            <EvidenceImage
              key={dispute.evidenceUrl}
              url={dispute.evidenceUrl}
              label={`Minh chứng khiếu nại #${dispute.id}`}
            />
          ) : (
            <p className="field-hint">Khách không đính kèm ảnh minh chứng.</p>
          )}
        </div>
        <dl className="dispute-context">
          <div>
            <dt>Khách gửi / Thời điểm</dt>
            <dd>
              Khách hàng #{dispute.openedBy}
              <small>{orderTime(dispute.createdAt)}</small>
            </dd>
          </div>
          <div>
            <dt>Liên hệ thu gom</dt>
            <dd>
              {order.contactName}
              <small>{order.contactPhone}</small>
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
            <dt>Trạng thái trước khiếu nại</dt>
            <dd>{orderStatuses[dispute.previousOrderStatus]}</dd>
          </div>
        </dl>
      </div>
      {active ? (
        <p className="form-notice">
          Khi lưu kết luận giải quyết hoặc từ chối, đơn trở về “
          {orderStatuses[dispute.previousOrderStatus]}”. Khoản thanh toán và biên nhận đã có được
          giữ nguyên.
        </p>
      ) : (
        <div className="dispute-conclusion">
          <h3>Kết luận đã lưu</h3>
          <p className="dispute-copy">{dispute.resolution}</p>
          <p className="field-hint">
            Admin #{dispute.resolvedBy} · {orderTime(dispute.resolvedAt)}
          </p>
          <p className="field-hint">Kết luận đã chốt, không thể chỉnh sửa.</p>
        </div>
      )}
      {problem && <p className="form-notice">{problem}</p>}
      <div className="catalog-actions">
        {active &&
          ['review', 'resolve', 'reject']
            .filter((action) => action !== 'review' || dispute.status === 'OPEN')
            .map((action) => (
              <button
                key={action}
                type="button"
                className={`button ${action === 'review' || (dispute.status === 'IN_REVIEW' && action === 'resolve') ? 'button-primary' : 'button-secondary'}`}
                disabled={disabled || Boolean(disputeProblem(context, action))}
                onClick={() => onChoose(action)}
              >
                {disputeActions[action]}
              </button>
            ))}
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
