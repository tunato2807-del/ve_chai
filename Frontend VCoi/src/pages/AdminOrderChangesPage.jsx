import { useConfirmDiscard } from '../features/navigation/useUnsavedChanges'
import { useTransition } from 'react'
import useListSearchParams from '../features/navigation/useListSearchParams'
import InputField from '../components/InputField'
import AsyncState from '../components/AsyncState'
import Pagination from '../components/Pagination'
import { readChangeFilters, changeStatuses } from '../features/admin/order-changes-model'
import useAdminOrderChanges from '../features/admin/useAdminOrderChanges'
import ChangeRequestTable from '../features/admin/ChangeRequestTable'
import ChangeRequestDetail from '../features/admin/ChangeRequestDetail'
import ChangeDecisionForm from '../features/admin/ChangeDecisionForm'
import ChangeDecisionResult from '../features/admin/ChangeDecisionResult'
import '../styles/workspace.css'
import '../styles/forms.css'
import '../styles/admin-catalog.css'
import '../styles/admin-order-changes.css'

export default function AdminOrderChangesPage() {
  const confirmDiscard = useConfirmDiscard()

  const [params, setParams] = useListSearchParams(),
    filters = readChangeFilters(params)
  const [navigating, startTransition] = useTransition(),
    state = useAdminOrderChanges(filters)
  const { rows, selected, action, result, busy, blocked, failure } = state
  const locked = busy || blocked || navigating,
    editing = Boolean(selected)
  const refresh = () => confirmDiscard(() => void state.refresh())
  function change(next) {
    startTransition(() =>
      setParams({
        ...(next.status !== 'PENDING' && { status: next.status || 'ALL' }),
        ...(next.page > 0 && { page: String(next.page) }),
      }),
    )
  }
  return (
    <section className="admin-catalog-page admin-order-changes-page">
      <header className="admin-page-heading">
        <div>
          <p className="admin-breadcrumb">Quản trị / Yêu cầu hủy và đổi lịch</p>
          <h1>Yêu cầu hủy và đổi lịch</h1>
          <p className="muted">
            Xem đề nghị của khách và lưu quyết định xử lý cho từng đơn thu gom.
          </p>
        </div>
      </header>
      <div className="catalog-toolbar catalog-toolbar-actions-only">
        <button
          className="text-button"
          type="button"
          disabled={busy || navigating || rows.isFetching}
          onClick={refresh}
        >
          Tải lại danh sách
        </button>
      </div>
      {failure && (
        <div className="form-error" role="alert">
          <p>{failure.message}</p>
          {blocked && (
            <p>
              Chưa thể ghi tiếp. Tải lại danh sách, mở yêu cầu để xem đơn mới nhất rồi xác nhận lại.
              Hệ thống không tự gửi lại quyết định.
            </p>
          )}
        </div>
      )}
      {result && <ChangeDecisionResult result={result} onClose={state.close} />}
      {selected && !action && (
        <ChangeRequestDetail
          context={selected}
          disabled={locked}
          onChoose={state.choose}
          onClose={state.close}
        />
      )}
      {selected && action && (
        <ChangeDecisionForm
          key={`${selected.request.id}:${action}`}
          context={selected}
          action={action}
          disabled={locked}
          busy={busy}
          onConfirm={state.submit}
          onBack={() => state.choose(null)}
        />
      )}
      <section className="workspace-panel catalog-list" aria-labelledby="change-list-title">
        <div className="admin-panel-heading">
          <h2 id="change-list-title">Danh sách yêu cầu</h2>
          <div className="catalog-filters">
            <InputField
              id="change-status-filter"
              label="Trạng thái yêu cầu"
              as="select"
              value={filters.status}
              disabled={busy || navigating || editing}
              onChange={(event) => change({ status: event.target.value, page: 0 })}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(changeStatuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </InputField>
          </div>
        </div>
        {rows.isPending ? (
          <AsyncState title="Đang tải yêu cầu" busy />
        ) : rows.isError ? (
          <AsyncState title="Chưa tải được yêu cầu" message={rows.error.message} retry={refresh} />
        ) : (
          <>
            {rows.data.data.length ? (
              <ChangeRequestTable
                rows={rows.data.data}
                disabled={locked || editing || rows.isFetching}
                onOpen={(row) => void state.open(row)}
              />
            ) : (
              <AsyncState
                title="Chưa có yêu cầu phù hợp"
                message="Không có yêu cầu trong bộ lọc hiện tại. Bạn có thể đổi trạng thái để xem lịch sử."
              />
            )}
            <Pagination
              page={filters.page}
              totalPages={rows.data.totalPages}
              totalElements={rows.data.totalElements}
              busy={busy || navigating || editing || rows.isFetching}
              onChange={(page) => change({ ...filters, page })}
              noun="yêu cầu"
              ariaLabel="Phân trang yêu cầu thay đổi"
            />
          </>
        )}
      </section>
    </section>
  )
}
