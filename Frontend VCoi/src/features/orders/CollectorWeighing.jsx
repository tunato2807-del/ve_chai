import { useConfirmDiscard } from '../navigation/useUnsavedChanges'
import { ScalesIcon } from '@phosphor-icons/react/Scales'
import { useAuth } from '../auth/context'
import AsyncState from '../../components/AsyncState'
import useWeighing from './useWeighing'
import WeighingForm from './WeighingForm'
import WeighingHistory from './WeighingHistory'
import WeighingPhoto from './WeighingPhoto'
import '../../styles/weighing.css'

export default function CollectorWeighing(props) {
  const { user } = useAuth()
  return user?.role === 'COLLECTOR' &&
    props.order.collectorId === user.id &&
    props.order.status === 'ARRIVED' ? (
    <WeighingPanel {...props} user={user} />
  ) : null
}
function WeighingPanel({ user, order, reloadOrder }) {
  const confirmDiscard = useConfirmDiscard()

  const state = useWeighing({ user, order, reloadOrder })
  const { history, busy, blocked, failure, notice, synced, submit, refresh } = state
  const mismatch = history.data && !synced
  const exhausted = order.version >= 2147483647
  return (
    <section
      className="workspace-panel weighing-panel"
      aria-labelledby="weighing-title"
      aria-busy={busy || history.isFetching}
    >
      <header className="weighing-heading">
        <span className="trip-symbol">
          <ScalesIcon size={26} aria-hidden="true" />
        </span>
        <div>
          <p className="role-label">Tại điểm thu gom</p>
          <h2 id="weighing-title">Cân thực tế</h2>
        </div>
        <button
          className="text-button"
          type="button"
          disabled={busy || history.isFetching}
          onClick={() => confirmDiscard(() => void refresh())}
        >
          Tải lại đơn và lịch sử cân
        </button>
      </header>
      <p className="weighing-intro">
        Tổng là vật liệu cùng bao bì. Bì là phần bao bì hoặc vật chứa. Khối lượng thực nhận được
        tính bằng tổng trừ bì.
      </p>
      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}
      {failure && (
        <div className="form-error" role="alert">
          <p>
            {failure.status === 409
              ? 'Đơn hoặc lần cân mới nhất đã thay đổi. Hãy tải lại trước khi tiếp tục.'
              : failure.message}
          </p>
          {failure.uncertain && (
            <p>
              Chưa xác định kết quả đã được lưu hay chưa. Tải lại đơn và lịch sử cân; hệ thống không
              tự gửi lại.
            </p>
          )}
        </div>
      )}
      {mismatch && (
        <p className="form-error" role="alert">
          Đơn và lịch sử cân chưa đồng bộ. Hãy tải lại trước khi lưu.
        </p>
      )}
      {exhausted && (
        <p className="form-error" role="alert">
          Đơn đã đạt giới hạn cập nhật. Vui lòng liên hệ quản trị viên.
        </p>
      )}
      {history.isPending ? (
        <AsyncState title="Đang tải lịch sử cân" busy />
      ) : history.isError ? (
        <AsyncState
          title="Chưa tải được lịch sử cân"
          message={history.error.message}
          retry={() => void refresh()}
        />
      ) : (
        <>
          <WeighingForm
            key={`${order.version}-${history.data.orderVersion}`}
            order={order}
            history={history.data}
            busy={busy}
            blocked={blocked || !synced || history.isFetching || exhausted}
            onSubmit={submit}
          />
          <WeighingHistory
            order={order}
            records={history.data.records}
            renderEvidence={(row) => (
              <WeighingPhoto
                key={`${row.id}-${row.photoUrl || ''}-${order.version}`}
                order={order}
                history={history.data}
                row={row}
                quotes={state.quotes}
                disabled={busy || blocked || !synced || history.isFetching || exhausted}
                onUpload={state.uploadPhoto}
              />
            )}
          />
        </>
      )}
    </section>
  )
}
