import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import InputField from '../../components/InputField'
import { formatPrice } from '../../lib/format'

export default function BookingItems({ materials }) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const selected = useWatch({ control, name: 'items' }) || []
  return (
    <section className="booking-section">
      <h2>Vật liệu bạn muốn bán</h2>
      <p className="field-hint section-help">
        Chọn từng loại một lần. Có thể để trống số kg nếu bạn chưa ước lượng được.
      </p>
      <div className="booking-items">
        {fields.map((field, index) => {
          const item = materials.find(
            (material) => String(material.materialId) === selected[index]?.materialId,
          )
          const itemErrors = errors.items?.[index]
          return (
            <fieldset className="booking-item" key={field.id}>
              <legend>Vật liệu {index + 1}</legend>
              <div className="booking-item-fields">
                <InputField
                  id={`material-${field.id}`}
                  label="Loại vật liệu"
                  as="select"
                  required
                  error={itemErrors?.materialId}
                  {...register(`items.${index}.materialId`)}
                >
                  <option value="">Chọn loại vật liệu</option>
                  {materials.map((material) => (
                    <option
                      key={material.materialId}
                      value={material.materialId}
                      disabled={selected.some(
                        (other, otherIndex) =>
                          otherIndex !== index && other.materialId === String(material.materialId),
                      )}
                    >
                      {material.materialName}
                      {material.grade ? ` · ${material.grade}` : ''}
                    </option>
                  ))}
                </InputField>
                <InputField
                  id={`quantity-${field.id}`}
                  label="Số kg ước tính (tùy chọn)"
                  inputMode="decimal"
                  placeholder="Chưa rõ"
                  error={itemErrors?.estimatedQty}
                  {...register(`items.${index}.estimatedQty`)}
                />
                <button
                  className="icon-button remove-material"
                  type="button"
                  aria-label={`Bỏ vật liệu ${index + 1}`}
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <TrashIcon size={20} aria-hidden="true" />
                </button>
              </div>
              {item && (
                <p className="material-reference-price">Giá tham khảo: {formatPrice(item)}</p>
              )}
              <InputField
                id={`note-${field.id}`}
                label="Ghi chú vật liệu (không bắt buộc)"
                maxLength={500}
                error={itemErrors?.note}
                {...register(`items.${index}.note`)}
              />
            </fieldset>
          )
        })}
      </div>
      {(errors.items?.message || errors.items?.root?.message) && (
        <p className="field-error">{errors.items.message || errors.items.root.message}</p>
      )}
      <button
        className="button button-secondary add-material"
        type="button"
        disabled={fields.length >= Math.min(50, materials.length)}
        onClick={() =>
          append(
            { materialId: '', estimatedQty: '', note: '' },
            { focusName: `items.${fields.length}.materialId` },
          )
        }
      >
        <PlusIcon size={18} aria-hidden="true" />
        Thêm vật liệu
      </button>
    </section>
  )
}
