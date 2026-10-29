import { useConfirmDiscard } from '../navigation/useUnsavedChanges'
import { useState } from 'react'
import { canCancel, canReschedule } from './order-action-model'
import { submitOrderChange, withdrawChange } from './order-change-api'
import useCustomerFeed from './useCustomerFeed'
import useCustomerAction from './useCustomerAction'
import ActionFeedback from '../../components/ActionFeedback'
import OrderChangeForm from './OrderChangeForm'
import AsyncState from '../../components/AsyncState'
import Pagination from '../../components/Pagination'
import { orderTime } from '../orders/model'

const labels = {
  PENDING: 'Chờ admin xử lý',
  APPROVED: 'Đã chấp thuận',
  REJECTED: 'Đã từ chối',
  WITHDRAWN: 'Đã rút yêu cầu',
}
export default function OrderChanges({ order }) {
  const confirmDiscard = useConfirmDiscard()

  const feed = useCustomerFeed('change-requests', order)
  const [mode, setMode] = useState(null),
    [withdrawing, setWithdrawing] = useState(null)
  const state = useCustomerAction(async () => {
    await feed.refresh()
    setMode(null)
    setWithdrawing(null)
  })
  const pending = feed.query.data?.data.some((row) => row.status === 'PENDING')
  const allowed = feed.query.isSuccess && !pending && feed.page === 0 && order.version < 2147483647
  async function updated(result) {
    setMode(null)
    setWithdrawing(null)
    await feed.commit(result)
  }
  return (
    <section className="workspace-panel customer-section" aria-labelledby="order-changes-title">
      <header className="panel-heading">
        <h2 id="order-changes-title">Hủy hoặc đổi lịch</h2>
        <button
          className="text-button"
          type="button"
          disabled={state.busy || feed.query.isFetching}
          onClick={() => confirmDiscard(() => void state.refresh())}
        >
          Tải lại yêu cầu
        </button>
      </header>
      <p className="customer-description">
        Mọi yêu cầu hủy đều cần admin xác nhận. Đơn đã hoàn tất được hỗ trợ qua khiếu nại.
      </p>
      <ActionFeedback state={state} />
      {feed.query.isPending ? (
        <AsyncState title="Đang tải yêu cầu thay đổi" busy />
      ) : feed.query.isError ? (
        <AsyncState
          title="Chưa tải được yêu cầu"
          message={feed.query.error.message}
          retry={state.refresh}
        />
      ) : (
        <>
          {allowed && !mode && (
            <div className="customer-actions">
              {canReschedule(order) && (
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={state.busy || state.blocked}
                  onClick={() => setMode('RESCHEDULE')}
                >
                  {canReschedule(order) === 'DIRECT' ? 'Đổi lịch thu gom' : 'Yêu cầu đổi lịch'}
                </button>
              )}
              {canCancel(order) && (
                <button
                  className="text-button"
                  type="button"
                  disabled={state.busy || state.blocked}
                  onClick={() => setMode('CANCEL')}
                >
                  Yêu cầu hủy đơn
                </button>
              )}
            </div>
          )}
          {pending && (
            <p className="form-notice">
              Bạn có yêu cầu đang chờ admin. Hãy chờ kết quả hoặc rút yêu cầu trước khi gửi mới.
            </p>
          )}
          {feed.page > 0 && (
            <button className="text-button" type="button" onClick={() => feed.setPage(0)}>
              Về trang yêu cầu mới nhất
            </button>
          )}
          {mode && (
            <OrderChangeForm
              key={mode}
              mode={mode}
              orderVersion={order.version}
              direct={canReschedule(order) === 'DIRECT'}
              disabled={state.busy || state.blocked}
              onClose={() => setMode(null)}
              onConfirm={(values) =>
                void state.run(
                  () => submitOrderChange(order, mode, values, feed.user.id),
                  updated,
                  mode === 'RESCHEDULE' && canReschedule(order) === 'DIRECT'
                    ? 'Đã đổi lịch thu gom.'
                    : 'Đã gửi yêu cầu. Đơn chưa bị hủy; admin sẽ xử lý.',
                )
              }
            />
          )}
          <details className="customer-details">
            <summary>Lịch sử yêu cầu ({feed.query.data.totalElements})</summary>
            {!feed.query.data.data.length ? (
              <p className="customer-empty">Chưa có yêu cầu thay đổi.</p>
            ) : (
              <ol className="customer-records">
                {feed.query.data.data.map((row) => (
                  <li key={row.id}>
                    <header>
                      <h3>
                        {row.requestType === 'CANCEL' ? 'Yêu cầu hủy đơn' : 'Yêu cầu đổi lịch'}
                      </h3>
                      <span>{labels[row.status]}</span>
                    </header>
                    <p>{row.reason}</p>
                    <time dateTime={row.createdAt}>{orderTime(row.createdAt)}</time>
                    {row.newPickupStart && (
                      <p>
                        Khung giờ đề xuất: {orderTime(row.newPickupStart)} đến{' '}
                        {orderTime(row.newPickupEnd)}
                      </p>
                    )}
                    {row.responseNote && <p>Phản hồi: {row.responseNote}</p>}
                    {row.status === 'PENDING' && (
                      <button
                        className="text-button"
                        type="button"
                        disabled={state.busy || state.blocked}
                        onClick={() => setWithdrawing(row.id)}
                      >
                        Rút yêu cầu
                      </button>
                    )}
                    {withdrawing === row.id && (
                      <div className="customer-confirm">
                        <p>Rút yêu cầu này để không chờ admin xử lý nữa?</p>
                        <div className="customer-actions">
                          <button
                            className="button button-secondary"
                            type="button"
                            disabled={state.busy || state.blocked}
                            onClick={() =>
                              void state.run(
                                () => withdrawChange(order, row, feed.user.id),
                                updated,
                                'Đã rút yêu cầu thay đổi.',
                              )
                            }
                          >
                            Xác nhận rút yêu cầu
                          </button>
                          <button
                            className="text-button"
                            type="button"
                            disabled={state.busy}
                            onClick={() => setWithdrawing(null)}
                          >
                            Giữ yêu cầu
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
            <Pagination
              page={feed.page}
              totalPages={feed.query.data.totalPages}
              totalElements={feed.query.data.totalElements}
              busy={state.busy || feed.query.isFetching || Boolean(mode)}
              onChange={feed.setPage}
            />
          </details>
        </>
      )}
    </section>
  )
}
