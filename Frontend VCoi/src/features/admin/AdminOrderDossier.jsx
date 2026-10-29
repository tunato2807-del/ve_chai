import { useRef, useState } from 'react'
import { ArrowClockwiseIcon } from '@phosphor-icons/react/ArrowClockwise'
import AsyncState from '../../components/AsyncState'
import useAdminDossier from './useAdminDossier'
import AdminDossierContent from './AdminDossierContent'
import '../../styles/weighing.css'
import '../../styles/quotation.css'
import '../../styles/payment.css'
import '../../styles/admin-order-dossier.css'

const sections = [
  ['weighings', 'Cân thực tế'],
  ['photos', 'Ảnh minh chứng'],
  ['quotes', 'Báo giá'],
  ['payments', 'Thanh toán'],
  ['timeline', 'Timeline'],
]
export default function AdminOrderDossier({ order, reloadOrder }) {
  const [selected, setSelected] = useState('weighings')
  const [page, setPage] = useState(0)
  const buttons = useRef([])
  const state = useAdminDossier(order, selected, page, reloadOrder)
  const id = 'admin-dossier-' + order.id
  function select(index, focus = false) {
    setSelected(sections[index][0])
    setPage(0)
    if (focus) buttons.current[index]?.focus()
  }
  function navigate(event, index) {
    const next = {
      ArrowRight: (index + 1) % sections.length,
      ArrowLeft: (index + sections.length - 1) % sections.length,
      Home: 0,
      End: sections.length - 1,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    select(next, true)
  }
  if (!state.allowed) return <p>Hồ sơ này dành cho quản trị viên.</p>
  return (
    <section className="workspace-panel admin-order-dossier" aria-labelledby={id + '-title'}>
      <header className="dossier-heading">
        <div>
          <h2 id={id + '-title'}>Hồ sơ thu mua</h2>
          <p>Đối chiếu kết quả thu gom, chứng từ và quá trình xử lý của đơn.</p>
        </div>
        <button
          type="button"
          className="button button-secondary"
          disabled={state.busy}
          onClick={() => void state.refresh()}
        >
          <ArrowClockwiseIcon size={16} aria-hidden="true" /> Tải lại hồ sơ
        </button>
      </header>
      <div className="dossier-tabs" role="tablist" aria-label="Các mục hồ sơ thu mua">
        {sections.map(([value, label], index) => (
          <button
            key={value}
            type="button"
            role="tab"
            ref={(node) => {
              buttons.current[index] = node
            }}
            id={id + '-' + value}
            aria-controls={id + '-panel'}
            aria-selected={selected === value}
            tabIndex={selected === value ? 0 : -1}
            onKeyDown={(event) => navigate(event, index)}
            onClick={() => select(index)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className="dossier-body"
        id={id + '-panel'}
        role="tabpanel"
        aria-labelledby={id + '-' + selected}
        tabIndex={0}
        aria-busy={state.busy}
      >
        {state.error ? (
          <AsyncState
            title="Chưa tải được hồ sơ"
            message={
              state.error.status === 409
                ? 'Đơn vừa thay đổi. Tải lại hồ sơ để xem thông tin mới nhất.'
                : state.error.message
            }
          />
        ) : state.query.isPending ? (
          <AsyncState title="Đang tải hồ sơ" busy />
        ) : (
          <AdminDossierContent
            selected={selected}
            order={order}
            data={state.query.data}
            page={page}
            busy={state.busy}
            onPage={setPage}
          />
        )}
      </div>
    </section>
  )
}
