import { paymentMethods } from './payment-model'
import { orderMoney } from './model'
import useUnsavedChanges from '../navigation/useUnsavedChanges'

export default function PaymentReview({ state }) {
  const { draft, busy, blocked, stale } = state
  const protection = useUnsavedChanges(
    draft.method !== 'CASH_SIMULATED',
    'Phương thức thanh toán mô phỏng',
  )
  return (
    <section className="payment-review" aria-labelledby="payment-review-title">
      <h3 id="payment-review-title">Kiểm tra trước khi hoàn tất</h3>
      <p>
        Khách đã chấp thuận báo giá lần {draft.quote.versionNumber}. Xác nhận sẽ ghi khoản chi mô
        phỏng và hoàn tất đơn.
      </p>
      <div className="payment-amount">
        <span>Tiền đại lý chi cho khách</span>
        <strong>{orderMoney(draft.quote.totalAmount)}</strong>
      </div>
      {stale && (
        <p className="form-error" role="alert">
          Đơn hoặc báo giá đã thay đổi. Hãy tải lại và xem lại thanh toán.
        </p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void state.submit()
        }}
        aria-label="Xác nhận thanh toán mô phỏng"
      >
        <fieldset className="form-fields" disabled={busy || blocked || stale}>
          <legend className="sr-only">Phương thức ghi nhận mô phỏng</legend>
          <label htmlFor="payment-method">Phương thức mô phỏng</label>
          <select
            id="payment-method"
            value={draft.method}
            onChange={(event) => state.changeMethod(event.target.value)}
          >
            {Object.entries(paymentMethods).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="quote-actions">
            <button className="button button-primary" type="submit">
              {busy ? 'Đang ghi nhận…' : 'Xác nhận thanh toán mô phỏng'}
            </button>
          </div>
        </fieldset>
        <button
          className="text-button"
          type="button"
          disabled={busy || blocked}
          onClick={() => protection.confirmDiscard(state.close)}
        >
          Quay lại
        </button>
      </form>
    </section>
  )
}
