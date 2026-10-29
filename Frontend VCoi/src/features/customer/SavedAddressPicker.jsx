import { Link } from 'react-router-dom'
import { useFormContext } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/context'
import { getAddresses } from './account-api'
import InputField from '../../components/InputField'
import '../../styles/customer.css'

export default function SavedAddressPicker({ selected, onSelect }) {
  const { user } = useAuth(),
    form = useFormContext()
  const addresses = useQuery({
    queryKey: ['private', user.id, 'CUSTOMER', 'addresses'],
    queryFn: getAddresses,
    retry: false,
    staleTime: 0,
  })
  function choose(event) {
    const address = addresses.data?.find((row) => String(row.id) === event.target.value) || null
    onSelect(address)
    if (address) {
      for (const [key, value] of Object.entries(address.pickupAddress))
        if (key !== 'location')
          form.setValue(key, value ?? '', { shouldValidate: true, shouldDirty: true })
      form.setValue('location', address.pickupAddress.location ?? null, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
  }
  return (
    <div className="saved-address-picker">
      {addresses.isPending ? (
        <p className="field-hint" role="status">
          Đang tải địa chỉ lưu sẵn…
        </p>
      ) : addresses.isError ? (
        <p className="field-hint">
          Chưa tải được địa chỉ lưu. Bạn có thể nhập địa chỉ bên dưới.{' '}
          <button type="button" className="text-button" onClick={() => void addresses.refetch()}>
            Thử tải địa chỉ lại
          </button>
        </p>
      ) : (
        addresses.data.length > 0 && (
          <InputField
            id="booking-saved-address"
            label="Chọn địa chỉ đã lưu"
            as="select"
            value={selected?.id || ''}
            onChange={choose}
          >
            <option value="">Nhập địa chỉ khác</option>
            {addresses.data.map((row) => (
              <option key={row.id} value={row.id}>
                {row.isDefault ? 'Mặc định: ' : ''}
                {row.pickupAddress.addressLine} · {row.pickupAddress.contactName}
              </option>
            ))}
          </InputField>
        )
      )}
      {selected && (
        <p className="field-hint">
          Đang dùng địa chỉ lưu. Chọn “Nhập địa chỉ khác” nếu muốn thay thông tin cho lần thu gom
          này.
        </p>
      )}
      <Link className="text-link" to="/khach-hang/dia-chi">
        Quản lý địa chỉ lưu →
      </Link>
    </div>
  )
}
