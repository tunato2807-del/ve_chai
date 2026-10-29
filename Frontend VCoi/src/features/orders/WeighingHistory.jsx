import { actualKg, latestWeighings, toMilliKg } from './weighing-model'
import { orderTime } from './model'
import EvidenceImage from '../../components/EvidenceImage'

export default function WeighingHistory({ order, records, renderEvidence }) {
  if (!records.length)
    return (
      <p className="weighing-empty" role="status">
        Chưa có kết quả cân. Chọn vật liệu và nhập khối lượng thực tế để lưu lần đầu.
      </p>
    )
  const latest = latestWeighings(records)
  const name = (id) => order.items.find((item) => item.itemId === id)?.materialName
  const total = [...latest.values()].reduce((sum, row) => sum + toMilliKg(row.netWeight), 0) / 1000
  return (
    <section className="weighing-history" aria-labelledby="weighing-saved-title">
      <div className="weighing-saved-heading">
        <h3 id="weighing-saved-title">Kết quả cân đã lưu</h3>
        <p>
          {latest.size}/{order.items.length} vật liệu · <strong>{actualKg(total)}</strong>
        </p>
      </div>
      <ul className="weighing-saved-list">
        {[...latest.values()].map((row) => (
          <li key={row.id}>
            <strong>{name(row.itemId)}</strong>
            <dl>
              <div>
                <dt>Tổng</dt>
                <dd>{actualKg(row.grossWeight)}</dd>
              </div>
              <div>
                <dt>Bì</dt>
                <dd>{actualKg(row.tareWeight)}</dd>
              </div>
              <div>
                <dt>Thực nhận</dt>
                <dd>{actualKg(row.netWeight)}</dd>
              </div>
            </dl>
            {renderEvidence?.(row)}
          </li>
        ))}
      </ul>
      <details className="weighing-audit">
        <summary>Lịch sử các lần cân ({records.length})</summary>
        <ol>
          {[...records]
            .sort((a, b) => b.id - a.id)
            .map((row) => (
              <li key={row.id}>
                <div>
                  <strong>
                    {name(row.itemId)} · Phiếu #{row.id}
                  </strong>
                  <span>{orderTime(row.createdAt)}</span>
                </div>
                <p>
                  Tổng {actualKg(row.grossWeight)} − bì {actualKg(row.tareWeight)} ={' '}
                  <strong>{actualKg(row.netWeight)}</strong>
                </p>
                {row.correctionOf && (
                  <p>
                    Điều chỉnh phiếu #{row.correctionOf}: {row.correctionReason}
                  </p>
                )}
                {row.photoUrl && (
                  <EvidenceImage url={row.photoUrl} label={`Phiếu cân #${row.id}`} />
                )}
              </li>
            ))}
        </ol>
      </details>
    </section>
  )
}
