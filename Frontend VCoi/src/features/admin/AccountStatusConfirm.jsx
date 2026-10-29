import { useEffect, useRef } from 'react'
import { roleConfig } from '../auth/roles'
import { statusLabel } from './accounts-model'

export default function AccountStatusConfirm({ change, disabled, busy, onConfirm, onClose }) {
  const heading = useRef(null),
    { account, target } = change
  useEffect(() => {
    heading.current?.focus()
  }, [account.id, target])
  return (
    <section
      className="workspace-panel catalog-confirm account-confirm"
      aria-labelledby="account-confirm-title"
    >
      <h2 id="account-confirm-title" ref={heading} tabIndex={-1}>
        Xác nhận {statusLabel(target)}
      </h2>
      <dl className="account-confirm-details">
        <div>
          <dt>Tài khoản</dt>
          <dd>
            {account.fullName} <small>#{account.id}</small>
          </dd>
        </div>
        <div>
          <dt>Vai trò</dt>
          <dd>{roleConfig[account.role].label}</dd>
        </div>
        <div>
          <dt>Số điện thoại</dt>
          <dd>{account.phone}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{account.email || 'Chưa có email'}</dd>
        </div>
      </dl>
      <p>
        {target === 'LOCKED'
          ? 'Tài khoản sẽ không đăng nhập được và mất quyền ở yêu cầu tiếp theo. Khóa tài khoản không tự hủy đơn hoặc thay đổi người được phân công.'
          : 'Tài khoản được đăng nhập và sử dụng lại quyền hiện có. Phiên đã bị vô hiệu hóa cần đăng nhập lại.'}
      </p>
      <div className="catalog-actions">
        <button
          className="button button-primary"
          type="button"
          disabled={disabled}
          onClick={onConfirm}
        >
          {busy ? 'Đang cập nhật…' : `Xác nhận ${statusLabel(target)}`}
        </button>
        <button className="text-button" type="button" disabled={disabled} onClick={onClose}>
          Giữ nguyên
        </button>
      </div>
    </section>
  )
}
