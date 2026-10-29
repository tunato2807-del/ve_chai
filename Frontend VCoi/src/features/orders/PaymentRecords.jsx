import { paymentMethods } from './payment-model'
import { orderMoney, orderTime } from './model'

export default function PaymentRecords({ records }) {
  if (!records.length) return null
  return (
    <section className="payment-records" aria-label="Các khoản ghi nhận">
      <h3>Khoản chi đã ghi nhận</h3>
      <ul>
        {records.map((row) => (
          <li key={row.id}>
            <header>
              <strong>{orderMoney(row.amount)}</strong>
              <span>
                {
                  {
                    COMPLETED: 'Đã chi trả mô phỏng',
                    PENDING: 'Đang xử lý',
                    FAILED: 'Chưa thành công',
                  }[row.status]
                }
              </span>
            </header>
            <dl>
              <div>
                <dt>Phương thức</dt>
                <dd>{paymentMethods[row.method]}</dd>
              </div>
              <div>
                <dt>Mã giao dịch</dt>
                <dd>{row.referenceCode || `#${row.id}`}</dd>
              </div>
              {row.paidAt && (
                <div>
                  <dt>Thời gian ghi nhận</dt>
                  <dd>
                    <time dateTime={row.paidAt}>{orderTime(row.paidAt)}</time>
                  </dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>
    </section>
  )
}
