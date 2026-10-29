import { orderMoney } from '../orders/model'
import { reportNumber, reportPercent } from './reports-model'

function Metric({ title, label, value, note }) {
  return (
    <div className="report-metric">
      <dt>{title}</dt>
      <dd>
        <output aria-label={label}>{value}</output>
        <small>{note}</small>
      </dd>
    </div>
  )
}
export default function ReportMetrics({ data }) {
  return (
    <div className="report-metric-groups">
      <section
        className="workspace-panel report-metric-group"
        aria-labelledby="report-created-title"
      >
        <h2 id="report-created-title">Ngày tạo đơn</h2>
        <dl className="report-metrics">
          <Metric
            title="Đơn tạo trong kỳ"
            label="Số đơn tạo trong kỳ"
            value={reportNumber(data.totalOrders)}
            note="Tất cả trạng thái của đơn tạo trong kỳ"
          />
          <Metric
            title="Tỷ lệ hoàn tất"
            label="Tỷ lệ hoàn tất"
            value={reportPercent(data.completionRatePercent)}
            note={
              data.totalOrders
                ? `${reportNumber(data.completedOrders)} / ${reportNumber(data.totalOrders)} đơn đã từng hoàn tất`
                : 'Không có đơn tạo trong kỳ để tính tỷ lệ'
            }
          />
        </dl>
      </section>
      <section className="workspace-panel report-metric-group" aria-labelledby="report-paid-title">
        <h2 id="report-paid-title">Ngày thanh toán</h2>
        <dl className="report-metrics">
          <Metric
            title="Khối lượng thu mua"
            label="Khối lượng đã thu mua"
            value={`${reportNumber(data.totalWeight)} kg`}
            note={`Từ ${reportNumber(data.paidOrders)} đơn đã thanh toán trong kỳ`}
          />
          <Metric
            title="Tiền chi thu mua"
            label="Tiền đã chi thu mua"
            value={orderMoney(data.totalPaidAmount)}
            note="Số tiền đại lý đã chi trả trong kỳ"
          />
        </dl>
      </section>
    </div>
  )
}
