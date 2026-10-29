import EvidenceImage from '../../components/EvidenceImage'
import Pagination from '../../components/Pagination'
import { orderTime } from '../orders/model'
const labels = {
  OPEN: 'Chờ admin tiếp nhận',
  IN_REVIEW: 'Admin đang xem xét',
  RESOLVED: 'Đã có kết luận',
  REJECTED: 'Đã từ chối',
}
export default function DisputeHistory({ feed, busy }) {
  return (
    <details className="customer-details">
      <summary>Lịch sử khiếu nại ({feed.query.data.totalElements})</summary>
      {!feed.query.data.data.length ? (
        <p className="customer-empty">Chưa có khiếu nại cho đơn này.</p>
      ) : (
        <ol className="customer-records">
          {feed.query.data.data.map((row) => (
            <li key={row.id}>
              <header>
                <h3>Khiếu nại #{row.id}</h3>
                <span>{labels[row.status]}</span>
              </header>
              <p>{row.reason}</p>
              <time dateTime={row.createdAt}>{orderTime(row.createdAt)}</time>
              {row.evidenceUrl && (
                <EvidenceImage url={row.evidenceUrl} label={`Minh chứng khiếu nại #${row.id}`} />
              )}
              {row.resolution && (
                <div className="customer-resolution">
                  <strong>Kết luận của admin</strong>
                  <p>{row.resolution}</p>
                  {row.resolvedAt && (
                    <time dateTime={row.resolvedAt}>{orderTime(row.resolvedAt)}</time>
                  )}
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
        busy={busy || feed.query.isFetching}
        onChange={feed.setPage}
      />
    </details>
  )
}
