import { useFormContext } from 'react-hook-form'
import InputField from '../../components/InputField'
import LocationPicker from '../maps/LocationPicker'
const fields = [
  ['contactName', 'Người liên hệ', 100, 'name'],
  ['contactPhone', 'Số điện thoại liên hệ', 10, 'tel'],
  ['addressLine', 'Số nhà, đường', 300, 'street-address'],
  ['ward', 'Phường / xã (không bắt buộc)', 100, 'address-level3'],
  ['district', 'Quận / huyện (không bắt buộc)', 100],
  ['province', 'Tỉnh / thành phố', 100, 'address-level1'],
]
export default function AddressFields({ prefix = 'address', readOnly = false, disabled = false }) {
  const {
    register,
    formState: { errors },
  } = useFormContext()
  return (
    <>
      <div className="form-grid">
        {fields.map(([name, label, maxLength, autoComplete]) => (
          <div
            key={name}
            className={['addressLine', 'province'].includes(name) ? 'full-width' : undefined}
          >
            <InputField
              id={`${prefix}-${name}`}
              label={label}
              required={!['ward', 'district'].includes(name)}
              maxLength={maxLength}
              autoComplete={autoComplete}
              type={name === 'contactPhone' ? 'tel' : 'text'}
              readOnly={readOnly}
              error={errors[name]}
              {...register(name)}
            />
          </div>
        ))}
      </div>
      <LocationPicker
        key={readOnly ? 'saved-address' : 'manual-address'}
        disabled={readOnly || disabled}
      />
    </>
  )
}
