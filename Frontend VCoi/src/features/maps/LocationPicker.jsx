import { useEffect, useRef, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { CrosshairIcon } from '@phosphor-icons/react/Crosshair'
import OsmMap from './OsmMap'
import { currentLocation } from './location'

export default function LocationPicker({ disabled = false }) {
  const form = useFormContext(),
    point = useWatch({ control: form.control, name: 'location' })
  const [busy, setBusy] = useState(false),
    [failure, setFailure] = useState('')
  const active = useRef(false),
    pending = useRef(null),
    request = useRef(0)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      pending.current?.abort()
    }
  }, [])
  function select(value) {
    pending.current?.abort()
    request.current++
    setFailure('')
    setBusy(false)
    form.setValue('location', value, { shouldDirty: true, shouldValidate: true })
  }
  async function locate() {
    pending.current?.abort()
    const controller = new AbortController()
    pending.current = controller
    const ticket = ++request.current
    setBusy(true)
    setFailure('')
    try {
      const value = await currentLocation({ signal: controller.signal })
      if (active.current && ticket === request.current)
        form.setValue('location', value, { shouldDirty: true, shouldValidate: true })
    } catch (error) {
      if (active.current && ticket === request.current && error.name !== 'AbortError')
        setFailure(error.message)
    } finally {
      if (active.current && ticket === request.current) setBusy(false)
    }
  }
  return (
    <section className="pickup-location" aria-label="Vị trí trên bản đồ">
      <div className="location-heading">
        <div>
          <h3>Vị trí thu gom trên bản đồ</h3>
          <p className="field-hint">Chọn đúng cổng hoặc lối vào để nhân viên tìm đến thuận tiện.</p>
        </div>
        {!disabled && (
          <button
            type="button"
            className="button button-secondary"
            disabled={busy}
            onClick={() => void locate()}
          >
            <CrosshairIcon size={18} aria-hidden="true" />
            {busy ? 'Đang lấy vị trí…' : 'Lấy vị trí hiện tại'}
          </button>
        )}
      </div>
      {busy && (
        <p className="location-wait" role="status">
          Đang lấy vị trí, tối đa 6 giây.{' '}
          <button type="button" className="text-button" onClick={() => pending.current?.abort()}>
            Hủy lấy vị trí
          </button>
        </p>
      )}
      {failure && (
        <p className="form-error" role="alert">
          {failure}
        </p>
      )}
      <OsmMap
        point={point}
        onChange={select}
        disabled={disabled}
        label="Bản đồ chọn vị trí thu gom"
      />
      <div className="location-selection">
        <p role="status">
          {point
            ? 'Đã chọn điểm thu gom. Hãy đối chiếu với địa chỉ đã nhập.'
            : 'Chưa chọn điểm bản đồ. Bạn vẫn có thể đặt lịch bằng địa chỉ liên hệ.'}
        </p>
        {point && !disabled && (
          <button type="button" className="text-button" onClick={() => select(null)}>
            Bỏ điểm đã chọn
          </button>
        )}
      </div>
    </section>
  )
}
