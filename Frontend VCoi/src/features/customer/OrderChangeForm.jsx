import useUnsavedChanges from '../navigation/useUnsavedChanges'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { requiredText } from '../../lib/validation'
import { changeFormSchema } from './order-action-model'
import { vietnamInputToDate } from '../booking/schema'
import { orderTime } from '../orders/model'
import InputField from '../../components/InputField'

export default function OrderChangeForm({
  mode,
  direct,
  disabled,
  orderVersion,
  onConfirm,
  onClose,
}) {
  const [review, setReview] = useState(null)
  const stale = review && review.version !== orderVersion
  const form = useForm({
    resolver: zodResolver(
      mode === 'CANCEL' ? z.object({ reason: requiredText(500) }) : changeFormSchema,
    ),
    defaultValues: { reason: '', pickupStart: '', pickupEnd: '' },
  })

  const protection = useUnsavedChanges(form.formState.isDirty, 'Yêu cầu hủy và đổi lịch')
  return (
    <section className="customer-confirm" aria-label="Yêu cầu thay đổi lịch">
      <h3>
        {review
          ? 'Kiểm tra trước khi xác nhận'
          : mode === 'CANCEL'
            ? 'Gửi yêu cầu hủy đến admin'
            : direct
              ? 'Đổi khung giờ thu gom'
              : 'Nhờ admin đổi khung giờ'}
      </h3>
      <p>
        {mode === 'CANCEL'
          ? 'Đơn vẫn tiếp tục cho đến khi admin duyệt hủy. Bạn có thể rút yêu cầu khi còn chờ xử lý.'
          : direct
            ? 'Đại lý sẽ kiểm tra khung giờ và lịch của nhân viên đang được phân công.'
            : 'Nhân viên đã khởi hành. Admin sẽ xem yêu cầu và điều phối lại nếu chấp thuận.'}
      </p>
      {review ? (
        <>
          {stale && (
            <p className="form-error" role="alert">
              Đơn đã thay đổi. Hãy sửa và xem lại yêu cầu trước khi xác nhận.
            </p>
          )}
          <p className="customer-review-reason">{review.values.reason}</p>
          {mode === 'RESCHEDULE' && (
            <p>
              {orderTime(vietnamInputToDate(review.values.pickupStart).toISOString())} đến{' '}
              {orderTime(vietnamInputToDate(review.values.pickupEnd).toISOString())}
            </p>
          )}
          <div className="customer-actions">
            <button
              className="button button-primary"
              type="button"
              disabled={disabled || stale}
              onClick={() => onConfirm(review.values)}
            >
              {disabled
                ? 'Đang gửi…'
                : mode === 'RESCHEDULE' && direct
                  ? 'Xác nhận đổi lịch'
                  : 'Xác nhận gửi yêu cầu'}
            </button>
            <button
              className="text-button"
              type="button"
              disabled={disabled}
              onClick={() => setReview(null)}
            >
              Sửa yêu cầu
            </button>
            <button
              className="text-button"
              type="button"
              disabled={disabled}
              onClick={() => protection.confirmDiscard(onClose)}
            >
              Đóng
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={form.handleSubmit(() =>
            setReview({ values: form.getValues(), version: orderVersion }),
          )}
          noValidate
        >
          <fieldset className="form-fields" disabled={disabled}>
            <legend className="sr-only">Nội dung thay đổi lịch</legend>
            <InputField
              id="change-reason"
              label="Lý do thay đổi"
              as="textarea"
              rows={3}
              required
              maxLength={500}
              error={form.formState.errors.reason}
              {...form.register('reason')}
            />
            {mode === 'RESCHEDULE' && (
              <>
                <p className="field-hint">Thời gian theo giờ Việt Nam (UTC+7).</p>
                <div className="form-grid">
                  {[
                    ['pickupStart', 'Giờ bắt đầu mới'],
                    ['pickupEnd', 'Giờ kết thúc mới'],
                  ].map(([name, label]) => (
                    <InputField
                      key={name}
                      id={`change-${name}`}
                      label={label}
                      type="datetime-local"
                      required
                      error={form.formState.errors[name]}
                      {...form.register(name)}
                    />
                  ))}
                </div>
              </>
            )}
            <div className="customer-actions">
              <button className="button button-primary" type="submit">
                Xem lại yêu cầu
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => protection.confirmDiscard(onClose)}
              >
                Đóng
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  )
}
