import { formatPrice } from '../../lib/format'

export default function PriceTable({ rows }) {
  return (
    <table className="price-table">
      <caption className="sr-only">
        Đơn giá thu mua hiện hành theo vật liệu, đơn vị đồng trên kg
      </caption>
      <thead>
        <tr>
          <th scope="col">Vật liệu</th>
          <th scope="col" className="desktop-cell">
            Nhóm
          </th>
          <th scope="col" className="desktop-cell">
            Phân hạng
          </th>
          <th scope="col" className="price-cell">
            Đơn giá / kg
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.materialId}>
            <th scope="row">
              <span className="material-name">{row.materialName}</span>
              <span className="mobile-detail">
                {row.categoryName}
                {row.grade ? ` · ${row.grade}` : ''}
              </span>
            </th>
            <td className="desktop-cell">{row.categoryName}</td>
            <td className="desktop-cell">{row.grade || 'Chưa phân hạng'}</td>
            <td
              className={`price-cell ${row.priceStatus === 'CONTACT_FOR_QUOTE' ? 'quote-price' : ''}`}
            >
              {formatPrice(row)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
