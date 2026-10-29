import AsyncState from '../../components/AsyncState'
import { orderMoney } from '../orders/model'
import { reportNumber, reportPercent } from './reports-model'

const palette = ['#b8d96a', '#88ad62', '#638b5d', '#3f7357', '#a9c39b', '#d5e98c']
const currencyCompact = new Intl.NumberFormat('vi-VN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function aggregateMaterials(rows, field) {
  const totals = new Map()
  for (const row of rows) {
    const value = Number(row[field])
    if (!Number.isFinite(value) || value <= 0) continue
    totals.set(row.materialName, (totals.get(row.materialName) || 0) + value)
  }
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'vi'))
}

function topWithOther(rows, limit, otherLabel) {
  const visible = rows.slice(0, limit)
  const remaining = rows.slice(limit).reduce((sum, row) => sum + row.value, 0)
  if (remaining > 0) visible.push({ label: otherLabel, value: remaining })
  return visible
}

function formatCurrencyAxis(value) {
  if (!value) return '0'
  return currencyCompact.format(value)
}

function shortLabel(value) {
  const words = value.trim().split(/\s+/)
  if (value.length <= 15) return [value]
  const lines = ['', '']
  for (const word of words) {
    const target = lines[0].length <= lines[1].length ? 0 : 1
    lines[target] = `${lines[target]} ${word}`.trim()
  }
  return lines.map((line) => (line.length > 16 ? `${line.slice(0, 14)}…` : line))
}

function RevenueBars({ rows }) {
  const width = 720
  const height = 300
  const left = 74
  const right = 20
  const top = 18
  const bottom = 66
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const max = Math.max(1, ...rows.map((row) => row.value))
  const slot = plotWidth / Math.max(rows.length, 1)
  const barWidth = Math.min(44, slot * 0.58)

  return (
    <div className="report-chart-visual">
      <svg
        className="report-revenue-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Biểu đồ cột tiền thu mua đã thanh toán theo vật liệu"
      >
        {[0, 1, 2, 3, 4].map((tick) => {
          const y = top + (plotHeight * tick) / 4
          const amount = max * (1 - tick / 4)
          return (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={y} y2={y} className="report-chart-gridline" />
              <text x={left - 10} y={y + 4} textAnchor="end" className="report-chart-axis">
                {formatCurrencyAxis(amount)}
              </text>
            </g>
          )
        })}
        {rows.map((row, index) => {
          const barHeight = Math.max(2, (row.value / max) * plotHeight)
          const x = left + slot * index + (slot - barWidth) / 2
          const y = top + plotHeight - barHeight
          const lines = shortLabel(row.label)
          return (
            <g key={row.label}>
              <title>{`${row.label}: ${orderMoney(row.value)}`}</title>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="3"
                className="report-revenue-bar"
              />
              <text
                x={x + barWidth / 2}
                y={height - 38}
                textAnchor="middle"
                className="report-chart-label"
              >
                {lines.map((line, lineIndex) => (
                  <tspan
                    key={`${row.label}-${lineIndex}`}
                    x={x + barWidth / 2}
                    dy={lineIndex ? 13 : 0}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          )
        })}
      </svg>
      <ul
        className="report-chart-legend report-bar-legend"
        aria-label="Chi tiết tiền thu mua theo vật liệu"
      >
        {rows.map((row) => (
          <li key={row.label}>
            <span className="report-legend-dot" style={{ '--legend-color': 'var(--accent)' }} />
            <span>{row.label}</span>
            <strong>{orderMoney(row.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

function pieSector(cx, cy, radius, start, end) {
  const point = (angle) => [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  const [startX, startY] = point(start)
  const [endX, endY] = point(end)
  if (end - start >= Math.PI * 2 - 0.0001) {
    const [middleX, middleY] = point(start + Math.PI)
    return `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${middleX} ${middleY} A ${radius} ${radius} 0 1 1 ${startX} ${startY} Z`
  }
  const largeArc = end - start > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`
}

function MaterialPie({ rows, totalWeight }) {
  const slices = rows.reduce(
    (state, row, index) => {
      const end = state.angle + (row.value / totalWeight) * Math.PI * 2
      return {
        angle: end,
        rows: [...state.rows, { row, index, start: state.angle, end }],
      }
    },
    { angle: -Math.PI / 2, rows: [] },
  ).rows
  return (
    <div className="report-pie-layout">
      <svg
        className="report-material-pie"
        viewBox="0 0 240 240"
        role="img"
        aria-label="Biểu đồ tròn tỷ trọng khối lượng vật liệu đã thu mua"
      >
        {slices.map(({ row, index, start, end }) => (
          <path
            key={row.label}
            d={pieSector(120, 120, 104, start, end)}
            fill={palette[index % palette.length]}
          >
            <title>{`${row.label}: ${reportNumber(row.value)} kg (${reportPercent((row.value / totalWeight) * 100)})`}</title>
          </path>
        ))}
      </svg>
      <ul
        className="report-chart-legend report-pie-legend"
        aria-label="Tỷ trọng khối lượng theo vật liệu"
      >
        {rows.map((row, index) => (
          <li key={row.label}>
            <span
              className="report-legend-dot"
              style={{ '--legend-color': palette[index % palette.length] }}
            />
            <span>{row.label}</span>
            <strong>
              {reportNumber(row.value)} kg{' '}
              <small>{reportPercent((row.value / totalWeight) * 100)}</small>
            </strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ReportCharts({ query }) {
  if (query.isPending)
    return (
      <section className="workspace-panel report-chart-state">
        <AsyncState title="Đang tổng hợp biểu đồ vật liệu" busy />
      </section>
    )
  if (query.isError)
    return (
      <section className="workspace-panel report-chart-state">
        <AsyncState
          title="Chưa tải được số liệu biểu đồ"
          message={query.error.message}
          retry={() => void query.refetch()}
        />
      </section>
    )

  const aggregated = aggregateMaterials(query.data, 'totalAmount')
  const byWeight = aggregateMaterials(query.data, 'totalWeight')
  const revenueRows = topWithOther(aggregated, 7, 'Vật liệu khác')
  const weightRows = topWithOther(byWeight, 5, 'Vật liệu khác')
  const totalWeight = byWeight.reduce((sum, row) => sum + row.value, 0)
  const hasRevenue = revenueRows.length > 0
  const hasWeight = totalWeight > 0

  return (
    <section className="report-chart-grid" aria-label="Biểu đồ thu mua">
      <article className="workspace-panel report-chart-panel">
        <header>
          <div>
            <h2>Tiền thu mua theo vật liệu</h2>
            <p>Tổng tiền đã thanh toán trong kỳ, đơn vị VND.</p>
          </div>
          <span className="report-chart-period">Đã thanh toán</span>
        </header>
        {hasRevenue ? (
          <RevenueBars rows={revenueRows} />
        ) : (
          <p className="report-empty">Chưa có giao dịch thanh toán trong kỳ.</p>
        )}
      </article>
      <article className="workspace-panel report-chart-panel">
        <header>
          <div>
            <h2>Cơ cấu vật liệu đã thu</h2>
            <p>Tỷ trọng theo khối lượng thu mua, đơn vị kg.</p>
          </div>
          <span className="report-chart-period">{reportNumber(totalWeight)} kg</span>
        </header>
        {hasWeight ? (
          <MaterialPie rows={weightRows} totalWeight={totalWeight} />
        ) : (
          <p className="report-empty">Chưa có khối lượng thu mua trong kỳ.</p>
        )}
      </article>
    </section>
  )
}
