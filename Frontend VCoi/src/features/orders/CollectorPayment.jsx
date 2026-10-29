import { useConfirmDiscard } from '../navigation/useUnsavedChanges'
import { CurrencyCircleDollarIcon } from '@phosphor-icons/react/CurrencyCircleDollar'
import { useAuth } from '../auth/context'
import AsyncState from '../../components/AsyncState'
import useCollectorPayment from './useCollectorPayment'
import PaymentReview from './PaymentReview'
import PaymentRecords from './PaymentRecords'
import { orderMoney } from './model'
import '../../styles/quotation.css'
import '../../styles/forms.css'
import '../../styles/payment.css'

export default function CollectorPayment(props) {
  const { user } = useAuth()
  return user?.role === 'COLLECTOR' &&
    user.id === props.order.collectorId &&
    ['AWAITING_PAYMENT', 'COMPLETED', 'DISPUTED'].includes(props.order.status) ? (
    <PaymentPanel {...props} user={user} />
  ) : null
}
function PaymentPanel(props) {
  const confirmDiscard = useConfirmDiscard()

  const state = useCollectorPayment(props)
  const { context, busy, blocked, failure, notice, draft, records, eligible } = state
  return (
    <section
      className="workspace-panel quotation-panel payment-panel"
      aria-labelledby="payment-title"
      aria-busy={busy || context.isFetching}
    >
      <header className="quotation-heading">
        <span className="trip-symbol">
          <CurrencyCircleDollarIcon size={26} aria-hidden="true" />
        </span>
        <div>
          <p className="role-label">Sau khi khách duyệt giá</p>
          <h2 id="payment-title">Thanh toán mô phỏng</h2>
        </div>
        <button
          className="text-button"
          type="button"
          disabled={busy || context.isFetching}
          onClick={() => confirmDiscard(() => void state.refresh())}
        >
          Tải lại thanh toán
        </button>
      </header>
      <p className="quotation-intro">
        Đại lý chi tiền thu mua cho khách theo báo giá đã duyệt. Dữ liệu đồ án, không phát sinh giao
        dịch tiền thật.
      </p>
      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}
      {failure && (
        <div className="form-error" role="alert">
          <p>{failure.message}</p>
          {blocked && (
            <p>
              Tải lại đơn, báo giá và thanh toán để kiểm tra kết quả. Hệ thống không tự gửi lại yêu
              cầu.
            </p>
          )}
        </div>
      )}
      <PaymentRecords records={records} />
      {context.isPending ? (
        <AsyncState title="Đang tải thanh toán" busy />
      ) : context.isError ? (
        <AsyncState
          title="Chưa tải được thanh toán"
          message={context.error.message}
          retry={state.refresh}
        />
      ) : (
        <>
          {eligible && !draft && (
            <div className="payment-start">
              <div className="payment-amount">
                <span>Khoản chi theo báo giá khách đã duyệt</span>
                <strong>{orderMoney(context.data.quote.totalAmount)}</strong>
              </div>
              <button
                className="button button-primary"
                type="button"
                disabled={busy || blocked}
                onClick={() => void state.preview()}
              >
                Xem lại thanh toán
              </button>
            </div>
          )}
          {!eligible && !records.length && (
            <p className="quotation-empty">
              Đơn chưa đủ điều kiện ghi nhận thanh toán. Cần báo giá hiện hành đã được khách chấp
              thuận và đơn đang chờ thanh toán.
            </p>
          )}
        </>
      )}
      {draft && <PaymentReview state={state} />}
    </section>
  )
}
