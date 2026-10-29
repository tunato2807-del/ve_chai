import { useConfirmDiscard } from '../features/navigation/useUnsavedChanges'
import { useTransition } from 'react'
import useListSearchParams from '../features/navigation/useListSearchParams'
import { ArrowsClockwiseIcon } from '@phosphor-icons/react/ArrowsClockwise'
import { FileCsvIcon } from '@phosphor-icons/react/FileCsv'
import { FileXlsIcon } from '@phosphor-icons/react/FileXls'
import AsyncState from '../components/AsyncState'
import { periodLabel, readReportFilters } from '../features/admin/reports-period'
import useAdminReports from '../features/admin/useAdminReports'
import { exportReportCsv, exportReportXlsx } from '../features/admin/reports-export'
import ReportPeriodForm from '../features/admin/ReportPeriodForm'
import ReportMetrics from '../features/admin/ReportMetrics'
import ReportCharts from '../features/admin/ReportCharts'
import ReportBreakdown from '../features/admin/ReportBreakdown'
import '../styles/workspace.css'
import '../styles/admin-catalog.css'
import '../styles/admin-reports.css'

export default function AdminReportsPage() {
  const confirmDiscard = useConfirmDiscard()

  const [params, setParams] = useListSearchParams(),
    filters = readReportFilters(params)
  const { period, values, group, page } = filters
  const [navigating, startTransition] = useTransition(),
    state = useAdminReports(filters)
  const { overview, details, materials } = state
  const exportReady = Boolean(
    period &&
    overview.isSuccess &&
    materials.isSuccess &&
    !overview.isFetching &&
    !materials.isFetching,
  )
  function navigate(next) {
    startTransition(() =>
      setParams({
        ...next.period,
        ...(next.group === 'collectors' && { group: next.group }),
        ...(next.page > 0 && { page: String(next.page) }),
      }),
    )
  }
  function apply(next) {
    if (period?.from === next.from && period?.to === next.to && page === 0) void state.refresh()
    navigate({ period: next, group, page: 0 })
  }
  return (
    <section className="admin-reports-page">
      <header className="admin-page-heading">
        <div>
          <p className="admin-breadcrumb">Quản trị / Thống kê</p>
          <h1>Thống kê thu mua</h1>
          <p className="muted">
            Theo dõi đơn thu gom, khối lượng thực tế và tiền đại lý đã chi theo kỳ.
          </p>
        </div>
        <div className="report-heading-actions">
          <button
            className="button button-secondary"
            type="button"
            disabled={
              !period ||
              navigating ||
              overview.isFetching ||
              details.isFetching ||
              materials.isFetching
            }
            onClick={() => confirmDiscard(() => void state.refresh())}
          >
            <ArrowsClockwiseIcon size={17} aria-hidden="true" />
            Tải lại số liệu
          </button>
          <button
            className="button button-secondary report-export-button"
            type="button"
            disabled={!exportReady || navigating}
            onClick={() =>
              exportReportCsv({ period, overview: overview.data, materials: materials.data })
            }
          >
            <FileCsvIcon size={17} aria-hidden="true" />
            Xuất CSV
          </button>
          <button
            className="button button-primary report-export-button"
            type="button"
            disabled={!exportReady || navigating}
            onClick={() =>
              exportReportXlsx({ period, overview: overview.data, materials: materials.data })
            }
          >
            <FileXlsIcon size={17} aria-hidden="true" />
            Xuất XLSX
          </button>
        </div>
      </header>
      <ReportPeriodForm
        key={`${values.from}:${values.end}`}
        values={values}
        period={period}
        disabled={navigating}
        onApply={apply}
      />
      {!period ? (
        <div className="form-error" role="alert">
          Kỳ thống kê trong đường dẫn chưa hợp lệ. Hãy chọn lại ngày bắt đầu và ngày kết thúc, tối
          đa 366 ngày.
        </div>
      ) : (
        <>
          <p className="report-applied-period" aria-live="polite">
            Đang xem: <strong>{periodLabel(period)}</strong> · Giờ Việt Nam
          </p>
          {overview.isPending ? (
            <section className="workspace-panel report-loading">
              <AsyncState title="Đang tải tổng quan" busy />
            </section>
          ) : overview.isError ? (
            <section className="workspace-panel report-loading">
              <AsyncState
                title="Chưa tải được tổng quan"
                message={overview.error.message}
                retry={() => void overview.refetch()}
              />
            </section>
          ) : (
            <>
              <ReportMetrics data={overview.data} />
              <ReportCharts query={materials} />
            </>
          )}
          <p className="report-measurement-note">
            Số đơn và tỷ lệ tính theo ngày tạo đơn. Khối lượng và tiền tính theo ngày thanh toán, có
            thể gồm đơn tạo từ kỳ trước. Đơn đã thanh toán rồi phát sinh khiếu nại vẫn được tính vào
            tiền đã chi.
          </p>
          <ReportBreakdown
            query={details}
            group={group}
            page={page}
            navigating={navigating}
            onGroup={(next) => navigate({ period, group: next, page: 0 })}
            onPage={(next) => navigate({ period, group, page: next })}
          />
        </>
      )}
    </section>
  )
}
