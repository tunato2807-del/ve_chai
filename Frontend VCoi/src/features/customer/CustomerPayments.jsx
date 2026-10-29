import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { readPayments } from './order-read-api'
import useCustomerOrder from './useCustomerOrder'
import useCustomerAction from './useCustomerAction'
import ActionFeedback from '../../components/ActionFeedback'
import AsyncState from '../../components/AsyncState'
import { orderMoney, orderTime } from '../orders/model'

export default function CustomerPayments({ order }) {
  const location = useLocation()
  const [open, setOpen] = useState(false),
    cache = useCustomerOrder(order)
  const key = (current) => [...cache.scope, 'customer-payments', String(order.id), current.version]
  const query = useQuery({
    queryKey: key(order),
    queryFn: ({ signal }) => readPayments(order, { signal }),
    enabled: open,
    retry: false,
    staleTime: 0,
  })
  const state = useCustomerAction(async () => {
    const fresh = await cache.read()
    const rows = await readPayments(fresh)
    if (cache.sameSession()) cache.client.setQueryData(key(fresh), rows)
  })
  const completed = query.data?.find((row) => row.status === 'COMPLETED')
  return (
    <details
      className="workspace-panel customer-section customer-disclosure"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <h2>Thanh toán và biên nhận</h2>
      </summary>
      <p className="customer-description">
        Đại lý trả tiền thu mua cho bạn. Dữ liệu thanh toán của đồ án là mô phỏng.
      </p>
      <button
        className="text-button"
        type="button"
        disabled={state.busy || query.isFetching}
        onClick={() => void state.refresh()}
      >
        Tải lại thanh toán
      </button>
      <ActionFeedback state={state} />
      {query.isPending ? (
        <AsyncState title="Đang tải thanh toán" busy />
      ) : query.isError ? (
        <AsyncState
          title="Chưa tải được thanh toán"
          message={query.error.message}
          retry={state.refresh}
        />
      ) : (
        <>
          {!query.data.length ? (
            <p className="customer-empty">Đại lý chưa ghi nhận thanh toán cho đơn này.</p>
          ) : (
            <ul className="customer-records">
              {query.data.map((row) => (
                <li key={row.id}>
                  <header>
                    <h3>{orderMoney(row.amount)}</h3>
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
                  <p>
                    {row.method === 'CASH_SIMULATED'
                      ? 'Tiền mặt mô phỏng'
                      : 'Chuyển khoản mô phỏng'}
                  </p>
                  <p>{row.referenceCode || `Giao dịch #${row.id}`}</p>
                  {row.paidAt && <time dateTime={row.paidAt}>{orderTime(row.paidAt)}</time>}
                </li>
              ))}
            </ul>
          )}
          {completed && (
            <Link
              className="button button-secondary"
              to={`/khach-hang/don/${order.id}/bien-nhan`}
              state={{ listPath: location.state?.listPath }}
            >
              Xem biên nhận thu mua
            </Link>
          )}
        </>
      )}
    </details>
  )
}
