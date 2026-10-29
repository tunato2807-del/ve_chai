import useUnsavedChanges from '../navigation/useUnsavedChanges'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import InputField from '../../components/InputField'
import { orderTime } from './model'

export default function ReassignmentForm({ order, collectors, busy, blocked, onSubmit }) {
  const [review, setReview] = useState(null)
  const heading = useRef(null)
  const form = useForm({ defaultValues: { collectorId: '', reason: '' } })
  useUnsavedChanges(form.formState.isDirty, 'Phân công lại nhân viên')
  const current = collectors.find((row) => row.id === order.collectorId)
  const candidates = collectors.filter((row) => row.id !== order.collectorId)
  const selected = candidates.find((row) => row.id === review?.collectorId)
  useEffect(() => {
    if (review) heading.current?.focus()
  }, [review])
  return (
    <form
      className="dispatch-form"
      aria-label="Phân công lại nhân viên"
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        if (review) await onSubmit(review)
        else setReview({ collectorId: values.collectorId, reason: values.reason.trim() })
      })}
    >
      <fieldset className="form-fields" disabled={busy || blocked || form.formState.isSubmitting}>
        <legend className="sr-only">Nhân viên thay thế và lý do</legend>
        {review ? (
          <div className="dispatch-review reassignment-review">
            <h3 ref={heading} tabIndex={-1}>
              Kiểm tra phân công thay thế
            </h3>
            <dl>
              <div>
                <dt>Nhân viên hiện tại</dt>
                <dd>{current ? current.fullName : `Mã nhân viên: ${order.collectorId}`}</dd>
              </div>
              <div>
                <dt>Nhân viên mới</dt>
                <dd>
                  {selected?.fullName} · {selected?.phone}
                </dd>
              </div>
              <div>
                <dt>Lý do</dt>
                <dd>{review.reason}</dd>
              </div>
              <div>
                <dt>Lịch hẹn giữ nguyên</dt>
                <dd>
                  {orderTime(order.pickupStart)} đến {orderTime(order.pickupEnd)} (giờ Việt Nam).
                </dd>
              </div>
            </dl>
            <p>
              Nhân viên cũ sẽ không còn quyền xử lý đơn. Thay đổi và lý do được lưu vào timeline.
            </p>
          </div>
        ) : (
          <>
            <InputField
              as="select"
              id="reassign-collector"
              label="Nhân viên thay thế"
              required
              error={form.formState.errors.collectorId}
              {...form.register('collectorId', {
                setValueAs: Number,
                validate: (value) =>
                  candidates.some((row) => row.id === value) ||
                  'Hãy chọn một nhân viên khác đang hoạt động.',
              })}
            >
              <option value="">Chọn nhân viên thay thế</option>
              {candidates.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.fullName} · {row.phone}
                </option>
              ))}
            </InputField>
            <InputField
              as="textarea"
              id="reassign-reason"
              label="Lý do phân công lại"
              required
              rows={3}
              maxLength={500}
              hint="Tối đa 500 ký tự. Lý do được lưu cùng lịch sử của đơn."
              error={form.formState.errors.reason}
              {...form.register('reason', {
                validate: (value) => Boolean(value.trim()) || 'Hãy nhập lý do phân công lại.',
                maxLength: { value: 500, message: 'Lý do tối đa 500 ký tự.' },
              })}
            />
          </>
        )}
        <div className="reassignment-actions">
          <button className="button button-primary" type="submit">
            {busy ? 'Đang xử lý...' : review ? 'Xác nhận phân công lại' : 'Xem lại phân công'}
          </button>
          {review && (
            <button className="text-button" type="button" onClick={() => setReview(null)}>
              Sửa lựa chọn
            </button>
          )}
        </div>
      </fieldset>
    </form>
  )
}
