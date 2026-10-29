import { orderTime, orderStatuses } from '../orders/model'
import Pagination from '../../components/Pagination'

export default function AdminOrderTimeline({ feed, page, busy, onPage }) {
  return (
    <>
      {!feed.data.length ? (
        <p className="dossier-empty">Chưa có sự kiện xử lý.</p>
      ) : (
        <ol className="dossier-timeline">
          {feed.data.map((event) => (
            <li key={event.id}>
              <time dateTime={event.changedAt}>{orderTime(event.changedAt)}</time>
              <div>
                <h3>
                  {event.oldStatus === event.newStatus
                    ? 'Cập nhật đơn thu gom'
                    : (event.oldStatus ? orderStatuses[event.oldStatus] + ' → ' : '') +
                      orderStatuses[event.newStatus]}
                </h3>
                {event.reason && <p>{event.reason}</p>}
                {event.oldCollectorId !== event.newCollectorId && (
                  <p className="dossier-note">
                    Phân công:{' '}
                    {event.oldCollectorId ? '#' + event.oldCollectorId : 'Chưa phân công'}
                    {' → '}
                    {event.newCollectorId ? '#' + event.newCollectorId : 'Chưa phân công'}
                  </p>
                )}
                <p className="dossier-note">
                  {event.changedByName || 'Tài khoản #' + event.changedBy}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
      <Pagination
        page={page}
        totalPages={feed.totalPages}
        totalElements={feed.totalElements}
        busy={busy}
        onChange={onPage}
        noun="sự kiện"
        ariaLabel="Phân trang lịch sử đơn"
      />
    </>
  )
}
