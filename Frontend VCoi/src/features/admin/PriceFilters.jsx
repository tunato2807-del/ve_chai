import InputField from '../../components/InputField'
import { priceStatuses } from './prices-model'

export default function PriceFilters({ filters, options, disabled, onChange }) {
  return (
    <div className="catalog-filters price-filters">
      <InputField
        id="price-filter-material"
        label="Lọc theo vật liệu"
        as="select"
        value={filters.materialId}
        disabled={disabled || !options.isSuccess}
        onChange={(event) => onChange({ ...filters, materialId: event.target.value, page: 0 })}
      >
        <option value="">Tất cả vật liệu</option>
        {filters.materialId &&
          !options.data?.some((row) => String(row.id) === filters.materialId) && (
            <option value={filters.materialId}>Vật liệu #{filters.materialId}</option>
          )}
        {options.data?.map((row) => (
          <option key={row.id} value={row.id}>
            {row.name} · {row.grade}
            {!row.available ? ' (chưa công khai)' : ''}
          </option>
        ))}
      </InputField>
      <InputField
        id="price-filter-status"
        label="Lọc theo trạng thái"
        as="select"
        value={filters.approvalStatus}
        disabled={disabled}
        onChange={(event) => onChange({ ...filters, approvalStatus: event.target.value, page: 0 })}
      >
        <option value="">Tất cả trạng thái</option>
        {Object.entries(priceStatuses).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </InputField>
    </div>
  )
}
