import { useConfirmDiscard } from '../navigation/useUnsavedChanges'
import { useAuth } from '../auth/context'
import AsyncState from '../../components/AsyncState'
import DispatchForm from './DispatchForm'
import ReassignmentForm from './ReassignmentForm'
import useAdminDispatch from './useAdminDispatch'
import '../../styles/dispatch.css'

export default function AdminDispatch(props) {
  const { user } = useAuth()
  return user.role === 'ADMIN' ? <DispatchPanel {...props} user={user} /> : null
}
function DispatchPanel({ user, order, reloadOrder }) {
  const confirmDiscard = useConfirmDiscard()

  const { collectors, busy, failure, blocked, notice, submit, refresh, formEpoch } =
    useAdminDispatch({
      user,
      order,
      reloadOrder,
    })
  const actionable =
    ['PENDING', 'CONFIRMED'].includes(order.status) &&
    order.collectorId === null &&
    order.version < 2147483647
  const assigning = order.status === 'CONFIRMED'
  const reassigning =
    order.status === 'ASSIGNED' && order.collectorId !== null && order.version < 2147483647
  const hasReplacement = collectors.data?.some((row) => row.id !== order.collectorId)
  const assigned = collectors.data?.find((row) => row.id === order.collectorId)
  return (
    <section
      className="workspace-panel dispatch-panel"
      aria-labelledby="dispatch-heading"
      aria-busy={busy}
    >
      <div className="dispatch-intro">
        <p className="role-label">Xử lý tại đại lý</p>
        <h2 id="dispatch-heading">
          {reassigning
            ? 'Phân công lại nhân viên'
            : actionable
              ? assigning
                ? 'Phân công nhân viên thu gom'
                : 'Xác nhận lịch thu gom'
              : 'Thông tin phân công'}
        </h2>
        <p className="muted">
          {reassigning
            ? 'Đổi nhân viên phụ trách trước khi khởi hành. Lịch hẹn được giữ nguyên; hệ thống kiểm tra hoạt động và lịch trùng của nhân viên mới.'
            : actionable
              ? assigning
                ? 'Chọn nhân viên đang hoạt động. Hệ thống kiểm tra trùng lịch khi bạn phân công.'
                : 'Kiểm tra địa chỉ và giờ hẹn của khách trước khi xác nhận. Sau đó bạn có thể phân công nhân viên.'
              : 'Chỉ đổi nhân viên khi đơn còn ở trạng thái Đã phân công, trước khi khởi hành.'}
        </p>
      </div>
      <div>
        {notice && (
          <p className="form-notice" role="status">
            {notice}
          </p>
        )}
        {failure && (
          <div className="form-error" role="alert">
            <p>
              {failure.status === 409
                ? 'Chưa thể xử lý: đơn đã thay đổi, nhân viên bị khóa hoặc có lịch trùng. Hãy tải lại, kiểm tra đơn và chọn nhân viên khác nếu cần.'
                : failure.status === 404
                  ? 'Không còn tìm thấy đơn hoặc nhân viên phù hợp. Hãy tải lại để kiểm tra.'
                  : failure.message}
            </p>
            {failure.uncertain && (
              <p>
                Chưa xác định thao tác đã được lưu hay chưa. Tải lại trạng thái trước khi tiếp tục;
                hệ thống không tự gửi lại.
              </p>
            )}
          </div>
        )}
        {blocked && (
          <button
            type="button"
            className="button button-secondary"
            disabled={busy}
            onClick={() => confirmDiscard(() => void refresh())}
          >
            Tải lại đơn và nhân viên
          </button>
        )}
        {(actionable || reassigning) &&
          (!assigning && !reassigning ? (
            <DispatchForm
              key="confirm"
              order={order}
              busy={busy}
              blocked={blocked}
              onSubmit={submit}
            />
          ) : collectors.isPending ? (
            <AsyncState title="Đang tải nhân viên thu gom" busy />
          ) : collectors.isError ? (
            <AsyncState
              title="Chưa tải được nhân viên"
              message={collectors.error.message}
              retry={() => void collectors.refetch()}
            />
          ) : reassigning && !hasReplacement ? (
            <AsyncState
              title="Chưa có nhân viên khác để thay thế"
              message="Hãy tạo hoặc mở khóa một nhân viên thu gom khác rồi tải lại danh sách."
              retry={() => void collectors.refetch()}
            />
          ) : !collectors.data.length ? (
            <AsyncState
              title="Chưa có nhân viên thu gom đang hoạt động"
              message="Hãy bổ sung hoặc mở khóa tài khoản nhân viên rồi tải lại danh sách để phân công."
              retry={() => void collectors.refetch()}
            />
          ) : reassigning ? (
            <ReassignmentForm
              key={`reassign-${order.version}-${formEpoch}`}
              order={order}
              collectors={collectors.data}
              busy={busy}
              blocked={blocked || collectors.isFetching}
              onSubmit={submit}
            />
          ) : (
            <DispatchForm
              key={`assign-${order.version}`}
              order={order}
              collectors={collectors.data}
              busy={busy}
              blocked={blocked || collectors.isFetching}
              onSubmit={submit}
            />
          ))}
        {!actionable &&
          (order.collectorId !== null ? (
            <div className="dispatch-assignee">
              <h3>Nhân viên phụ trách</h3>
              <p>
                {assigned
                  ? `${assigned.fullName} · ${assigned.phone}`
                  : `Mã nhân viên: ${order.collectorId}`}
              </p>
              {collectors.isPending && <p role="status">Đang tải thông tin nhân viên...</p>}
              {collectors.isError && (
                <AsyncState
                  title="Chưa tải được tên nhân viên"
                  message={collectors.error.message}
                  retry={() => void collectors.refetch()}
                />
              )}
              {!collectors.isPending && !collectors.isError && !assigned && (
                <p className="field-hint">
                  Nhân viên này không có trong danh sách đang hoạt động. Mã phụ trách lấy từ đơn
                  hiện tại.
                </p>
              )}
            </div>
          ) : (
            <p className="field-hint">Đơn hiện không có nhân viên được phân công.</p>
          ))}
      </div>
    </section>
  )
}
