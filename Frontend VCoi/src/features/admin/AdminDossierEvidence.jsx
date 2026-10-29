import EvidenceImage from '../../components/EvidenceImage'
import { orderTime } from '../orders/model'

export default function AdminDossierEvidence({ order, records }) {
  const materials = order.items.filter((item) => item.photoUrl)
  const weighings = records.filter((row) => row.photoUrl).sort((a, b) => b.id - a.id)
  if (!materials.length && !weighings.length)
    return <p className="dossier-empty">Chưa có ảnh minh chứng cho đơn này.</p>
  return (
    <div className="dossier-evidence">
      <p className="dossier-note">
        Ảnh vật liệu của khách và ảnh phiếu cân được lưu theo đơn. Chọn ảnh để mở kích thước đầy đủ.
      </p>
      {materials.length > 0 && (
        <section aria-labelledby="dossier-material-photos">
          <h3 id="dossier-material-photos">Ảnh vật liệu ({materials.length})</h3>
          <div className="dossier-photo-grid">
            {materials.map((item) => (
              <EvidenceImage
                key={item.itemId + item.photoUrl}
                url={item.photoUrl}
                label={'Vật liệu: ' + item.materialName}
              />
            ))}
          </div>
        </section>
      )}
      {weighings.length > 0 && (
        <section aria-labelledby="dossier-weighing-photos">
          <h3 id="dossier-weighing-photos">Ảnh phiếu cân ({weighings.length})</h3>
          <div className="dossier-photo-grid">
            {weighings.map((row) => (
              <div key={row.id + row.photoUrl}>
                <EvidenceImage url={row.photoUrl} label={'Phiếu cân #' + row.id} />
                <p className="dossier-note">
                  {order.items.find((item) => item.itemId === row.itemId)?.materialName} ·{' '}
                  {orderTime(row.createdAt)}
                  {row.correctionOf && ' · Điều chỉnh phiếu #' + row.correctionOf}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
