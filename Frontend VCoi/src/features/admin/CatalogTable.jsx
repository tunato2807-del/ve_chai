import { statusAction } from './catalog-model'

export default function CatalogTable({ kind, rows, disabled, onEdit, onStatus }) {
  const material = kind === 'materials',
    noun = material ? 'vật liệu' : 'danh mục'
  return (
    <div
      className="catalog-table-scroll"
      role="region"
      aria-label={`Danh sách ${noun}, có thể cuộn ngang`}
      tabIndex={0}
    >
      <table className="catalog-table" aria-label={`Danh sách ${noun}`}>
        <thead>
          <tr>
            <th scope="col">{material ? 'Vật liệu / Phân hạng' : 'Danh mục'}</th>
            <th scope="col">{material ? 'Danh mục' : 'Mô tả'}</th>
            <th scope="col">{material ? 'Tiếp nhận' : 'Hiển thị'}</th>
            <th scope="col">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                <strong>{row.name}</strong>
                {material && (
                  <small>
                    {row.grade} · {row.unit}
                  </small>
                )}
              </th>
              <td>{material ? row.categoryName : row.description || 'Chưa có mô tả'}</td>
              <td>
                {material ? (
                  <>
                    <span className={`catalog-state ${row.accepted ? 'is-on' : ''}`}>
                      {row.accepted ? 'Đang nhận' : 'Đã ngừng'}
                    </span>
                    <small>
                      {row.available
                        ? 'Hiển thị công khai'
                        : !row.categoryActive
                          ? 'Ẩn theo danh mục'
                          : 'Không tiếp nhận'}
                    </small>
                  </>
                ) : (
                  <span className={`catalog-state ${row.isActive ? 'is-on' : ''}`}>
                    {row.isActive ? 'Đang hiện' : 'Đã ẩn'}
                  </span>
                )}
              </td>
              <td>
                <div className="catalog-row-actions">
                  <button
                    className="text-button"
                    type="button"
                    disabled={disabled}
                    aria-label={`Sửa ${noun} ${row.name}`}
                    onClick={() => onEdit(row)}
                  >
                    Sửa
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    disabled={disabled}
                    aria-label={`${statusAction(kind, !(material ? row.accepted : row.isActive)).replace(/^./, (text) => text.toUpperCase())} ${row.name}`}
                    onClick={() => onStatus(row)}
                  >
                    {material
                      ? row.accepted
                        ? 'Ngừng thu mua'
                        : 'Thu mua trở lại'
                      : row.isActive
                        ? 'Ẩn'
                        : 'Hiện'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
