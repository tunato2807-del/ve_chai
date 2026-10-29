import { PaperPlaneTiltIcon } from '@phosphor-icons/react/PaperPlaneTilt'
import { actualKg } from './weighing-model'
import { orderMoney } from './model'

export default function QuotePreview({ draft, busy, blocked, stale, onSend, onClose, onReload }) {
  return (
    <section className="quote-preview" aria-labelledby="quote-preview-title">
      <h3 id="quote-preview-title">Kiểm tra trước khi gửi</h3>
      <p className="field-hint">
        Tính theo kết quả cân đã lưu và giá hiện hành lúc tải. Giá chính thức được hệ thống chốt khi
        bạn gửi.
      </p>
      <ul className="quote-lines">
        {draft.rows.map((row) => (
          <li key={row.itemId}>
            <div className="quote-material">
              <strong>{row.materialName}</strong>
              <small>
                {row.grade || 'Chưa phân hạng'}
                {row.weighingId && ` · Phiếu cân #${row.weighingId}`}
              </small>
            </div>
            <dl>
              <div>
                <dt>Thực nhận</dt>
                <dd>{row.qty === null ? 'Chưa cân' : actualKg(row.qty)}</dd>
              </div>
              <div>
                <dt>Đơn giá tham khảo</dt>
                <dd>{orderMoney(row.unitPrice)}</dd>
              </div>
              <div>
                <dt>Thành tiền</dt>
                <dd>{orderMoney(row.lineTotal)}</dd>
              </div>
            </dl>
            {row.problem && <p className="quote-item-problem">{row.problem}</p>}
          </li>
        ))}
      </ul>
      <div className="quote-total">
        <span>Tổng tham khảo</span>
        <strong>{orderMoney(draft.total)}</strong>
      </div>
      {!draft.ready && (
        <p className="form-error" role="alert">
          Chưa đủ kết quả cân hoặc giá hợp lệ cho mọi vật liệu. Hãy kiểm tra cân và liên hệ admin
          cập nhật giá.
        </p>
      )}
      {stale && (
        <p className="form-error" role="alert">
          Thông tin đơn đã thay đổi. Hãy tải lại bản xem trước để tiếp tục.
        </p>
      )}
      <div className="quote-actions">
        <button
          className="button button-primary"
          type="button"
          disabled={busy || blocked || stale || !draft.ready}
          onClick={() => void onSend()}
        >
          <PaperPlaneTiltIcon size={18} aria-hidden="true" />
          {busy ? 'Đang xử lý…' : 'Gửi báo giá cho khách'}
        </button>
        <button
          className="text-button"
          type="button"
          disabled={busy || blocked}
          onClick={() => void onReload()}
        >
          Tải lại bản xem trước
        </button>
        <button className="text-button" type="button" disabled={busy} onClick={onClose}>
          Đóng bản xem trước
        </button>
      </div>
    </section>
  )
}
