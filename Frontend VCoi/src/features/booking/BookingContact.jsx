import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import InputField from '../../components/InputField'
import { vietnamDateInput } from './schema'
import AddressFields from '../customer/AddressFields'
import SavedAddressPicker from '../customer/SavedAddressPicker'

export default function BookingContact({ savedAddress, onAddressSelect }) {
  const [minimumStart] = useState(() => vietnamDateInput(new Date(Date.now() + 60_000)))
  const {
    register,
    formState: { errors },
  } = useFormContext()
  return (
    <>
      <section className="booking-section">
        <h2>Địa chỉ thu gom</h2>
        <SavedAddressPicker selected={savedAddress} onSelect={onAddressSelect} />
        <AddressFields prefix="booking" readOnly={Boolean(savedAddress)} />
      </section>
      <section className="booking-section">
        <h2>Khung giờ bạn thuận tiện</h2>
        <p className="field-hint section-help">
          Tất cả thời gian bên dưới theo giờ Việt Nam (UTC+7). Đại lý sẽ xác nhận lại lịch.
        </p>
        <div className="form-grid">
          <InputField
            id="pickupStart"
            label="Giờ bắt đầu"
            type="datetime-local"
            min={minimumStart}
            required
            error={errors.pickupStart}
            {...register('pickupStart')}
          />
          <InputField
            id="pickupEnd"
            label="Giờ kết thúc"
            type="datetime-local"
            required
            error={errors.pickupEnd}
            {...register('pickupEnd')}
          />
        </div>
        <div className="booking-note">
          <InputField
            id="sellerNote"
            label="Ghi chú cho đại lý (không bắt buộc)"
            as="textarea"
            rows={3}
            maxLength={1000}
            hint="Ví dụ: gọi trước khi đến, vị trí cổng hoặc lối vào."
            error={errors.sellerNote}
            {...register('sellerNote')}
          />
        </div>
      </section>
    </>
  )
}
