import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../features/auth/context'
import { readReceipt } from '../features/orders/history-api'
import OrderReceipt from '../features/orders/OrderReceipt'

import AsyncState from '../components/AsyncState'
import '../styles/customer.css'
import '../styles/quotation.css'
import '../styles/workspace.css'

export default function CustomerReceiptPage() {
  const location = useLocation()
  const { id } = useParams(),
    { user } = useAuth()
  const valid = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))
  const receipt = useQuery({
    queryKey: ['private', user.id, 'CUSTOMER', 'receipt', id],
    queryFn: ({ signal }) => readReceipt(id, { signal }),
    retry: false,
    staleTime: 0,
    enabled: valid,
  })
  if (!valid) return <AsyncState title="Mã đơn chưa hợp lệ" />
  return (
    <section className="container workspace-page customer-receipt">
      <Link
        className="back-link"
        to={`/khach-hang/don/${id}`}
        state={{ listPath: location.state?.listPath }}
      >
        ← Chi tiết đơn thu gom
      </Link>
      <header className="workspace-heading">
        <div>
          <h1>Biên nhận thu mua</h1>
          <p className="muted">VCoi · Dữ liệu mô phỏng của đồ án</p>
        </div>
        {receipt.isSuccess && (
          <button className="button button-secondary" type="button" onClick={() => window.print()}>
            In / lưu PDF
          </button>
        )}
      </header>
      {receipt.isPending ? (
        <AsyncState title="Đang tải biên nhận" busy />
      ) : receipt.isError ? (
        <AsyncState
          title="Chưa lấy được biên nhận"
          message={
            receipt.error.status === 409
              ? 'Đơn chưa có thanh toán hoàn tất. Hãy quay lại chi tiết để theo dõi.'
              : receipt.error.message
          }
          retry={() => void receipt.refetch()}
        />
      ) : (
        <OrderReceipt receipt={receipt.data} />
      )}
    </section>
  )
}
