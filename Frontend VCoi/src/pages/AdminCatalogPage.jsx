import { useConfirmDiscard } from '../features/navigation/useUnsavedChanges'
import useListSearchParams from '../features/navigation/useListSearchParams'
import { Link } from 'react-router-dom'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import AsyncState from '../components/AsyncState'
import Pagination from '../components/Pagination'
import { catalogConfig, readCatalogFilters } from '../features/admin/catalog-model'
import useAdminCatalog from '../features/admin/useAdminCatalog'
import CatalogForm from '../features/admin/CatalogForm'
import CatalogTable from '../features/admin/CatalogTable'
import CatalogFilters from '../features/admin/CatalogFilters'
import CatalogStatusConfirm from '../features/admin/CatalogStatusConfirm'
import '../styles/workspace.css'
import '../styles/forms.css'
import '../styles/admin-catalog.css'

export default function AdminCatalogPage({ kind }) {
  const confirmDiscard = useConfirmDiscard()

  const [params, setParams] = useListSearchParams(),
    meta = catalogConfig[kind]
  const filters = readCatalogFilters(kind, params),
    state = useAdminCatalog(kind, filters)
  const { rows, options, editor, status, busy, blocked, failure, notice } = state
  const editing = Boolean(editor || status),
    locked = busy || blocked
  const noCategories = kind === 'materials' && options.isSuccess && options.data.length === 0
  const needsOptions = kind === 'materials' && (!options.isSuccess || noCategories)
  function change(next) {
    setParams({
      ...(next.status && { [meta.field]: next.status }),
      ...(next.categoryId && { categoryId: next.categoryId }),
      ...(next.page > 0 && { page: String(next.page) }),
    })
  }
  return (
    <section className="admin-catalog-page">
      <header className="admin-page-heading">
        <div>
          <p className="admin-breadcrumb">Quản trị / {meta.title}</p>
          <h1>{meta.title}</h1>
          <p className="muted">
            {kind === 'categories'
              ? 'Tổ chức nhóm vật liệu và quản lý hiển thị trên website.'
              : 'Quản lý thông tin và các loại vật liệu đại lý tiếp nhận.'}
          </p>
        </div>
        <button
          className="button button-primary"
          type="button"
          disabled={locked || editing || rows.isPending || rows.isError || needsOptions}
          onClick={state.openNew}
        >
          <PlusIcon size={17} aria-hidden="true" />
          Thêm {meta.noun}
        </button>
      </header>
      <div className="catalog-toolbar">
        <p>
          {kind === 'categories'
            ? 'Ẩn nhóm không thay đổi cờ thu mua của từng vật liệu.'
            : 'Nhận thu mua và hiển thị theo danh mục là hai trạng thái riêng.'}
        </p>
        <button
          className="text-button"
          type="button"
          disabled={busy || rows.isFetching || (kind === 'materials' && options.isFetching)}
          onClick={() => confirmDiscard(() => void state.refresh())}
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
              Chưa thể lưu tiếp. Tải lại danh sách và kiểm tra kết quả; hệ thống không tự gửi lại
              yêu cầu.
            </p>
          )}
        </div>
      )}
      {kind === 'materials' && options.isError && (
        <AsyncState
          title="Chưa tải được danh mục để chọn"
          message={options.error.message}
          retry={() => confirmDiscard(() => void state.refresh())}
        />
      )}
      {editor && (
        <CatalogForm
          key={editor.initial?.id || 'new'}
          kind={kind}
          initial={editor.initial}
          categories={options.data || []}
          categoryId={filters.categoryId}
          disabled={locked || needsOptions}
          busy={busy}
          onSave={(values) => void state.save(values)}
          onClose={state.close}
        />
      )}
      {status && (
        <CatalogStatusConfirm
          kind={kind}
          change={status}
          disabled={locked}
          busy={busy}
          onConfirm={() => void state.confirmStatus()}
          onClose={state.close}
        />
      )}
      <section className="workspace-panel catalog-list" aria-labelledby="catalog-list-title">
        <div className="admin-panel-heading">
          <h2 id="catalog-list-title">Danh sách {meta.noun}</h2>
          <CatalogFilters
            kind={kind}
            filters={filters}
            options={options}
            disabled={busy || editing}
            onChange={change}
          />
        </div>
        {rows.isPending ? (
          <AsyncState title={`Đang tải ${meta.noun}`} busy />
        ) : rows.isError ? (
          <AsyncState
            title="Chưa tải được danh sách"
            message={rows.error.message}
            retry={() => confirmDiscard(() => void state.refresh())}
          />
        ) : rows.data.data.length ? (
          <CatalogTable
            kind={kind}
            rows={rows.data.data}
            disabled={locked || editing || needsOptions}
            onEdit={(row) => void state.openEdit(row)}
            onStatus={(row) => void state.openStatus(row)}
          />
        ) : noCategories ? (
          <div className="catalog-empty">
            <AsyncState
              title="Chưa có danh mục"
              message="Tạo danh mục trước khi thêm vật liệu thu mua."
            />
            <Link className="text-link" to="/quan-tri/danh-muc">
              Quản lý danh mục
            </Link>
          </div>
        ) : (
          <AsyncState
            title={`Không có ${meta.noun} phù hợp`}
            message="Thử bộ lọc khác hoặc thêm bản ghi mới."
          />
        )}
        {rows.isSuccess && (
          <Pagination
            page={filters.page}
            totalPages={rows.data.totalPages}
            totalElements={rows.data.totalElements}
            noun={meta.noun}
            ariaLabel={`Phân trang ${meta.noun}`}
            busy={busy || rows.isFetching || editing}
            onChange={(page) => change({ ...filters, page })}
          />
        )}
      </section>
    </section>
  )
}
