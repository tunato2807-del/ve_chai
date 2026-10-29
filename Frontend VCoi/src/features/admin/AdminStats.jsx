import { Link } from 'react-router-dom'
import { adminQueues } from './api'

const number = new Intl.NumberFormat('vi-VN')
export default function AdminStats({ query }) {
  if (query.isError)
    return (
      <div className="admin-metrics-error" role="status">
        <p>Chưa tải được số lượng đơn. Danh sách bên dưới vẫn có thể sử dụng.</p>
        <button type="button" className="text-button" onClick={() => void query.refetch()}>
          Tải lại số liệu
        </button>
      </div>
    )
  return (
    <section className="admin-stats" aria-label="Số lượng đơn thu gom" aria-busy={query.isPending}>
      {adminQueues.map((queue, index) => (
        <Link key={queue.key} to={`/quan-tri${queue.status ? `?status=${queue.status}` : ''}`}>
          <span>{queue.metric}</span>
          <div>
            <strong>{query.data ? number.format(query.data[queue.key]) : '…'}</strong>
            <span className="admin-stat-note">{index ? 'đơn' : 'toàn bộ trạng thái'}</span>
          </div>
        </Link>
      ))}
    </section>
  )
}
