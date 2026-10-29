import { useFormContext, useWatch } from 'react-hook-form'
import InputField from '../../components/InputField'
import { actualKg, netFromInputs } from './weighing-model'

export default function WeighingRow({ item, index, previous }) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext()
  const row = useWatch({ control, name: `items.${index}` })
  const prefix = `items.${index}`
  const rowErrors = errors.items?.[index]
  return (
    <fieldset className={`weighing-row ${row?.selected ? 'is-selected' : ''}`}>
      <legend>
        {item.materialName}
        {item.grade ? ` · ${item.grade}` : ''}
      </legend>
      <div className="weighing-row-top">
        <label className="weighing-select">
          <input type="checkbox" {...register(`${prefix}.selected`)} />
          Chọn {item.materialName} để cân
        </label>
        <span className="field-hint">
          {previous ? `Điều chỉnh phiếu #${previous.id}` : 'Cân lần đầu'}
        </span>
      </div>
      {rowErrors?.selected && (
        <p className="field-error" role="alert">
          {rowErrors.selected.message}
        </p>
      )}
      {row?.selected && (
        <>
          <div className="weighing-inputs">
            <InputField
              id={`gross-${item.itemId}`}
              label="Khối lượng tổng (kg)"
              required
              inputMode="decimal"
              autoComplete="off"
              maxLength={13}
              error={rowErrors?.grossWeight}
              {...register(`${prefix}.grossWeight`)}
            />
            <InputField
              id={`tare-${item.itemId}`}
              label="Khối lượng bì (kg)"
              required
              inputMode="decimal"
              autoComplete="off"
              maxLength={13}
              error={rowErrors?.tareWeight}
              {...register(`${prefix}.tareWeight`)}
            />
            <div className="weighing-net">
              <span>Thực nhận</span>
              <output data-testid={`weighing-net-${item.itemId}`} aria-live="polite">
                {actualKg(netFromInputs(row.grossWeight, row.tareWeight))}
              </output>
              <small>Tổng − bì</small>
            </div>
          </div>
          {previous && (
            <InputField
              id={`correction-${item.itemId}`}
              label="Lý do cân điều chỉnh"
              required
              as="textarea"
              rows={2}
              maxLength={500}
              error={rowErrors?.correctionReason}
              hint="Phiếu cũ được giữ nguyên. Lý do tối đa 500 ký tự."
              {...register(`${prefix}.correctionReason`)}
            />
          )}
        </>
      )}
    </fieldset>
  )
}
