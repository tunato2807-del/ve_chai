import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import InputField from '../../components/InputField'
import { reportFormSchema, periodFromForm, periodPreset, reportFormValues } from './reports-period'
import useUnsavedChanges from '../navigation/useUnsavedChanges'
import ReportCalendarPicker from './ReportCalendarPicker'

const presets = [
  ['day', 'Hôm nay'],
  ['month', 'Tháng này'],
  ['previous-month', 'Tháng trước'],
  ['quarter', 'Quý này'],
  ['year', 'Năm nay'],
]
export default function ReportPeriodForm({ values, period, disabled, onApply }) {
  const [calendarDirty, setCalendarDirty] = useState(false),
    [calendarEpoch, setCalendarEpoch] = useState(0)
  const form = useForm({ resolver: zodResolver(reportFormSchema), defaultValues: values })
  const protection = useUnsavedChanges(
    form.formState.isDirty || calendarDirty,
    'Kỳ thống kê chưa áp dụng',
  )
  function apply(range) {
    form.reset(reportFormValues(range))
    setCalendarDirty(false)
    setCalendarEpoch((value) => value + 1)
    protection.clear()
    onApply(range)
  }
  return (
    <section className="workspace-panel report-period" aria-labelledby="report-period-title">
      <div className="report-period-heading">
        <h2 id="report-period-title">Kỳ thống kê</h2>
        <div className="report-presets" role="group" aria-label="Kỳ chọn nhanh">
          {presets.map(([key, label]) => {
            const range = periodPreset(key),
              active = period?.from === range.from && period?.to === range.to
            return (
              <button
                key={key}
                type="button"
                className="report-preset"
                aria-pressed={active}
                disabled={disabled}
                onClick={() => protection.confirmDiscard(() => apply(range))}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
      <ReportCalendarPicker
        key={calendarEpoch}
        values={values}
        disabled={disabled}
        onDirty={setCalendarDirty}
        onApply={(range) =>
          form.formState.isDirty ? protection.confirmDiscard(() => apply(range)) : apply(range)
        }
      />
      <p className="report-custom-label">Hoặc chọn khoảng ngày tùy chỉnh</p>
      <form
        onSubmit={form.handleSubmit(() => {
          const range = periodFromForm(form.getValues())
          if (calendarDirty) protection.confirmDiscard(() => apply(range))
          else apply(range)
        })}
        noValidate
        aria-label="Chọn kỳ thống kê"
      >
        <fieldset className="report-date-fields" disabled={disabled}>
          <legend className="sr-only">Ngày đầu và ngày cuối kỳ</legend>
          <InputField
            id="report-from"
            label="Từ ngày"
            type="date"
            required
            min="0001-01-02"
            max="9999-12-30"
            error={form.formState.errors.from}
            {...form.register('from')}
          />
          <InputField
            id="report-end"
            label="Đến hết ngày"
            type="date"
            required
            min="0001-01-02"
            max="9999-12-30"
            error={form.formState.errors.end}
            {...form.register('end')}
          />
          <button className="button button-primary" type="submit">
            Xem thống kê
          </button>
        </fieldset>
        <p className="field-hint">
          Theo ngày Việt Nam (UTC+7), bao gồm ngày bắt đầu và ngày kết thúc. Chọn tối đa 366 ngày.
        </p>
      </form>
    </section>
  )
}
