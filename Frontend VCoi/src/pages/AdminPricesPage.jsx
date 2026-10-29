import { useConfirmDiscard } from '../features/navigation/useUnsavedChanges'
import useListSearchParams from '../features/navigation/useListSearchParams'
import { useTransition } from 'react'
import { Link } from 'react-router-dom'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import AsyncState from '../components/AsyncState'
import Pagination from '../components/Pagination'
import { readPriceFilters } from '../features/admin/prices-model'
import useAdminPrices from '../features/admin/useAdminPrices'
import PriceForm from '../features/admin/PriceForm'
import PriceDetail from '../features/admin/PriceDetail'
import PriceTable from '../features/admin/PriceTable'
import PriceHistory from '../features/admin/PriceHistory'
import PriceFilters from '../features/admin/PriceFilters'
import '../styles/workspace.css'
import '../styles/forms.css'
import '../styles/admin-catalog.css'
import '../styles/admin-prices.css'

export default function AdminPricesPage() {
  const confirmDiscard = useConfirmDiscard()

  const [navigating, startTransition] = useTransition()
  const [params, setParams] = useListSearchParams(),
    filters = readPriceFilters(params)
  const state = useAdminPrices(filters)
  const { rows, options, history, panel, busy, blocked, failure, notice } = state
  const locked = busy || blocked || navigating,
    editing = Boolean(panel)
  const noMaterials = options.isSuccess && options.data.length === 0
  const needsOptions = !options.isSuccess || noMaterials
  const refresh = () => confirmDiscard(() => void state.refresh()),
    open = (...args) => void state.open(...args)
  function change(next) {
    startTransition(() =>
      setParams({
        ...(next.materialId && { materialId: next.materialId }),
        ...(next.approvalStatus && { approvalStatus: next.approvalStatus }),
        ...(next.page > 0 && { page: String(next.page) }),
      }),
    )
  }
  return (
    <section className="admin-catalog-page admin-prices-page">
      <header className="admin-page-heading">
        <div>
          <p className="admin-breadcrumb">Quản trị / Bảng giá</p>
          <h1>Bảng giá thu mua</h1>
          <p className="muted">
            Chuẩn bị giá nháp, phê duyệt và theo dõi từng phiên bản của vật liệu.
          </p>
        </div>
        <button
          className="button button-primary"
          type="button"
          disabled={locked || editing || rows.isPending || rows.isError || needsOptions}
          onClick={state.openNew}
        >
          <PlusIcon size={17} aria-hidden="true" />
          Tạo giá nháp
        </button>
      </header>
      <div className="catalog-toolbar">
        <p>
          Giá đã duyệt được áp dụng theo thời gian hiệu lực và số phiên bản. Đơn và báo giá đã chốt
          giữ nguyên giá.
        </p>
        <button
          className="text-button"
          type="button"
          disabled={
            busy ||
            rows.isFetching ||
            options.isFetching ||
            (panel?.kind === 'history' && history.isFetching)
          }
          onClick={refresh}
        >
          Tải lại danh sách
        </button>
      </div>
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
              Chưa thể ghi tiếp. Tải lại danh sách và kiểm tra kết quả trước khi thao tác lại; hệ
              thống không tự gửi lại yêu cầu.
            </p>
          )}
        </div>
      )}
      {options.isError && (
        <AsyncState
          title="Chưa tải được vật liệu để chọn"
          message={options.error.message}
          retry={refresh}
        />
      )}
      {noMaterials && (
        <div className="price-no-materials">
          <p>Tạo vật liệu trước khi lập bảng giá.</p>
          <Link className="text-link" to="/quan-tri/vat-lieu">
            Quản lý vật liệu
          </Link>
        </div>
      )}
      {panel?.kind === 'edit' && (
        <PriceForm
          key={panel.row?.id || 'new'}
          initial={panel.row}
          materials={options.data || []}
          materialId={filters.materialId}
          disabled={locked || needsOptions}
          busy={busy}
          onSave={(values) => void state.save(values)}
          onClose={state.close}
        />
      )}
      {['detail', 'review'].includes(panel?.kind) && (
        <PriceDetail
          panel={panel}
          disabled={locked}
          busy={busy}
          onOpen={open}
          onConfirm={() => void state.confirm()}
          onHistory={state.openHistory}
          onClose={state.close}
        />
      )}
      {panel?.kind === 'history' ? (
        <PriceHistory
          panel={panel}
          query={history}
          disabled={locked}
          onOpen={open}
          onPage={state.historyPage}
          onClose={state.close}
          onRefresh={refresh}
        />
      ) : (
        <section className="workspace-panel catalog-list" aria-labelledby="price-list-title">
          <div className="admin-panel-heading">
            <h2 id="price-list-title">Các phiên bản giá</h2>
            <PriceFilters
              filters={filters}
              options={options}
              disabled={busy || editing || navigating}
              onChange={change}
            />
          </div>
          {rows.isPending ? (
            <AsyncState title="Đang tải phiên bản giá" busy />
          ) : rows.isError ? (
            <AsyncState
              title="Chưa tải được bảng giá"
              message={rows.error.message}
              retry={refresh}
            />
          ) : (
            <>
              {rows.data.data.length ? (
                <PriceTable
                  rows={rows.data.data}
                  disabled={locked || editing || rows.isFetching}
                  onOpen={open}
                  onHistory={state.openHistory}
                />
              ) : (
                <AsyncState
                  title="Chưa có phiên bản giá phù hợp"
                  message="Thử đổi bộ lọc hoặc tạo giá nháp cho vật liệu cần thu mua."
                />
              )}
              <Pagination
                page={filters.page}
                totalPages={rows.data.totalPages}
                totalElements={rows.data.totalElements}
                busy={busy || editing || rows.isFetching}
                onChange={(page) => change({ ...filters, page })}
                noun="phiên bản giá"
                ariaLabel="Phân trang bảng giá"
              />
            </>
          )}
        </section>
      )}
      <details className="price-rules-note">
        <summary>Cách áp dụng phiên bản và khoảng hiệu lực</summary>
        <p>
          Khoảng hiệu lực gồm thời điểm bắt đầu, không gồm thời điểm kết thúc. Khi nhiều giá đã
          duyệt cùng hiệu lực, phiên bản cao nhất được chọn. Hệ thống không tự kết thúc bản cũ; bản
          cũ còn hiệu lực có thể được áp dụng lại khi bản mới hết hạn. Vật liệu ngừng nhận hoặc danh
          mục ẩn chưa có giá công khai.
        </p>
      </details>
    </section>
  )
}
