import useUnsavedChanges from '../navigation/useUnsavedChanges'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import InputField from '../../components/InputField'
import { orderTime } from '../orders/model'
import { reviewNoteSchema, approvalProblem, reviewProblem } from './order-changes-model'

export default function ChangeDecisionForm({ context, action, disabled, busy, onConfirm, onBack }) {
  const { request, order } = context,
    heading = useRef(null),
    [confirming, setConfirming] = useState(false)
  const form = useForm({
    resolver: zodResolver(reviewNoteSchema),
    defaultValues: { responseNote: '' },
  })

  const protection = useUnsavedChanges(form.formState.isDirty, 'Xử lý yêu cầu hủy và đổi lịch')
  const accepting = action === 'approve',
    label = accepting ? 'chấp thuận' : 'từ chối'
  const problem = accepting ? approvalProblem(context) : reviewProblem(context)
  useEffect(() => {
    heading.current?.focus()
  }, [confirming])
  const impact = !accepting
    ? 'Từ chối yêu cầu giữ nguyên trạng thái, khung giờ và nhân viên của đơn. Phản hồi được lưu để khách xem lại.'
    : request.requestType === 'CANCEL'
      ? 'Chấp thuận sẽ hủy đơn và dừng các bước thu gom tiếp theo. Báo giá và lịch sử đã lưu được giữ lại.'
      : order.status === 'EN_ROUTE'
        ? 'Chấp thuận đổi lịch sẽ đưa đơn về Đã xác nhận và bỏ phân công hiện tại. Bạn cần mở đơn để phân công lại nhân viên.'
        : 'Chấp thuận sẽ áp dụng lịch khách đề xuất. Nhân viên hiện tại được giữ nếu lịch mới phù hợp; hệ thống kiểm tra lịch trùng khi xử lý.'
  async function submit() {
    if (confirming) await onConfirm(form.getValues())
    else setConfirming(true)
  }
  return (
    <section
      className="workspace-panel catalog-form change-decision"
      aria-labelledby="change-decision-title"
    >
      <h2 id="change-decision-title" ref={heading} tabIndex={-1}>
        {confirming
          ? `Xác nhận ${label}`
          : `${accepting ? 'Chấp thuận' : 'Từ chối'} yêu cầu #${request.id}`}
      </h2>
      <p>
        Yêu cầu #{request.id} · Đơn {order.code}
      </p>
      <p>{impact}</p>
      {request.newPickupStart && (
        <div className="change-slot-summary">
          <strong>Lịch đề xuất · UTC+7</strong>
          <p>
            {orderTime(request.newPickupStart)} đến {orderTime(request.newPickupEnd)}
          </p>
        </div>
      )}
      {problem && <p className="form-notice">{problem}</p>}
      <form onSubmit={form.handleSubmit(submit)} noValidate aria-label="Quyết định xử lý yêu cầu">
        <fieldset
          className="form-fields"
          disabled={disabled || Boolean(problem) || form.formState.isSubmitting}
        >
          <legend className="sr-only">Phản hồi và xác nhận</legend>
          <InputField
            id="change-response-note"
            label="Phản hồi cho khách (không bắt buộc)"
            as="textarea"
            rows={3}
            maxLength={500}
            readOnly={confirming}
            hint="Tối đa 500 ký tự; nội dung được lưu cùng quyết định."
            error={form.formState.errors.responseNote}
            {...form.register('responseNote')}
          />
          <div className="catalog-actions">
            <button className="button button-primary" type="submit">
              {busy ? 'Đang xử lý…' : confirming ? `Xác nhận ${label}` : 'Xem lại quyết định'}
            </button>
            {confirming ? (
              <button className="text-button" type="button" onClick={() => setConfirming(false)}>
                Sửa phản hồi
              </button>
            ) : (
              <button
                className="text-button"
                type="button"
                onClick={() => protection.confirmDiscard(onBack)}
              >
                Quay lại yêu cầu
              </button>
            )}
          </div>
        </fieldset>
      </form>
    </section>
  )
}
