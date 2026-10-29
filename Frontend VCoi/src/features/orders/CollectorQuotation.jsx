import { useConfirmDiscard } from '../navigation/useUnsavedChanges'
import { ReceiptIcon } from '@phosphor-icons/react/Receipt'
import { useAuth } from '../auth/context'
import AsyncState from '../../components/AsyncState'
import { canSendQuote, quoteExpired } from './quotation-model'
import useQuotation from './useQuotation'
import QuotePreview from './QuotePreview'
import QuoteCard from './QuoteCard'
import '../../styles/quotation.css'

const visible = ['ARRIVED', 'AWAITING_SELLER_APPROVAL', 'AWAITING_PAYMENT', 'COMPLETED', 'DISPUTED']
export default function CollectorQuotation(props) {
  const { user } = useAuth()
  return user?.role === 'COLLECTOR' &&
    props.order.collectorId === user.id &&
    visible.includes(props.order.status) ? (
    <QuotationPanel {...props} user={user} />
  ) : null
}
function QuotationPanel({ user, order, reloadOrder }) {
  const confirmDiscard = useConfirmDiscard()

  const state = useQuotation({ user, order, reloadOrder })
  const {
    quotes,
    busy,
    blocked,
    failure,
    notice,
    draft,
    sent,
    now,
    preview,
    submit,
    refresh,
    closeDraft,
  } = state
  const current =
    quotes.data?.find((quote) => quote.current) ||
    (sent?.orderVersion === order.version ? sent : null)
  const allowed = quotes.data && canSendQuote(order, quotes.data, now)
  return (
    <section
      className="workspace-panel quotation-panel"
      aria-labelledby="quotation-title"
      aria-busy={busy || quotes.isFetching}
    >
      <header className="quotation-heading">
        <span className="trip-symbol">
          <ReceiptIcon size={26} aria-hidden="true" />
        </span>
        <div>
          <p className="role-label">Sau khi cân thực tế</p>
          <h2 id="quotation-title">Gửi báo giá</h2>
        </div>
        <button
          className="text-button"
          type="button"
          disabled={busy || quotes.isFetching}
          onClick={() => confirmDiscard(() => void refresh())}
        >
          Tải lại đơn và báo giá
        </button>
      </header>
      <p className="quotation-intro">
        Kiểm tra khối lượng đã cân và giá thu mua trước khi gửi khách duyệt. Mỗi báo giá mới có hiệu
        lực 24 giờ.
      </p>
      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}
      {failure && (
        <div className="form-error" role="alert">
          <p>
            {failure.status === 409
              ? 'Đơn, kết quả cân hoặc giá đã thay đổi; báo giá cũng có thể chưa đủ điều kiện gửi. Hãy tải lại và kiểm tra.'
              : failure.message}
          </p>
          {failure.uncertain && (
            <p>
              Chưa xác định báo giá đã được lưu hay chưa. Tải lại đơn và báo giá; hệ thống không tự
              gửi lại.
            </p>
          )}
        </div>
      )}
      {current && <QuoteCard quote={current} now={now} />}
      {quotes.isPending ? (
        <AsyncState title="Đang tải báo giá" busy />
      ) : quotes.isError ? (
        <AsyncState
          title="Chưa tải được báo giá"
          message={quotes.error.message}
          retry={() => void refresh()}
        />
      ) : (
        <>
          {!current && !draft && (
            <p className="quotation-empty">
              Chưa có báo giá đang áp dụng. Hãy cân đủ vật liệu và kiểm tra trước khi gửi.
            </p>
          )}
          {allowed && !draft && (
            <div className="quotation-start">
              {current && quoteExpired(current, now) && (
                <p className="field-hint">
                  Báo giá trước đã hết hạn. Bản mới sẽ chốt lại giá hiện hành và giữ lịch sử bản cũ.
                </p>
              )}
              <button
                className="button button-primary"
                type="button"
                disabled={busy || blocked}
                onClick={() => void preview()}
              >
                {busy ? 'Đang tải…' : 'Xem trước báo giá'}
              </button>
            </div>
          )}
          {draft && (
            <QuotePreview
              draft={draft}
              busy={busy}
              blocked={blocked}
              stale={draft.order.version !== order.version || draft.order.status !== order.status}
              onSend={() => confirmDiscard(() => void submit())}
              onClose={closeDraft}
              onReload={preview}
            />
          )}
          {quotes.data.length > 0 && (
            <details className="quote-history">
              <summary>Lịch sử báo giá ({quotes.data.length})</summary>
              {quotes.data.map((quote) => (
                <QuoteCard key={quote.id} quote={quote} now={now} compact />
              ))}
            </details>
          )}
        </>
      )}
    </section>
  )
}
