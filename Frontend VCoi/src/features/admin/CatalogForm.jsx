import useUnsavedChanges from '../navigation/useUnsavedChanges'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import InputField from '../../components/InputField'
import { catalogConfig } from './catalog-model'

export default function CatalogForm({
  kind,
  initial,
  categories,
  categoryId,
  disabled,
  busy,
  onSave,
  onClose,
}) {
  const material = kind === 'materials',
    meta = catalogConfig[kind]
  const form = useForm({
    resolver: zodResolver(meta.form),
    defaultValues: material
      ? {
          name: initial?.name || '',
          grade: initial?.grade || '',
          categoryId: String(initial?.categoryId || categoryId || ''),
          unit: 'KG',
          description: initial?.description || '',
          excludedItems: initial?.excludedItems || '',
          imageUrl: initial?.imageUrl || '',
        }
      : { name: initial?.name || '', description: initial?.description || '' },
  })

  const protection = useUnsavedChanges(form.formState.isDirty, 'Danh mục và vật liệu')
  const { setFocus } = form
  useEffect(() => {
    setFocus('name')
  }, [setFocus])
  const selectedId = useWatch({ control: form.control, name: 'categoryId' })
  const selected = categories?.find((row) => String(row.id) === selectedId)
  const field = (name, label, max, extra = {}) => (
    <InputField
      key={name}
      id={`catalog-${name}`}
      label={label}
      maxLength={max}
      error={form.formState.errors[name]}
      {...extra}
      {...form.register(name)}
    />
  )
  return (
    <section className="workspace-panel catalog-form" aria-labelledby="catalog-form-title">
      <h2 id="catalog-form-title">
        {initial ? 'Sửa' : 'Thêm'} {meta.noun}
      </h2>
      <p>
        {initial
          ? 'Cập nhật thông tin. Trạng thái được quản lý riêng trong danh sách.'
          : material
            ? 'Vật liệu mới được nhận thu mua; chỉ hiển thị khi danh mục đang hiện.'
            : 'Danh mục mới được hiển thị. Bạn có thể ẩn sau khi lưu.'}
      </p>
      <form
        onSubmit={form.handleSubmit(() => onSave(form.getValues()))}
        noValidate
        aria-label={`Lưu ${meta.noun}`}
      >
        <fieldset className="form-fields" disabled={disabled}>
          <legend className="sr-only">Thông tin {meta.noun}</legend>
          <div className="catalog-form-grid">
            {field('name', `Tên ${meta.noun}`, material ? 150 : 100, { required: true })}
            {material && (
              <>
                {field('grade', 'Phân hạng', 50, {
                  required: true,
                  hint: 'Ví dụ: Khô sạch, Đã phân loại.',
                })}
                <InputField
                  id="catalog-categoryId"
                  label="Danh mục"
                  as="select"
                  required
                  error={form.formState.errors.categoryId}
                  {...form.register('categoryId')}
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                      {!row.isActive ? ' (đang ẩn)' : ''}
                    </option>
                  ))}
                </InputField>
                <InputField
                  id="catalog-unit"
                  label="Đơn vị"
                  value="KG"
                  readOnly
                  hint="Khối lượng tính theo kilôgam."
                />
              </>
            )}
          </div>
          {material ? (
            <>
              {selected && !selected.isActive && (
                <p className="form-notice">
                  Danh mục đang ẩn. Vật liệu vẫn được lưu nhưng chưa hiển thị trên website hoặc khi
                  đặt lịch.
                </p>
              )}
              <details
                className="catalog-extra"
                open={
                  Boolean(initial?.description || initial?.excludedItems || initial?.imageUrl) ||
                  undefined
                }
              >
                <summary>Thông tin bổ sung</summary>
                <div className="form-fields">
                  {field('description', 'Mô tả (không bắt buộc)', 1000, {
                    as: 'textarea',
                    rows: 3,
                  })}
                  {field('excludedItems', 'Không tiếp nhận (không bắt buộc)', 1000, {
                    as: 'textarea',
                    rows: 3,
                  })}
                  {field('imageUrl', 'URL ảnh (không bắt buộc)', 1000, {
                    type: 'url',
                    hint: 'URL HTTP/HTTPS. Module này lưu đường dẫn, chưa có tải ảnh lên.',
                  })}
                </div>
              </details>
            </>
          ) : (
            field('description', 'Mô tả (không bắt buộc)', 500, { as: 'textarea', rows: 3 })
          )}
          <div className="catalog-actions">
            <button className="button button-primary" type="submit">
              {busy ? 'Đang lưu…' : `Lưu ${meta.noun}`}
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
