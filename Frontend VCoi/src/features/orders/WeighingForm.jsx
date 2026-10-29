import useUnsavedChanges from '../navigation/useUnsavedChanges'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FloppyDiskIcon } from '@phosphor-icons/react/FloppyDisk'
import { weighingDefaults, weighingFormSchema } from './weighing-form'
import { latestWeighings } from './weighing-model'
import WeighingRow from './WeighingRow'

export default function WeighingForm({ order, history, busy, blocked, onSubmit }) {
  const methods = useForm({
    resolver: zodResolver(weighingFormSchema(order, history), undefined, { raw: true }),
    defaultValues: weighingDefaults(order, history),
  })

  useUnsavedChanges(methods.formState.isDirty, 'Kết quả cân thực tế')
  const latest = latestWeighings(history.records)
  return (
    <FormProvider {...methods}>
      <form className="weighing-form" onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <fieldset className="weighing-form-fields" disabled={busy || blocked}>
          <legend className="sr-only">Nhập kết quả cân theo vật liệu</legend>
          {order.items.map((item, index) => (
            <WeighingRow
              key={item.itemId}
              item={item}
              index={index}
              previous={latest.get(item.itemId)}
            />
          ))}
        </fieldset>
        {methods.formState.errors.items?.root && (
          <p className="field-error" role="alert">
            {methods.formState.errors.items.root.message}
          </p>
        )}
        <div className="weighing-save">
          <p className="field-hint">
            Đơn vị kg; tối đa 3 số thập phân. Chỉ lưu các vật liệu đã chọn.
          </p>
          <button className="button button-primary" type="submit" disabled={busy || blocked}>
            <FloppyDiskIcon size={19} aria-hidden="true" />
            {busy ? 'Đang lưu…' : 'Lưu kết quả cân'}
          </button>
        </div>
      </form>
    </FormProvider>
  )
}
