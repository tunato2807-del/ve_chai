import { useConfirmDiscard } from '../navigation/useUnsavedChanges'
import { CheckIcon } from '@phosphor-icons/react/Check'
import { TruckIcon } from '@phosphor-icons/react/Truck'
import { useAuth } from '../auth/context'
import { progressSteps } from './progress-api'
import useCollectorProgress from './useCollectorProgress'
import CollectorProgressForm from './CollectorProgressForm'
import '../../styles/collector-progress.css'

const stages = [
  ['ASSIGNED', 'Đã phân công'],
  ['EN_ROUTE', 'Đang đến'],
  ['ARRIVED', 'Đã đến nơi'],
]

export default function CollectorProgress(props) {
  const { user } = useAuth()
  return user?.role === 'COLLECTOR' &&
    props.order.collectorId === user.id &&
    stages.some(([status]) => status === props.order.status) ? (
    <ProgressPanel {...props} user={user} />
  ) : null
}

function ProgressPanel({ user, order, reloadOrder }) {
  const confirmDiscard = useConfirmDiscard()

  const { busy, blocked, failure, notice, submit, refresh } = useCollectorProgress({
    user,
    order,
    reloadOrder,
  })
  const step = progressSteps[order.status]
  const current = stages.findIndex(([status]) => status === order.status)
  const exhausted = order.version >= 2147483647
  return (
    <section className="workspace-panel trip-panel" aria-labelledby="trip-title" aria-busy={busy}>
      <header className="trip-heading">
        <span className="trip-symbol">
          <TruckIcon size={26} aria-hidden="true" />
        </span>
        <div>
          <p className="role-label">Chuyến thu gom của bạn</p>
          <h2 id="trip-title">Tiến độ thu gom</h2>
        </div>
      </header>
      <ol className="trip-track" aria-label="Các bước di chuyển">
        {stages.map(([status, label], index) => (
          <li
            key={status}
            className={index <= current ? 'is-reached' : undefined}
            aria-current={index === current ? 'step' : undefined}
          >
            <span className="trip-marker" aria-hidden="true">
              {index < current ? <CheckIcon size={17} /> : index + 1}
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ol>
      <div className="trip-content">
        <div className="trip-explanation">
          <h3>
            {order.status === 'ASSIGNED'
              ? 'Sẵn sàng khởi hành'
              : order.status === 'EN_ROUTE'
                ? 'Bạn đang di chuyển'
                : 'Đã đến điểm thu gom'}
          </h3>
          <p>
            {order.status === 'ASSIGNED'
              ? 'Kiểm tra địa chỉ và giờ hẹn bên dưới. Bấm Khởi hành khi bạn bắt đầu đến chỗ khách.'
              : order.status === 'EN_ROUTE'
                ? 'Chỉ xác nhận đã đến khi bạn có mặt tại điểm thu gom. Dừng xe an toàn trước khi thao tác.'
                : 'Trạng thái đã được lưu. Bạn có thể đối chiếu vật liệu với khách trước bước cân thực tế.'}
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
                  ? 'Đơn đã thay đổi hoặc không còn ở bước phù hợp. Hãy tải lại tiến độ để kiểm tra.'
                  : failure.status === 404
                    ? 'Không còn tìm thấy đơn trong phân công của bạn. Hãy tải lại hoặc quay về danh sách.'
                    : failure.message}
              </p>
              {failure.uncertain && (
                <p>
                  Chưa xác định thao tác đã được lưu hay chưa. Hãy tải lại tiến độ; hệ thống không
                  tự gửi lại.
                </p>
              )}
            </div>
          )}
          {blocked && (
            <button
              className="button button-secondary"
              type="button"
              disabled={busy}
              onClick={() => confirmDiscard(() => void refresh())}
            >
              Tải lại tiến độ
            </button>
          )}
          {exhausted && step && (
            <p className="form-error" role="alert">
              Đơn đã đạt giới hạn cập nhật. Vui lòng liên hệ quản trị viên.
            </p>
          )}
          {step && (
            <CollectorProgressForm
              key={`${order.status}-${order.version}`}
              step={step}
              busy={busy}
              blocked={blocked || exhausted}
              onSubmit={submit}
            />
          )}
          {!step && !notice && (
            <p className="form-notice" role="status">
              Đã ghi nhận bạn đến điểm thu gom.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
