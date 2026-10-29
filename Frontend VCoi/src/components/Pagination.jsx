import { ArrowLeftIcon } from '@phosphor-icons/react/ArrowLeft'
import { ArrowRightIcon } from '@phosphor-icons/react/ArrowRight'

export default function Pagination({
  page,
  totalPages,
  totalElements,
  busy,
  onChange,
  noun = 'đơn',
  ariaLabel = 'Phân trang đơn thu gom',
}) {
  return (
    <nav className="list-pagination" aria-label={ariaLabel}>
      <p aria-live="polite">
        {totalElements} {noun}
        {totalPages > 0 && ` · Trang ${page + 1} / ${totalPages}`}
      </p>
      <div>
        <button
          className="icon-button"
          type="button"
          aria-label="Trang trước"
          disabled={page === 0 || busy}
          onClick={() => onChange(page - 1)}
        >
          <ArrowLeftIcon size={19} aria-hidden="true" />
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label="Trang sau"
          disabled={page + 1 >= totalPages || busy}
          onClick={() => onChange(page + 1)}
        >
          <ArrowRightIcon size={19} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
