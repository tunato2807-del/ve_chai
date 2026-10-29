import useUnsavedChanges from '../navigation/useUnsavedChanges'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import InputField from '../../components/InputField'
import { orderStatuses } from '../orders/model'
import { conclusionSchema, disputeActions, disputeProblem } from './disputes-model'

export default function DisputeDecisionForm({
  context,
  action,
  disabled,
  busy,
  onConfirm,
  onBack,
}) {
  const { dispute, order } = context,
    heading = useRef(null),
    [confirming, setConfirming] = useState(false)
  const reviewing = action === 'review',
    label = { review: 'tiếp nhận', resolve: 'giải quyết', reject: 'từ chối' }[action]
  const form = useForm({
    resolver: zodResolver(conclusionSchema),
    defaultValues: { resolution: '' },
  })

  const protection = useUnsavedChanges(form.formState.isDirty, 'Kết luận khiếu nại')
  const problem = disputeProblem(context, action)
  useEffect(() => {
    heading.current?.focus()
  }, [confirming])
  async function submit() {
    if (confirming) await onConfirm(form.getValues())
    else setConfirming(true)
  }
  return (
    <section
      className="workspace-panel catalog-form dispute-decision"
      aria-labelledby="dispute-decision-title"
    >
      <h2 id="dispute-decision-title" ref={heading} tabIndex={-1}>
        {reviewing || confirming ? `Xác nhận ${label}` : disputeActions[action]}
      </h2>
      <p>
        Khiếu nại #{dispute.id} · Đơn {order.code}
      </p>
      <blockquote className="dispute-reason-summary">
        <strong>Nội dung khách gửi</strong>
        <p className="dispute-copy">{dispute.reason}</p>
      </blockquote>
      <p>
        {reviewing
          ? 'Tiếp nhận sẽ chuyển khiếu nại sang Đang xem xét. Đơn tiếp tục ở trạng thái Đang có khiếu nại cho đến khi bạn lưu kết luận.'
          : `Lưu kết luận ${label} sẽ đóng khiếu nại và đưa đơn trở về “${orderStatuses[dispute.previousOrderStatus]}”. Khách có thể xem kết luận; nội dung đã chốt không thể sửa.`}
      </p>
      {!reviewing && (
        <p className="field-hint">Khoản thanh toán và biên nhận đã có được giữ nguyên.</p>
      )}
      {problem && <p className="form-notice">{problem}</p>}
      {reviewing ? (
        <div className="catalog-actions">
          <button
            className="button button-primary"
            type="button"
            disabled={disabled || Boolean(problem)}
            onClick={() => void onConfirm({})}
          >
            {busy ? 'Đang xử lý…' : 'Xác nhận tiếp nhận'}
          </button>
          <button
            className="text-button"
            type="button"
            disabled={disabled}
            onClick={() => protection.confirmDiscard(onBack)}
          >
            Quay lại khiếu nại
          </button>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(submit)} noValidate aria-label="Kết luận xử lý khiếu nại">
          <fieldset
            className="form-fields"
            disabled={disabled || Boolean(problem) || form.formState.isSubmitting}
          >
            <legend className="sr-only">Kết luận và xác nhận</legend>
            <InputField
              id="dispute-resolution"
              label="Kết luận xử lý"
              as="textarea"
              rows={5}
              maxLength={1000}
              required
              readOnly={confirming}
              hint="Nêu kết quả kiểm tra và hướng xử lý cho khách, tối đa 1000 ký tự."
              error={form.formState.errors.resolution}
              {...form.register('resolution')}
            />
            <div className="catalog-actions">
              <button className="button button-primary" type="submit">
                {busy ? 'Đang xử lý…' : confirming ? `Xác nhận ${label}` : 'Xem lại kết luận'}
              </button>
              <button
                className="text-button"
                type="button"
                onClick={
                  confirming ? () => setConfirming(false) : () => protection.confirmDiscard(onBack)
                }
              >
                {confirming ? 'Sửa kết luận' : 'Quay lại khiếu nại'}
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  )
}
