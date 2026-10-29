import { useEffect, useRef } from 'react'
import AsyncState from '../../components/AsyncState'
import Pagination from '../../components/Pagination'
import PriceTable from './PriceTable'

export default function PriceHistory({
  panel,
  query,
  disabled,
  onOpen,
  onPage,
  onClose,
  onRefresh,
}) {
  const heading = useRef(null)
  useEffect(() => {
    heading.current?.focus()
  }, [panel.materialId])
  return (
    <section
      className="workspace-panel catalog-list price-history"
      aria-labelledby="price-history-title"
    >
      <div className="admin-panel-heading">
        <div>
          <p className="admin-breadcrumb">Tất cả trạng thái · Phiên bản mới nhất trước</p>
          <h2 id="price-history-title" ref={heading} tabIndex={-1}>
            Lịch sử giá · {panel.name}
          </h2>
        </div>
        <button className="text-button" type="button" disabled={disabled} onClick={onClose}>
          Đóng lịch sử
        </button>
      </div>
      <p className="price-history-note">
        Mỗi lần tạo nháp cấp một số phiên bản mới. Lịch sử lưu trạng thái cuối của mỗi phiên bản,
        không lưu từng lần sửa cùng một bản nháp.
      </p>
      {query.isPending ? (
        <AsyncState title="Đang tải lịch sử giá" busy />
      ) : query.isError ? (
        <AsyncState
          title="Chưa tải được lịch sử giá"
          message={query.error.message}
          retry={onRefresh}
        />
      ) : (
        <>
          {query.data.data.length ? (
            <PriceTable
              rows={query.data.data}
              history
              disabled={disabled || query.isFetching}
              onOpen={onOpen}
            />
          ) : (
            <AsyncState
              title="Chưa có phiên bản giá"
              message="Vật liệu này chưa được lập giá thu mua."
            />
          )}
          <Pagination
            page={panel.page}
            totalPages={query.data.totalPages}
            totalElements={query.data.totalElements}
            busy={disabled || query.isFetching}
            onChange={onPage}
            noun="phiên bản giá"
            ariaLabel="Phân trang lịch sử giá"
          />
        </>
      )}
    </section>
  )
}
