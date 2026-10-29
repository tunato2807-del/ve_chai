import { useEffect, useRef } from 'react'
import { statusAction } from './catalog-model'

export default function CatalogStatusConfirm({ kind, change, disabled, busy, onConfirm, onClose }) {
  const heading = useRef(null),
    action = statusAction(kind, change.target)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  return (
    <section className="workspace-panel catalog-confirm" aria-labelledby="catalog-confirm-title">
      <h2 id="catalog-confirm-title" ref={heading} tabIndex={-1}>
        Xác nhận {action}
      </h2>
      <p>
        <strong>{change.row.name}</strong>
        {kind === 'materials' && ` · ${change.row.grade}`}
      </p>
      <p>
        {kind === 'categories'
          ? change.target
            ? 'Danh mục sẽ hiện lại. Các vật liệu đã ngừng thu mua vẫn giữ trạng thái ngừng.'
            : 'Danh mục và vật liệu thuộc nhóm sẽ tạm ẩn khỏi bảng giá và lựa chọn đặt lịch. Cờ thu mua riêng của vật liệu được giữ nguyên.'
          : change.target
            ? 'Vật liệu được nhận thu mua trở lại. Nếu danh mục vẫn ẩn, vật liệu chưa hiển thị công khai.'
            : 'Vật liệu sẽ không còn được chọn cho lịch mới và bảng giá công khai. Đơn, báo giá và khoản chi đã chốt được giữ lại.'}
      </p>
      <div className="catalog-actions">
        <button
          className="button button-primary"
          type="button"
          disabled={disabled}
          onClick={onConfirm}
        >
          {busy ? 'Đang cập nhật…' : `Xác nhận ${action}`}
        </button>
        <button className="text-button" type="button" disabled={disabled} onClick={onClose}>
          Giữ nguyên
        </button>
      </div>
    </section>
  )
}
