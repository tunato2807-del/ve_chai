import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../features/auth/context'
import { readReceipt } from '../features/orders/history-api'
import OrderReceipt from '../features/orders/OrderReceipt'
import AsyncState from '../components/AsyncState'
import '../styles/workspace.css'
import '../styles/quotation.css'

export default function AdminReceiptPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const valid = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))
  const allowed = user?.role === 'ADMIN' && user.status === 'ACTIVE'
  const receipt = useQuery({
    queryKey: ['private', user?.id, 'ADMIN', 'receipt', id],
    queryFn: ({ signal }) => readReceipt(id, { signal, role: 'ADMIN' }),
    retry: false,
    staleTime: 0,
    enabled: valid && allowed,
  })
  if (!allowed) return <AsyncState title="Biên nhận này dành cho quản trị viên." />
  if (!valid) return <AsyncState title="Mã đơn chưa hợp lệ" />
  return (
    <section className="workspace-page admin-order-receipt">
      <Link className="back-link" to={'/quan-tri/don/' + id}>
        ← Chi tiết đơn thu gom
      </Link>
      <header className="workspace-heading receipt-toolbar">
        <div>
          <h1>Biên nhận thu mua</h1>
          <p className="muted">VCoi · Đối chiếu giao dịch thu mua</p>
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
          retry={() => void receipt.refetch()}
          message={
            receipt.error.status === 409
              ? 'Đơn chưa có thanh toán hoàn tất hoặc biên nhận chưa đồng bộ. Hãy tải lại hoặc quay về hồ sơ đơn để đối chiếu.'
              : receipt.error.message
          }
        />
      ) : (
        <OrderReceipt receipt={receipt.data} />
      )}
    </section>
  )
}
