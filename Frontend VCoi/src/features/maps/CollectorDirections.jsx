import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/context'
import { NavigationArrowIcon } from '@phosphor-icons/react/NavigationArrow'
import { temporaryCollectorOrigin, temporaryCollectorOriginLabel } from './collector-origin'
import { getCollectorRoute, routeDistance, routeDuration, routeStatuses } from './routing-api'
import OsmMap from './OsmMap'

export default function CollectorDirections({ order }) {
  const { user } = useAuth(),
    client = useQueryClient()
  const [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState('')
  const active = useRef(false),
    pending = useRef(null),
    lock = useRef(false)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      pending.current?.abort()
    }
  }, [])
  const sameSession = useCallback(() => {
    const actor = client.getQueryData(['session'])
    return actor?.id === user.id && actor?.role === 'COLLECTOR'
  }, [client, user.id])
  const orderId = order.id,
    orderStatus = order.status,
    pickupLatitude = order.pickupLocation?.lat,
    pickupLongitude = order.pickupLocation?.lng
  const findRoute = useCallback(async () => {
    if (lock.current || !sameSession()) return
    lock.current = true
    setBusy(true)
    setFailure('')
    const controller = new AbortController()
    pending.current = controller
    try {
      const currentOrder = {
        id: orderId,
        status: orderStatus,
        pickupLocation:
          pickupLatitude === undefined || pickupLongitude === undefined
            ? null
            : { lat: pickupLatitude, lng: pickupLongitude },
      }
      const found = await getCollectorRoute(currentOrder, temporaryCollectorOrigin, {
        signal: controller.signal,
      })
      if (active.current && sameSession() && !controller.signal.aborted) setResult(found)
    } catch (error) {
      if (active.current && sameSession() && !controller.signal.aborted) setFailure(error.message)
    } finally {
      lock.current = false
      if (active.current && sameSession()) setBusy(false)
    }
  }, [orderId, orderStatus, pickupLatitude, pickupLongitude, sameSession])
  useEffect(() => {
    if (orderStatus !== 'ASSIGNED' || pickupLatitude === undefined || pickupLongitude === undefined)
      return
    // Defer one tick so React Strict Mode's development-only setup/cleanup does not lock out the request.
    const timer = setTimeout(() => void findRoute(), 0)
    return () => clearTimeout(timer)
  }, [findRoute, orderStatus, pickupLatitude, pickupLongitude])
  const allowed = routeStatuses.has(order.status)
  return (
    <section className="workspace-panel order-route" aria-labelledby="route-title">
      <div className="location-heading">
        <div>
          <h2 id="route-title">Đường đến điểm thu gom</h2>
          <p className="field-hint">
            Ô tô / xe tải nhỏ · Ưu tiên quãng đường ngắn
            {order.pickupLocation && (
              <>
                <br />
                Điểm xuất phát tạm: {temporaryCollectorOriginLabel}
              </>
            )}
          </p>
        </div>
        {order.pickupLocation && allowed && (
          <button
            type="button"
            className="button button-primary"
            disabled={busy}
            onClick={() => void findRoute()}
          >
            <NavigationArrowIcon size={18} aria-hidden="true" />
            {busy
              ? 'Đang tìm đường…'
              : result
                ? 'Tính lại tuyến đường'
                : 'Tìm đường từ điểm xuất phát tạm'}
          </button>
        )}
      </div>
      {!order.pickupLocation ? (
        <p className="form-notice">
          Đơn này chưa có điểm bản đồ. Hãy liên hệ khách theo địa chỉ và số điện thoại trong đơn.
        </p>
      ) : (
        <>
          {failure && (
            <p className="form-error" role="alert">
              {failure}
            </p>
          )}
          {busy && (
            <p role="status" className="field-hint">
              Đang tính tuyến đường từ điểm xuất phát tạm…
            </p>
          )}
          <OsmMap
            point={order.pickupLocation}
            origin={
              result?.origin || (order.status === 'ASSIGNED' ? temporaryCollectorOrigin : null)
            }
            originLabel="Điểm xuất phát tạm"
            geometry={result?.geometry.coordinates}
            label="Bản đồ đường đến điểm thu gom"
          />
          {result && (
            <>
              <dl className="route-summary">
                <div>
                  <dt>Quãng đường</dt>
                  <dd>{routeDistance(result.distanceMeters)}</dd>
                </div>
                <div>
                  <dt>Thời gian ước tính</dt>
                  <dd>{routeDuration(result.durationSeconds)}</dd>
                </div>
              </dl>
              {result.steps.length > 0 && (
                <details>
                  <summary>Hướng dẫn từng chặng</summary>
                  <ol className="route-steps">
                    {result.steps.map((step, index) => (
                      <li key={index}>
                        {step.instruction}
                        <span>{routeDistance(step.distanceMeters)}</span>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
              <p className="field-hint">{result.attribution}</p>
            </>
          )}
          {!allowed && (
            <p className="field-hint">
              Đơn đã qua giai đoạn di chuyển. Bạn có thể xem lại điểm thu gom trên bản đồ.
            </p>
          )}
          <p className="field-hint">
            Điểm này chỉ dùng minh họa cho đồ án; sẽ thay bằng địa chỉ chính thức của đại lý sau.
          </p>
        </>
      )}
    </section>
  )
}
