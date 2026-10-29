import useUnsavedChanges from '../navigation/useUnsavedChanges'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addressFormSchema } from './account-api'
import AddressFields from './AddressFields'

export default function AddressForm({ address, user, disabled, onSave, onClose }) {
  const form = useForm({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      contactName: user.fullName,
      contactPhone: user.phone,
      addressLine: '',
      province: '',
      location: null,
      ...address?.pickupAddress,
      ward: address?.pickupAddress.ward || '',
      district: address?.pickupAddress.district || '',
      isDefault: address?.isDefault || false,
    },
  })

  const protection = useUnsavedChanges(form.formState.isDirty, 'Địa chỉ thu gom')
  return (
    <section className="workspace-panel customer-section">
      <h2>{address ? 'Sửa địa chỉ thu gom' : 'Thêm địa chỉ thu gom'}</h2>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(() => onSave(form.getValues()))}
          noValidate
          aria-label="Lưu địa chỉ"
        >
          <fieldset className="form-fields" disabled={disabled}>
            <legend className="sr-only">Thông tin địa chỉ</legend>
            <AddressFields disabled={disabled} />
            <label className="customer-checkbox">
              <input
                type="checkbox"
                disabled={address?.isDefault}
                {...form.register('isDefault')}
              />
              Dùng làm địa chỉ mặc định
            </label>
            <div className="customer-actions">
              <button className="button button-primary" type="submit">
                {disabled ? 'Đang lưu…' : 'Lưu địa chỉ'}
              </button>
              <button
                className="text-button"
                type="button"
                disabled={disabled}
                onClick={() => protection.confirmDiscard(onClose)}
              >
                Đóng biểu mẫu
              </button>
            </div>
          </fieldset>
        </form>
      </FormProvider>
    </section>
  )
}
