import InputField from '../../components/InputField'
export default function QuoteDecision({ decision, note, setNote, state, stale, onSubmit, onBack }) {
  return (
    <section className="customer-confirm" aria-labelledby="quote-decision-title">
      <h3 id="quote-decision-title">
        {decision === 'accept' ? 'Xác nhận chấp thuận báo giá' : 'Xác nhận từ chối báo giá'}
      </h3>
      <p>
        {decision === 'accept'
          ? 'Bạn đồng ý với khối lượng, đơn giá và tổng tiền trong báo giá trên. Sau xác nhận, đơn chuyển sang chờ đại lý thanh toán.'
          : 'Báo giá này sẽ được ghi nhận là từ chối. Nhân viên cần kiểm tra và gửi báo giá mới cho bạn.'}
      </p>
      {stale && (
        <p className="form-error" role="alert">
          Báo giá hoặc đơn đã thay đổi. Hãy quay lại xem báo giá và chọn phản hồi lại.
        </p>
      )}
      <InputField
        id="quote-response-note"
        label="Ghi chú phản hồi (không bắt buộc)"
        as="textarea"
        rows={3}
        maxLength={500}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <div className="customer-actions">
        <button
          className="button button-primary"
          type="button"
          disabled={state.busy || state.blocked || stale}
          onClick={onSubmit}
        >
          {state.busy
            ? 'Đang xác nhận…'
            : decision === 'accept'
              ? 'Xác nhận đồng ý'
              : 'Xác nhận từ chối'}
        </button>
        <button className="text-button" type="button" disabled={state.busy} onClick={onBack}>
          Quay lại xem báo giá
        </button>
      </div>
    </section>
  )
}
