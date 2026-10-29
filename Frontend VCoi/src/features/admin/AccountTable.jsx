import { roleConfig } from '../auth/roles'
import { accountStatuses } from './accounts-model'

export default function AccountTable({ rows, disabled, onStatus }) {
  return (
    <div
      className="catalog-table-scroll"
      role="region"
      aria-label="Bảng tài khoản, cuộn ngang để xem đủ cột"
      tabIndex={0}
    >
      <table className="catalog-table account-table" aria-label="Danh sách tài khoản">
        <thead>
          <tr>
            <th scope="col">Tài khoản</th>
            <th scope="col">Liên hệ</th>
            <th scope="col">Vai trò</th>
            <th scope="col">Trạng thái</th>
            <th scope="col">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                {row.fullName}
                <small>#{row.id}</small>
              </th>
              <td>
                {row.phone}
                <small>{row.email || 'Chưa có email'}</small>
              </td>
              <td>{roleConfig[row.role].label}</td>
              <td>
                <span className={`catalog-state ${row.status === 'ACTIVE' ? 'is-on' : ''}`}>
                  {accountStatuses[row.status]}
                </span>
              </td>
              <td>
                {row.role === 'ADMIN' ? (
                  <span className="muted">Chỉ xem</span>
                ) : (
                  <button
                    className="text-button"
                    type="button"
                    disabled={disabled}
                    aria-label={`${row.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'} tài khoản ${row.fullName} (#${row.id})`}
                    onClick={() => onStatus(row)}
                  >
                    {row.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
