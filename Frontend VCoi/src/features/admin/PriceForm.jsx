import useUnsavedChanges from '../navigation/useUnsavedChanges'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import InputField from '../../components/InputField'
import { priceFormSchema, priceTimeInput } from './prices-model'

export default function PriceForm({
  initial,
  materials,
  materialId,
  disabled,
  busy,
  onSave,
  onClose,
}) {
  const form = useForm({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      materialId: String(initial?.materialId || materialId || ''),
      unitPrice: initial ? String(initial.unitPrice) : '',
      validFrom: priceTimeInput(initial?.validFrom || new Date()),
      validTo: initial?.validTo ? priceTimeInput(initial.validTo) : '',
    },
  })

  const protection = useUnsavedChanges(form.formState.isDirty, 'Giá nháp')
  const selectedId = useWatch({ control: form.control, name: 'materialId' })
  const selected = materials.find((row) => String(row.id) === selectedId)
  const { setFocus } = form
  useEffect(() => {
    setFocus(initial ? 'unitPrice' : 'materialId')
  }, [initial, setFocus])
  const field = (name, label, extra = {}) => (
    <InputField
      id={`price-${name}`}
      label={label}
      error={form.formState.errors[name]}
      {...extra}
      {...form.register(name)}
    />
  )
  return (
    <section className="workspace-panel catalog-form" aria-labelledby="price-form-title">
      <h2 id="price-form-title">
        {initial ? `Sửa giá nháp · Phiên bản ${initial.versionNumber}` : 'Tạo phiên bản giá nháp'}
      </h2>
      <p>
        Nhập đơn giá nguyên VND/kg. Thời gian theo Việt Nam (UTC+7). Để trống kết thúc nếu không
        giới hạn.
      </p>
      <form
        onSubmit={form.handleSubmit(() => onSave(form.getValues()))}
        noValidate
        aria-label="Lưu giá nháp"
      >
        <fieldset className="form-fields" disabled={disabled}>
          <legend className="sr-only">Thông tin giá nháp</legend>
          <div className="catalog-form-grid">
            {field('materialId', 'Vật liệu', {
              as: 'select',
              required: true,
              disabled: Boolean(initial),
              children: (
                <>
                  <option value="">Chọn vật liệu</option>
                  {materials.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name} · {row.grade}
                      {!row.available ? ' (chưa hiển thị công khai)' : ''}
                    </option>
                  ))}
                </>
              ),
            })}
            {field('unitPrice', 'Đơn giá (VND/kg)', {
              required: true,
              inputMode: 'numeric',
              maxLength: 16,
              hint: 'Từ 1 đến 9.007.199.254.740.991 VND. Không nhập dấu phân cách.',
            })}
            {field('validFrom', 'Hiệu lực từ', {
              required: true,
              type: 'datetime-local',
              step: '0.001',
              min: '0001-01-01T07:00',
              max: '9999-12-31T23:59:59.999',
            })}
            {field('validTo', 'Hiệu lực đến (không bắt buộc)', {
              type: 'datetime-local',
              step: '0.001',
              min: '0001-01-01T07:00',
              max: '9999-12-31T23:59:59.999',
              hint: 'Giá ngừng hiệu lực ngay tại mốc kết thúc.',
            })}
          </div>
          {selected && !selected.available && (
            <p className="form-notice">
              Vật liệu đang ngừng thu mua hoặc thuộc danh mục ẩn. Bạn vẫn có thể lập giá, nhưng giá
              chưa hiển thị công khai.
            </p>
          )}
          <div className="catalog-actions">
            <button className="button button-primary" type="submit">
              {busy ? 'Đang lưu…' : 'Lưu giá nháp'}
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => protection.confirmDiscard(onClose)}
            >
              Đóng biểu mẫu
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  )
}
