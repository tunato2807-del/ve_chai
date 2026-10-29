export default function CatalogFilters({ kind, filters, options, disabled, onChange }) {
  return (
    <div className="catalog-filters">
      {kind === 'materials' && (
        <div className="form-field">
          <label htmlFor="catalog-filter-category">Lọc danh mục</label>
          <select
            id="catalog-filter-category"
            value={filters.categoryId}
            disabled={disabled || !options.isSuccess}
            onChange={(event) => onChange({ ...filters, categoryId: event.target.value, page: 0 })}
          >
            <option value="">Tất cả danh mục</option>
            {options.data?.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
                {!row.isActive ? ' (đang ẩn)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="form-field">
        <label htmlFor="catalog-filter-status">
          {kind === 'categories' ? 'Hiển thị' : 'Thu mua'}
        </label>
        <select
          id="catalog-filter-status"
          value={filters.status}
          disabled={disabled}
          onChange={(event) => onChange({ ...filters, status: event.target.value, page: 0 })}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">{kind === 'categories' ? 'Đang hiện' : 'Đang nhận'}</option>
          <option value="false">{kind === 'categories' ? 'Đã ẩn' : 'Đã ngừng'}</option>
        </select>
      </div>
    </div>
  )
}
