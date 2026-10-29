import { useForm, useWatch } from 'react-hook-form'
import InputField from '../../components/InputField'
import { orderTime } from './model'
import useUnsavedChanges from '../navigation/useUnsavedChanges'

export default function DispatchForm({ order, collectors, busy, blocked, onSubmit }) {
  const assigning = order.status === 'CONFIRMED'
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({ defaultValues: { reason: '', ...(assigning && { collectorId: '' }) } })
  useUnsavedChanges(isDirty, 'Xác nhận và phân công thu gom')
  const selectedId = useWatch({ control, name: 'collectorId' })
  const selected = collectors?.find((row) => row.id === Number(selectedId))
  return (
    <form className="dispatch-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <fieldset className="form-fields" disabled={busy || blocked}>
        <legend className="sr-only">
          {assigning ? 'Phân công thu gom' : 'Xác nhận lịch thu gom'}
        </legend>
        {assigning && (
          <InputField
            as="select"
            id="dispatch-collector"
            label="Nhân viên thu gom"
            required
            error={errors.collectorId}
            {...register('collectorId', {
              setValueAs: Number,
              validate: (value) =>
                collectors.some((row) => row.id === value) ||
                'Hãy chọn một nhân viên đang hoạt động.',
            })}
          >
            <option value="">Chọn nhân viên phụ trách</option>
            {collectors.map((row) => (
              <option key={row.id} value={row.id}>
                {row.fullName} · {row.phone}
              </option>
            ))}
          </InputField>
        )}
        <InputField
          as="textarea"
          id="dispatch-reason"
          label={assigning ? 'Ghi chú phân công' : 'Ghi chú xác nhận'}
          hint="Tùy chọn, tối đa 500 ký tự. Lưu cùng lịch sử xử lý đơn."
          rows={3}
          maxLength={500}
          error={errors.reason}
          {...register('reason', {
            maxLength: { value: 500, message: 'Ghi chú tối đa 500 ký tự.' },
          })}
        />
        {selected && (
          <div className="dispatch-review">
            <h3>Kiểm tra nhân viên và giờ hẹn</h3>
            <p>
              {selected.fullName} · {selected.phone}
            </p>
            <p>
              {orderTime(order.pickupStart)} đến {orderTime(order.pickupEnd)} (giờ Việt Nam).
            </p>
          </div>
        )}
        <button className="button button-primary" type="submit">
          {busy ? 'Đang xử lý...' : assigning ? 'Phân công nhân viên' : 'Xác nhận đơn'}
        </button>
      </fieldset>
    </form>
  )
}
