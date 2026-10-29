import AsyncState from '../../components/AsyncState'
import Pagination from '../../components/Pagination'
import { orderMoney } from '../orders/model'
import { materialReportKey, reportNumber } from './reports-model'

const groups = [
  ['materials', 'Theo vật liệu'],
  ['collectors', 'Theo nhân viên'],
]
export default function ReportBreakdown({ query, group, page, navigating, onGroup, onPage }) {
  const materials = group === 'materials'
  const tableName = materials ? 'Thống kê theo vật liệu' : 'Thống kê theo nhân viên'
  function tabKey(event, index) {
    const target = { ArrowRight: 1 - index, ArrowLeft: 1 - index, Home: 0, End: 1 }[event.key]
    if (target === undefined) return
    event.preventDefault()
    onGroup(groups[target][0])
    document.getElementById(`report-tab-${groups[target][0]}`)?.focus()
  }
  return (
    <section className="workspace-panel report-breakdown" aria-labelledby="report-breakdown-title">
      <header className="report-breakdown-heading">
        <h2 id="report-breakdown-title">Chi tiết thu mua đã thanh toán</h2>
        <p>Theo ngày thanh toán trong kỳ, từ báo giá đã chốt.</p>
      </header>
      <div className="report-tabs" role="tablist" aria-label="Nhóm chi tiết thống kê">
        {groups.map(([key, label], index) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`report-tab-${key}`}
            aria-selected={key === group}
            aria-controls="report-breakdown-panel"
            tabIndex={key === group ? 0 : -1}
            onClick={() => onGroup(key)}
            onKeyDown={(event) => tabKey(event, index)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        id="report-breakdown-panel"
        role="tabpanel"
        aria-labelledby={`report-tab-${group}`}
        tabIndex={0}
      >
        <p className="report-breakdown-note">
          {materials
            ? 'Tên và hạng vật liệu được giữ theo từng giao dịch. Cùng một vật liệu có thể có nhiều nhóm tên hoặc hạng; một đơn có thể xuất hiện ở nhiều nhóm.'
            : 'Nhân viên là người ghi nhận thanh toán. Tên hiển thị theo hồ sơ hiện tại.'}
        </p>
        {query.isPending ? (
          <AsyncState title="Đang tải chi tiết thống kê" busy />
        ) : query.isError ? (
          <AsyncState
            title="Chưa tải được chi tiết thống kê"
            message={query.error.message}
            retry={() => void query.refetch()}
          />
        ) : (
          <>
            {query.data.data.length ? (
              <div
                className="catalog-table-scroll"
                role="region"
                aria-label={`${tableName}, cuộn ngang để xem đủ cột`}
                tabIndex={0}
              >
                <table className="catalog-table report-table" aria-label={tableName}>
                  <thead>
                    <tr>
                      <th scope="col">
                        {materials ? 'Vật liệu tại giao dịch' : 'Người ghi nhận thanh toán'}
                      </th>
                      <th scope="col">Đơn đã trả tiền</th>
                      <th scope="col">Khối lượng</th>
                      <th scope="col">Tiền thu mua</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.data.map((row) => (
                      <tr key={materials ? materialReportKey(row) : row.collectorId}>
                        <th scope="row">
                          {materials ? row.materialName : row.collectorName}
                          <small>
                            {materials
                              ? `Vật liệu #${row.materialId} · ${row.grade || 'Không phân hạng'}`
                              : `Nhân viên #${row.collectorId}`}
                          </small>
                        </th>
                        <td>{reportNumber(row.paidOrders)} đơn</td>
                        <td>{reportNumber(row.totalWeight)} kg</td>
                        <td>{orderMoney(row.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : page >= query.data.totalPages && query.data.totalElements > 0 ? (
              <div className="report-empty">
                <p>Trang thống kê không còn dữ liệu.</p>
                <button className="text-button" type="button" onClick={() => onPage(0)}>
                  Về trang đầu
                </button>
              </div>
            ) : (
              <AsyncState
                title="Chưa có giao dịch phù hợp"
                message="Chưa có giao dịch đã thanh toán trong kỳ này. Bạn có thể chọn khoảng ngày khác."
              />
            )}
            <Pagination
              page={page}
              totalPages={query.data.totalPages}
              totalElements={query.data.totalElements}
              busy={navigating || query.isFetching}
              onChange={onPage}
              noun={materials ? 'nhóm vật liệu' : 'nhân viên'}
              ariaLabel="Phân trang chi tiết thống kê"
            />
          </>
        )}
      </div>
    </section>
  )
}
