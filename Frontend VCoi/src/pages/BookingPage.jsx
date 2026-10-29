import { useRef, useState } from 'react'
import { FormProvider } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/context'
import { createOrder, getBookingMaterials } from '../features/orders/api'
import useBookingDraft from '../features/booking/useBookingDraft'
import BookingContact from '../features/booking/BookingContact'
import BookingItems from '../features/booking/BookingItems'
import BookingReview from '../features/booking/BookingReview'
import AsyncState from '../components/AsyncState'
import '../styles/workspace.css'
import '../styles/booking.css'

export default function BookingPage() {
  const { user } = useAuth()
  const client = useQueryClient()
  const navigate = useNavigate()
  const materials = useQuery({
    queryKey: ['booking-materials'],
    queryFn: getBookingMaterials,
    staleTime: 60_000,
    retry: false,
  })
  const [review, setReview] = useState(null)
  const [savedAddress, setSavedAddress] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [uncertain, setUncertain] = useState(false)
  const sending = useRef(false)
  const reviewHeading = useRef(null)
  const draft = useBookingDraft(user)
  const form = draft.form
  function preview(value) {
    setReview({ ...value, ...(savedAddress && { addressId: savedAddress.id }) })
    setError(null)
    requestAnimationFrame(() => {
      reviewHeading.current?.focus()
      reviewHeading.current?.scrollIntoView({ block: 'start' })
    })
  }
  async function confirm() {
    if (sending.current) return
    if (Date.parse(review.pickupStart) <= Date.now()) {
      setError('Giờ bắt đầu đã qua. Vui lòng sửa khung giờ trước khi gửi.')
      return
    }
    sending.current = true
    setBusy(true)
    setError(null)
    try {
      const body = { ...review }
      if (body.addressId) delete body.pickupAddress
      const order = await createOrder(body)
      if (
        client.getQueryData(['session'])?.id !== user.id ||
        client.getQueryData(['session'])?.role !== 'CUSTOMER'
      )
        return
      client.setQueryData(['private', user.id, user.role, 'order', String(order.id)], order)
      void client.invalidateQueries({ queryKey: ['private', user.id, user.role, 'orders'] })
      draft.clear()
      form.reset()
      navigate(`/khach-hang/don/${order.id}`, { replace: true, state: { justBooked: true } })
    } catch (failure) {
      setError(failure.message)
      if (failure.uncertain) {
        draft.clear()
        setUncertain(true)
      }
    } finally {
      sending.current = false
      setBusy(false)
    }
  }
  if (uncertain)
    return (
      <section className="container workspace-page">
        <div className="uncertain-booking" role="alert">
          <h1>Chưa xác nhận được kết quả</h1>
          <p>
            Yêu cầu có thể đã được tiếp nhận. Bạn hãy kiểm tra danh sách đơn trước khi đặt lại để
            tránh tạo lịch trùng.
          </p>
          <Link className="button button-primary" to="/khach-hang">
            Kiểm tra đơn của tôi
          </Link>
        </div>
      </section>
    )
  return (
    <section className="container workspace-page booking-page">
      <Link className="back-link" to="/khach-hang">
        ← Lịch thu gom của tôi
      </Link>
      <header className="workspace-heading booking-heading">
        <div>
          <p className="role-label">Đặt lịch thu gom</p>
          <h1>
            Gom gọn hôm nay.
            <br />
            Hẹn một vòng đời mới.
          </h1>
          <p className="muted">Chọn vật liệu và khung giờ. Đại lý sẽ xác nhận lịch với bạn.</p>
        </div>
        <span className="booking-step">
          {review ? 'Bước 2: Xem lại & gửi lịch' : 'Bước 1: Thông tin thu gom'}
        </span>
      </header>
      {draft.restored && (
        <p className="form-notice" role="status">
          Đã khôi phục bản nháp. Hãy kiểm tra lại địa chỉ và khung giờ trước khi gửi.
        </p>
      )}
      {materials.isPending ? (
        <AsyncState title="Đang tải vật liệu thu mua" busy />
      ) : materials.isError ? (
        <AsyncState
          title="Chưa tải được vật liệu"
          message={materials.error.message}
          retry={() => void materials.refetch()}
        />
      ) : !materials.data.length ? (
        <AsyncState
          title="Chưa có vật liệu đang tiếp nhận"
          message="Bạn hãy quay lại khi đại lý cập nhật danh sách thu mua."
        />
      ) : (
        <div className="booking-layout">
          <div>
            {review ? (
              <div ref={reviewHeading} tabIndex={-1} className="review-focus">
                <BookingReview
                  booking={review}
                  materials={materials.data}
                  busy={busy}
                  error={error}
                  onEdit={() => {
                    setReview(null)
                    setError(null)
                  }}
                  onConfirm={confirm}
                />
              </div>
            ) : (
              <FormProvider {...form}>
                <form
                  className="booking-form"
                  onSubmit={(event) => void form.handleSubmit(preview)(event)}
                  noValidate
                  aria-label="Đặt lịch thu gom"
                >
                  <BookingContact savedAddress={savedAddress} onAddressSelect={setSavedAddress} />
                  <BookingItems materials={materials.data} />
                  <button className="button button-primary" type="submit">
                    Xem lại lịch thu gom →
                  </button>
                </form>
              </FormProvider>
            )}
          </div>
          <aside className="booking-help">
            <h2>Trước khi gửi lịch</h2>
            <p>Phân loại giấy, nhựa và kim loại riêng. Giữ giấy khô, chai nhựa sạch và để ráo.</p>
            <p>Chưa biết số kg? Bạn có thể để trống. Nhân viên sẽ cân thực tế khi đến.</p>
            <p>Mọi yêu cầu hủy lịch cần được quản trị viên xử lý.</p>
            <Link className="text-link" to="/bang-gia">
              Xem bảng giá →
            </Link>
          </aside>
        </div>
      )}
    </section>
  )
}
