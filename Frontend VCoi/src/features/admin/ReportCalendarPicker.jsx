import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import InputField from '../../components/InputField'
import { calendarPeriod, shiftDay } from './reports-period'

function initialKind(values) {
  if (values.from === values.end) return 'day'
  if (values.from?.endsWith('-01') && values.end) {
    const to = shiftDay(values.end, 1),
      months =
        (Number(to.slice(0, 4)) - Number(values.from.slice(0, 4))) * 12 +
        Number(to.slice(5, 7)) -
        Number(values.from.slice(5, 7))
    if (to.endsWith('-01') && months === 12 && values.from.endsWith('-01-01')) return 'year'
    if (
      to.endsWith('-01') &&
      months === 3 &&
      [1, 4, 7, 10].includes(Number(values.from.slice(5, 7)))
    )
      return 'quarter'
  }
  return 'month'
}
export default function ReportCalendarPicker({ values, disabled, onApply, onDirty }) {
  const form = useForm({
    defaultValues: {
      kind: initialKind(values),
      day: values.from,
      month: values.from.slice(0, 7),
      quarter: String(Math.floor((Number(values.from.slice(5, 7)) - 1) / 3) + 1),
      year: values.from.slice(0, 4),
    },
  })
  const kind = useWatch({ control: form.control, name: 'kind' })
  const dirty = form.formState.isDirty
  useEffect(() => {
    onDirty(dirty)
  }, [dirty, onDirty])
  function submit(data) {
    try {
      const range = calendarPeriod(data)
      onApply(range)
    } catch (error) {
      form.setError('root', { message: error.issues?.[0]?.message || error.message })
    }
  }
  return (
    <form
      className="calendar-period"
      aria-label="Thống kê theo lịch"
      noValidate
      onSubmit={form.handleSubmit(submit)}
    >
      <fieldset className="calendar-period-fields" disabled={disabled}>
        <legend className="sr-only">Chọn ngày, tháng, quý hoặc năm</legend>
        <InputField id="report-kind" as="select" label="Thống kê theo" {...form.register('kind')}>
          <option value="day">Ngày</option>
          <option value="month">Tháng</option>
          <option value="quarter">Quý</option>
          <option value="year">Năm</option>
        </InputField>
        {kind === 'day' && (
          <InputField
            id="report-day"
            type="date"
            label="Chọn ngày"
            min="0001-01-02"
            max="9998-12-31"
            required
            {...form.register('day')}
          />
        )}
        {kind === 'month' && (
          <InputField
            id="report-month"
            type="month"
            label="Chọn tháng"
            min="0001-02"
            max="9998-12"
            required
            {...form.register('month')}
          />
        )}
        {kind === 'quarter' && (
          <InputField
            id="report-quarter"
            as="select"
            label="Chọn quý"
            {...form.register('quarter')}
          >
            <option value="1">Quý I · tháng 1–3</option>
            <option value="2">Quý II · tháng 4–6</option>
            <option value="3">Quý III · tháng 7–9</option>
            <option value="4">Quý IV · tháng 10–12</option>
          </InputField>
        )}
        {['quarter', 'year'].includes(kind) && (
          <InputField
            id="report-year"
            type="number"
            inputMode="numeric"
            label="Chọn năm"
            min="1"
            max="9998"
            required
            {...form.register('year')}
          />
        )}
        <button className="button button-primary" type="submit">
          Áp dụng kỳ
        </button>
      </fieldset>
      {form.formState.errors.root && (
        <p role="alert" className="field-error">
          {form.formState.errors.root.message}
        </p>
      )}
    </form>
  )
}
