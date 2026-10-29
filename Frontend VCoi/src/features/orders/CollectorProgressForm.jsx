import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRightIcon } from '@phosphor-icons/react/ArrowRight'
import { progressNoteSchema } from './progress-api'
import useUnsavedChanges from '../navigation/useUnsavedChanges'

export default function CollectorProgressForm({ step, busy, blocked, onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(progressNoteSchema),
    defaultValues: { reason: '' },
  })
  useUnsavedChanges(isDirty, 'Ghi chú di chuyển')
  return (
    <form className="form-fields trip-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-field">
        <label htmlFor="trip-reason">Ghi chú di chuyển (không bắt buộc)</label>
        <textarea
          id="trip-reason"
          rows={2}
          maxLength={500}
          disabled={busy || blocked}
          aria-invalid={Boolean(errors.reason)}
          aria-describedby={errors.reason ? 'trip-reason-error' : 'trip-reason-hint'}
          {...register('reason')}
        />
        {errors.reason ? (
          <p id="trip-reason-error" className="field-error" role="alert">
            {errors.reason.message}
          </p>
        ) : (
          <p id="trip-reason-hint" className="field-hint">
            Tối đa 500 ký tự. Ghi chú được lưu cùng lần cập nhật này.
          </p>
        )}
      </div>
      <button className="button button-primary" type="submit" disabled={busy || blocked}>
        {busy ? 'Đang cập nhật…' : step.label} <ArrowRightIcon size={19} aria-hidden="true" />
      </button>
    </form>
  )
}
