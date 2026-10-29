import { useConfirmDiscard } from '../features/navigation/useUnsavedChanges'
import { useTransition } from 'react'
import useListSearchParams from '../features/navigation/useListSearchParams'
import InputField from '../components/InputField'
import AsyncState from '../components/AsyncState'
import Pagination from '../components/Pagination'
import { readDisputeFilters, disputeStatuses } from '../features/admin/disputes-model'
import useAdminDisputes from '../features/admin/useAdminDisputes'
import DisputeTable from '../features/admin/DisputeTable'
import DisputeDetail from '../features/admin/DisputeDetail'
import DisputeDecisionForm from '../features/admin/DisputeDecisionForm'
import DisputeDecisionResult from '../features/admin/DisputeDecisionResult'
import '../styles/workspace.css'
import '../styles/forms.css'
import '../styles/admin-catalog.css'
import '../styles/admin-disputes.css'

export default function AdminDisputesPage() {
  const confirmDiscard = useConfirmDiscard()

  const [params, setParams] = useListSearchParams(),
    filters = readDisputeFilters(params)
  const [navigating, startTransition] = useTransition(),
    state = useAdminDisputes(filters)
  const { rows, selected, action, result, busy, blocked, failure } = state
  const locked = busy || blocked || navigating,
    editing = Boolean(selected)
  const refresh = () => confirmDiscard(() => void state.refresh())
  function change(next) {
    startTransition(() =>
      setParams({
        ...(next.status !== 'OPEN' && { status: next.status || 'ALL' }),
        ...(next.page > 0 && { page: String(next.page) }),
      }),
    )
  }
  return (
    <section className="admin-catalog-page admin-disputes-page">
      <header className="admin-page-heading">
        <div>
          <p className="admin-breadcrumb">Quản trị / Hỗ trợ khách hàng</p>
          <h1>Khiếu nại của khách hàng</h1>
          <p className="muted">
            Tiếp nhận phản ánh, đối chiếu thông tin và lưu kết luận cho từng đơn thu gom.
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
              Chưa thể ghi tiếp. Tải lại danh sách rồi mở khiếu nại để xem kết quả mới nhất. Hệ
              thống không tự gửi lại quyết định.
            </p>
          )}
        </div>
      )}
      {busy && !action && (
        <p className="form-notice" role="status">
          Đang tải thông tin mới nhất…
        </p>
      )}
      {result && (
        <DisputeDecisionResult
          result={result}
          disabled={locked}
          onOpen={state.open}
          onClose={state.close}
        />
      )}
      {selected && !action && (
        <DisputeDetail
          context={selected}
          disabled={locked}
          onChoose={state.choose}
          onClose={state.close}
        />
      )}
      {selected && action && (
        <DisputeDecisionForm
          key={`${selected.dispute.id}:${action}`}
          context={selected}
          action={action}
          disabled={locked}
          busy={busy}
          onConfirm={state.submit}
          onBack={() => state.choose(null)}
        />
      )}
      <section className="workspace-panel catalog-list" aria-labelledby="dispute-list-title">
        <div className="admin-panel-heading">
          <h2 id="dispute-list-title">Danh sách khiếu nại</h2>
          <div className="catalog-filters">
            <InputField
              id="dispute-status-filter"
              label="Trạng thái khiếu nại"
              as="select"
              value={filters.status}
              disabled={busy || navigating || editing}
              onChange={(event) => change({ status: event.target.value, page: 0 })}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(disputeStatuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </InputField>
          </div>
        </div>
        {rows.isPending ? (
          <AsyncState title="Đang tải khiếu nại" busy />
        ) : rows.isError ? (
          <AsyncState
            title="Chưa tải được khiếu nại"
            message={rows.error.message}
            retry={refresh}
          />
        ) : (
          <>
            {rows.data.data.length ? (
              <DisputeTable
                rows={rows.data.data}
                disabled={locked || editing || rows.isFetching}
                onOpen={(row) => void state.open(row)}
              />
            ) : (
              <AsyncState
                title="Chưa có khiếu nại phù hợp"
                message="Không có khiếu nại trong bộ lọc hiện tại. Chọn trạng thái khác để xem các phản ánh đã xử lý."
              />
            )}
            <Pagination
              page={filters.page}
              totalPages={rows.data.totalPages}
              totalElements={rows.data.totalElements}
              busy={busy || navigating || editing || rows.isFetching}
              onChange={(page) => change({ ...filters, page })}
              noun="khiếu nại"
              ariaLabel="Phân trang khiếu nại"
            />
          </>
        )}
      </section>
    </section>
  )
}
