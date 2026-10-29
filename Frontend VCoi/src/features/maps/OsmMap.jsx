import { useEffect, useRef, useState } from 'react'
import markerUrl from 'leaflet/dist/images/marker-icon.png'
import markerRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { locationSchema } from './location'
import '../../styles/maps.css'

const EMPTY = []
const tiles = import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const osmAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
const sources = [
  { url: tiles, maxZoom: 19, attribution: osmAttribution },
  ...(!import.meta.env.VITE_MAP_TILE_URL
    ? [
        {
          url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
          maxZoom: 18,
          attribution:
            osmAttribution +
            ' · <a href="https://www.openstreetmap.de/">OSM Deutschland / FOSSGIS</a>',
        },
      ]
    : []),
]

export default function OsmMap({
  point,
  origin,
  geometry = EMPTY,
  onChange,
  disabled = false,
  label = 'Bản đồ điểm thu gom',
  originLabel = 'Vị trí xuất phát',
}) {
  const container = useRef(null),
    instance = useRef(null),
    layers = useRef(null),
    callbacks = useRef({})
  const [ready, setReady] = useState(false),
    [epoch, setEpoch] = useState(0),
    [loadingTiles, setLoadingTiles] = useState(true),
    [failure, setFailure] = useState('')
  useEffect(() => {
    callbacks.current = { onChange, disabled }
  }, [onChange, disabled])
  useEffect(() => {
    let disposed = false,
      map,
      tile,
      tileTimer,
      generation = 0
    import('leaflet')
      .then((module) => {
        if (disposed) return
        const L = module.default
        map = L.map(container.current, {
          scrollWheelZoom: false,
          zoomAnimation: false,
          fadeAnimation: false,
        }).setView([10.7769, 106.7009], 13)
        function activate(index) {
          clearTimeout(tileTimer)
          const current = ++generation
          // Leaflet must emit remove before off() so it detaches map event listeners.
          tile?.remove()
          tile?.off()
          setLoadingTiles(true)
          setFailure('')
          const fail = () => {
            if (disposed || current !== generation) return
            if (index + 1 < sources.length) activate(index + 1)
            else {
              clearTimeout(tileTimer)
              setLoadingTiles(false)
              setFailure(
                'Chưa tải được nền bản đồ. Điểm đã chọn vẫn được giữ. Bạn có thể tải lại bản đồ hoặc tiếp tục nhập địa chỉ.',
              )
            }
          }
          tile = L.tileLayer(sources[index].url, {
            maxZoom: sources[index].maxZoom,
            keepBuffer: 1,
            updateWhenIdle: true,
            referrerPolicy: 'strict-origin-when-cross-origin',
            attribution: sources[index].attribution,
          })
          tile.on('tileerror', fail)
          tile.on('tileload', () => {
            if (disposed || current !== generation) return
            clearTimeout(tileTimer)
            setLoadingTiles(false)
            setFailure('')
          })
          tileTimer = setTimeout(fail, 8000)
          tile.addTo(map)
        }
        activate(0)
        map.zoomControl
          .getContainer()
          ?.querySelector('.leaflet-control-zoom-in')
          ?.setAttribute('aria-label', 'Phóng to bản đồ')
        map.zoomControl
          .getContainer()
          ?.querySelector('.leaflet-control-zoom-out')
          ?.setAttribute('aria-label', 'Thu nhỏ bản đồ')
        map.on('click', (event) => {
          if (callbacks.current.disabled || !callbacks.current.onChange) return
          const p = locationSchema.safeParse({
            lat: event.latlng.lat,
            lng: event.latlng.wrap().lng,
          })
          if (p.success) callbacks.current.onChange(p.data)
        })
        instance.current = { map, L, retry: () => activate(0) }
        layers.current = L.layerGroup().addTo(map)
        setReady(true)
      })
      .catch(() => {
        if (!disposed) setFailure('Chưa mở được bản đồ. Hãy tải lại trang để thử lại.')
      })
    const resize = () => map?.invalidateSize({ pan: false })
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
    observer?.observe(container.current)
    window.addEventListener('resize', resize)
    return () => {
      disposed = true
      clearTimeout(tileTimer)
      tile?.remove()
      tile?.off()
      observer?.disconnect()
      window.removeEventListener('resize', resize)
      map?.remove()
      instance.current = null
      layers.current = null
    }
  }, [epoch])
  useEffect(() => {
    if (!ready || !instance.current) return
    const { map, L } = instance.current,
      group = layers.current
    group.clearLayers()
    const icon = L.icon({
      iconUrl: markerUrl,
      iconRetinaUrl: markerRetinaUrl,
      shadowUrl: markerShadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
    if (point)
      L.marker([point.lat, point.lng], {
        icon,
        title: 'Điểm thu gom khách chọn',
        alt: 'Điểm thu gom khách chọn',
        keyboard: false,
        interactive: false,
      }).addTo(group)
    if (origin)
      L.circleMarker([origin.lat, origin.lng], {
        radius: 8,
        color: '#ffffff',
        weight: 3,
        fillColor: '#246cde',
        fillOpacity: 1,
      })
        .addTo(group)
        .bindTooltip(originLabel)
    if (geometry.length > 1) {
      const line = L.polyline(
        geometry.map(([lng, lat]) => [lat, lng]),
        { color: '#287b50', weight: 5, opacity: 0.9 },
      ).addTo(group)
      map.fitBounds(line.getBounds(), { padding: [30, 30], maxZoom: 17, animate: false })
    } else if (origin && point) {
      map.fitBounds(L.latLngBounds([origin.lat, origin.lng], [point.lat, point.lng]), {
        padding: [30, 30],
        maxZoom: 15,
        animate: false,
      })
    } else if (point) map.setView([point.lat, point.lng], 16, { animate: false })
  }, [point, origin, originLabel, geometry, ready])
  function chooseCenter() {
    const center = instance.current?.map.getCenter()
    const p = center && locationSchema.safeParse({ lat: center.lat, lng: center.wrap().lng })
    if (p?.success) onChange(p.data)
  }
  return (
    <div className="osm-map-block">
      <div ref={container} className="osm-map" role="region" aria-label={label} />
      {(!ready || loadingTiles) && !failure && (
        <p className="field-hint" role="status">
          Đang tải nền bản đồ… Bạn vẫn có thể nhập địa chỉ.
        </p>
      )}
      {failure && (
        <div className="form-notice" role="status">
          {failure}
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              if (instance.current) instance.current.retry()
              else {
                setFailure('')
                setReady(false)
                setLoadingTiles(true)
                setEpoch((value) => value + 1)
              }
            }}
          >
            Tải lại bản đồ
          </button>
        </div>
      )}
      {onChange && !disabled && (
        <div className="map-center-actions">
          <button
            type="button"
            className="button button-secondary"
            disabled={!ready}
            onClick={chooseCenter}
          >
            Chọn điểm giữa bản đồ
          </button>
          <p className="field-hint">
            Bấm vào bản đồ để chọn điểm, hoặc dùng phím mũi tên di chuyển rồi chọn điểm giữa.
          </p>
        </div>
      )}
    </div>
  )
}
