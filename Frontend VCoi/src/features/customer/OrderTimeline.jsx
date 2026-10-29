import { useState } from 'react'
import useCustomerFeed from './useCustomerFeed'
import { orderStatuses, orderTime } from '../orders/model'
import AsyncState from '../../components/AsyncState'
import Pagination from '../../components/Pagination'
import useCustomerAction from './useCustomerAction'
import ActionFeedback from '../../components/ActionFeedback'

export default function OrderTimeline({ order }) {
  const [open, setOpen] = useState(false)
  const feed = useCustomerFeed('timeline', order, open),
    state = useCustomerAction(feed.refresh)
  return (
    <details
      className="workspace-panel customer-section customer-disclosure"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <h2>Lịch sử xử lý đơn</h2>
      </summary>
      <button
        className="text-button"
        type="button"
        disabled={state.busy || feed.query.isFetching}
        onClick={() => void state.refresh()}
      >
        Tải lại lịch sử
      </button>
      <ActionFeedback state={state} />
      {feed.query.isPending ? (
        <AsyncState title="Đang tải lịch sử xử lý" busy />
      ) : feed.query.isError ? (
        <AsyncState
          title="Chưa tải được lịch sử"
          message={feed.query.error.message}
          retry={state.refresh}
        />
      ) : (
        <>
          {!feed.query.data.data.length ? (
            <p className="customer-empty">Chưa có sự kiện xử lý.</p>
          ) : (
            <ol className="customer-timeline">
              {feed.query.data.data.map((row) => (
                <li key={row.id}>
                  <time dateTime={row.changedAt}>{orderTime(row.changedAt)}</time>
                  <h3>
                    {row.oldStatus === row.newStatus
                      ? 'Cập nhật đơn thu gom'
                      : `${row.oldStatus ? `${orderStatuses[row.oldStatus]} → ` : ''}${orderStatuses[row.newStatus]}`}
                  </h3>
                  {row.reason && <p>{row.reason}</p>}
                  <span>{row.changedByName}</span>
                </li>
              ))}
            </ol>
          )}
          <Pagination
            page={feed.page}
            totalPages={feed.query.data.totalPages}
            totalElements={feed.query.data.totalElements}
            busy={feed.query.isFetching}
            onChange={feed.setPage}
          />
        </>
      )}
    </details>
  )
}
