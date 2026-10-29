import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/context'
import { getQuotes } from '../orders/quotation-api'
import QuoteCard from '../orders/QuoteCard'
import AsyncState from '../../components/AsyncState'
import QuoteDecision from './QuoteDecision'
import { canReviewQuote, respondToQuote } from './quote-review-api'
import useCustomerAction from './useCustomerAction'
import useCustomerOrder from './useCustomerOrder'
import ActionFeedback from '../../components/ActionFeedback'
import '../../styles/quotation.css'
import '../../styles/customer.css'
import useUnsavedChanges from '../navigation/useUnsavedChanges'

export default function CustomerQuotation({ order }) {
  const { user } = useAuth()
  return user?.role === 'CUSTOMER' ? <QuotationPanel key={order.id} order={order} /> : null
}
function QuotationPanel({ order }) {
  const cache = useCustomerOrder(order)
  const [decision, setDecision] = useState(null),
    [note, setNote] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const protection = useUnsavedChanges(
    Boolean(decision) && Boolean(note),
    'Ghi chú phản hồi báo giá',
  )
  const key = (version) => [...cache.scope, 'customer-quotes', String(order.id), version]
  const quotes = useQuery({
    queryKey: key(order.version),
    queryFn: ({ signal }) => getQuotes(order, { signal, role: 'CUSTOMER' }),
    retry: false,
    staleTime: 0,
  })
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])
  const state = useCustomerAction(async () => {
    const fresh = await cache.read()
    const rows = await getQuotes(fresh, { role: 'CUSTOMER' })
    if (!cache.sameSession()) return
    cache.client.setQueryData(key(fresh.version), rows)
    setDecision(null)
    setNote('')
    setNow(Date.now())
  })
  const current = quotes.data?.find((quote) => quote.current)
  const eligible = canReviewQuote(order, current, now)
  const stale =
    decision &&
    (decision.orderVersion !== order.version ||
      decision.quoteId !== current?.id ||
      decision.quoteVersion !== current?.version)
  function choose(kind) {
    setDecision({
      kind,
      orderVersion: order.version,
      quoteId: current.id,
      quoteVersion: current.version,
    })
  }
  function submit() {
    if (!decision || !eligible || stale) return
    void state.run(
      () =>
        respondToQuote({
          order,
          quote: current,
          decision: decision.kind,
          note,
          userId: cache.user.id,
        }),
      async (result) => {
        setDecision(null)
        setNote('')
        cache.client.setQueryData(
          key(result.orderVersion),
          quotes.data.map((quote) =>
            quote.id === result.id
              ? result
              : { ...quote, orderStatus: result.orderStatus, orderVersion: result.orderVersion },
          ),
        )
        await cache.commit(result)
      },
      decision.kind === 'accept'
        ? 'Bạn đã chấp thuận báo giá. Đại lý sẽ ghi nhận thanh toán.'
        : 'Bạn đã từ chối báo giá. Nhân viên sẽ xử lý lại kết quả cân và báo giá.',
    )
  }
  return (
    <section
      className="workspace-panel customer-quote-panel"
      aria-labelledby="customer-quote-title"
      aria-busy={state.busy}
    >
      <header className="panel-heading">
        <div>
          <h2 id="customer-quote-title">Báo giá thu mua</h2>
          <p className="muted">Kiểm tra khối lượng thực nhận và số tiền đại lý thu mua của bạn.</p>
        </div>
        <button
          className="text-button"
          type="button"
          disabled={state.busy || quotes.isFetching}
          onClick={() => protection.confirmDiscard(() => void state.refresh())}
        >
          Tải lại báo giá
        </button>
      </header>
      <ActionFeedback state={state} />
      {current && <QuoteCard quote={current} now={now} />}
      {quotes.isPending ? (
        <AsyncState title="Đang tải báo giá của bạn" busy />
      ) : quotes.isError ? (
        <AsyncState
          title="Chưa tải được báo giá"
          message={quotes.error.message}
          retry={state.refresh}
        />
      ) : (
        <>
          {!current && (
            <p className="customer-empty">Chưa có báo giá. Nhân viên sẽ gửi sau khi cân thực tế.</p>
          )}
          {current?.status === 'SENT' &&
            !eligible &&
            order.status === 'AWAITING_SELLER_APPROVAL' && (
              <p className="form-notice">
                Báo giá đã hết hạn hoặc thông tin vừa thay đổi. Hãy tải lại; nếu vẫn hết hạn, liên
                hệ đại lý để nhận bản mới.
              </p>
            )}
          {eligible && !decision && (
            <div className="customer-decision-actions">
              <button
                className="button button-primary"
                type="button"
                disabled={state.busy || state.blocked}
                onClick={() => choose('accept')}
              >
                Chấp thuận báo giá
              </button>
              <button
                className="button button-secondary"
                type="button"
                disabled={state.busy || state.blocked}
                onClick={() => choose('reject')}
              >
                Từ chối báo giá
              </button>
            </div>
          )}
          {eligible && decision && (
            <QuoteDecision
              decision={decision.kind}
              note={note}
              setNote={setNote}
              state={state}
              stale={stale}
              onSubmit={submit}
              onBack={() =>
                protection.confirmDiscard(() => {
                  setDecision(null)
                  setNote('')
                })
              }
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
