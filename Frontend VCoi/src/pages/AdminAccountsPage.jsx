import { useConfirmDiscard } from '../features/navigation/useUnsavedChanges'
import { useTransition } from 'react'
import useListSearchParams from '../features/navigation/useListSearchParams'
import { UserPlusIcon } from '@phosphor-icons/react/UserPlus'
import AsyncState from '../components/AsyncState'
import Pagination from '../components/Pagination'
import { readAccountPage } from '../features/admin/accounts-model'
import useAdminAccounts from '../features/admin/useAdminAccounts'
import CollectorAccountForm from '../features/admin/CollectorAccountForm'
import AccountStatusConfirm from '../features/admin/AccountStatusConfirm'
import AccountTable from '../features/admin/AccountTable'
import '../styles/workspace.css'
import '../styles/forms.css'
import '../styles/admin-catalog.css'
import '../styles/admin-accounts.css'

export default function AdminAccountsPage() {
  const confirmDiscard = useConfirmDiscard()

  const [params, setParams] = useListSearchParams(),
    page = readAccountPage(params)
  const [navigating, startTransition] = useTransition(),
    state = useAdminAccounts(page)
  const { rows, creating, change, busy, blocked, failure, notice } = state
  const editing = creating || Boolean(change),
    locked = busy || blocked || navigating
  const refresh = () => confirmDiscard(() => void state.refresh())
  const go = (next) => startTransition(() => setParams(next > 0 ? { page: String(next) } : {}))
  return (
    <section className="admin-catalog-page admin-accounts-page">
      <header className="admin-page-heading">
        <div>
          <p className="admin-breadcrumb">Quản trị / Tài khoản</p>
          <h1>Quản lý tài khoản</h1>
          <p className="muted">Quản lý khách hàng và nhân viên thu gom của đại lý.</p>
        </div>
        <button
          className="button button-primary"
          type="button"
          disabled={locked || editing || rows.isPending || rows.isError}
          onClick={state.openCreate}
        >
          <UserPlusIcon size={17} aria-hidden="true" />
          Tạo nhân viên
        </button>
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
      {creating && (
        <CollectorAccountForm
          disabled={locked}
          busy={busy}
          onSave={state.create}
          onClose={state.close}
        />
      )}
      {change && (
        <AccountStatusConfirm
          change={change}
          disabled={locked}
          busy={busy}
          onConfirm={() => void state.confirm()}
          onClose={state.close}
        />
      )}
      <section className="workspace-panel catalog-list" aria-labelledby="account-list-title">
        <div className="admin-panel-heading">
          <h2 id="account-list-title">Danh sách tài khoản</h2>
          <p>Khách hàng · Nhân viên thu gom · ADMIN chỉ xem</p>
        </div>
        {rows.isPending ? (
          <AsyncState title="Đang tải tài khoản" busy />
        ) : rows.isError ? (
          <AsyncState
            title="Chưa tải được tài khoản"
            message={rows.error.message}
            retry={refresh}
          />
        ) : (
          <>
            {rows.data.data.length ? (
              <AccountTable
                rows={rows.data.data}
                disabled={locked || editing || rows.isFetching}
                onStatus={(row) => void state.openStatus(row)}
              />
            ) : (
              <AsyncState
                title="Chưa có tài khoản ở trang này"
                message="Thử trở về trang trước hoặc tải lại danh sách."
              />
            )}
            <Pagination
              page={page}
              totalPages={rows.data.totalPages}
              totalElements={rows.data.totalElements}
              busy={locked || editing || rows.isFetching}
              onChange={go}
              noun="tài khoản"
              ariaLabel="Phân trang tài khoản"
            />
            {rows.data.totalPages > 1 && (
              <div className="account-page-shortcuts">
                <button
                  className="text-button"
                  type="button"
                  disabled={locked || editing || rows.isFetching || page === 0}
                  onClick={() => go(0)}
                >
                  Về trang đầu
                </button>
                <button
                  className="text-button"
                  type="button"
                  disabled={
                    locked || editing || rows.isFetching || page === rows.data.totalPages - 1
                  }
                  onClick={() => go(rows.data.totalPages - 1)}
                >
                  Đến trang cuối
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </section>
  )
}
