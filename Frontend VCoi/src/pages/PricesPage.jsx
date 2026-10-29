import useListSearchParams from '../features/navigation/useListSearchParams'
import { readListPage } from '../features/orders/list-location'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowClockwiseIcon } from '@phosphor-icons/react/ArrowClockwise'
import { ArrowLeftIcon } from '@phosphor-icons/react/ArrowLeft'
import { ArrowRightIcon } from '@phosphor-icons/react/ArrowRight'
import { InfoIcon } from '@phosphor-icons/react/Info'
import { getCategories, getCurrentPrices } from '../lib/catalog'
import PriceTable from '../features/prices/PriceTable'
import '../styles/prices.css'

export default function PricesPage() {
  const [params, setParams] = useListSearchParams()
  const category = params.get('categoryId') || ''
  const categoryId = /^[1-9]\d*$/.test(category) && Number(category) <= 2147483647 ? category : ''
  const page = readListPage(params)
  function change(nextCategory, nextPage = 0) {
    setParams({
      ...(nextCategory && { categoryId: nextCategory }),
      ...(nextPage > 0 && { page: String(nextPage) }),
    })
  }
  function setPage(nextPage) {
    change(categoryId, nextPage)
  }
  const categories = useQuery({
    queryKey: ['material-categories'],
    queryFn: ({ signal }) => getCategories({ signal }),
  })
  const prices = useQuery({
    queryKey: ['current-prices', categoryId, page],
    queryFn: ({ signal }) => getCurrentPrices({ categoryId, page, signal }),
  })
  const busy = prices.isFetching || categories.isFetching
  const result = prices.data

  function changeCategory(event) {
    change(event.target.value)
  }

  function refresh() {
    void prices.refetch()
    void categories.refetch()
  }

  return (
    <div className="container prices-page">
      <Link className="back-link" to="/">
        <ArrowLeftIcon size={17} aria-hidden="true" /> Trang chủ
      </Link>
      <header className="prices-heading">
        <div className="prices-introduction">
          <p className="prices-eyebrow">BẢNG GIÁ THU MUA</p>
          <h1>
            Giá rõ ràng.
            <br />
            Thu gom an tâm.
          </h1>
          <p>
            Tra cứu đơn giá hiện hành cho từng vật liệu.
            <br />
            Báo giá cuối cùng theo phân loại và khối lượng cân thực tế.
          </p>
        </div>
        <Link className="button button-primary" to="/dat-lich">
          Đặt lịch thu gom <ArrowRightIcon size={19} aria-hidden="true" />
        </Link>
      </header>
      <section aria-label="Bảng giá thu mua" className="price-panel">
        <div className="price-toolbar">
          <div className="filter-field">
            <label htmlFor="category">Nhóm vật liệu</label>
            <select
              id="category"
              value={categoryId}
              onChange={changeCategory}
              disabled={categories.isPending || categories.isError}
            >
              <option value="">Tất cả vật liệu</option>
              {categories.data?.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="button button-secondary refresh-button"
            type="button"
            onClick={refresh}
            disabled={busy}
          >
            <ArrowClockwiseIcon size={18} aria-hidden="true" />
            {busy ? 'Đang tải...' : 'Làm mới giá'}
          </button>
        </div>
        {categories.isError && (
          <p className="filter-warning" role="status">
            Chưa tải được nhóm vật liệu. Bạn vẫn có thể xem bảng giá và bấm làm mới để thử lại.
          </p>
        )}
        <div className="price-results" aria-busy={prices.isFetching}>
          {prices.isPending ? (
            <div className="data-state" role="status">
              <span className="loading-line" />
              <p>Đang tải bảng giá thu mua...</p>
            </div>
          ) : prices.isError ? (
            <div className="data-state" role="alert">
              <h2>Chưa tải được bảng giá</h2>
              <p>{prices.error.message}</p>
              <button
                type="button"
                className="button button-primary"
                onClick={() => void prices.refetch()}
              >
                Thử lại
              </button>
            </div>
          ) : result.data.length === 0 ? (
            <div className="data-state" role="status">
              <h2>Chưa có vật liệu phù hợp</h2>
              <p>Thử chọn nhóm khác hoặc xem lại sau khi đại lý cập nhật vật liệu.</p>
              {categoryId && (
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => {
                    change('')
                  }}
                >
                  Xem tất cả vật liệu
                </button>
              )}
            </div>
          ) : (
            <PriceTable rows={result.data} />
          )}
        </div>
        {!prices.isPending && !prices.isError && (
          <div className="price-pagination">
            <p aria-live="polite">
              {result.totalElements} vật liệu
              {result.totalPages > 0 && ` · Trang ${page + 1} / ${result.totalPages}`}
            </p>
            <div>
              <button
                className="icon-button"
                type="button"
                aria-label="Trang trước"
                disabled={page === 0 || prices.isFetching}
                onClick={() => setPage(page - 1)}
              >
                <ArrowLeftIcon size={19} aria-hidden="true" />
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label="Trang sau"
                disabled={page + 1 >= result.totalPages || prices.isFetching}
                onClick={() => setPage(page + 1)}
              >
                <ArrowRightIcon size={19} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </section>
      <div className="price-footnote">
        <InfoIcon size={21} aria-hidden="true" />
        <div>
          <p>
            Chưa có đơn giá? “Liên hệ báo giá” nghĩa là vật liệu cần được đại lý báo giá trước khi
            thu mua.
          </p>
        </div>
      </div>
    </div>
  )
}
