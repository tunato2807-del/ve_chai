import { useState } from 'react'
import { evidencePathSchema } from '../lib/validation'
import '../styles/evidence.css'
export default function EvidenceImage({ url, label }) {
  const [failed, setFailed] = useState(false)
  if (!url) return null
  if (!evidencePathSchema.safeParse(url).success)
    return <p className="field-hint">Ảnh chưa có đường dẫn hợp lệ.</p>
  return (
    <figure className="evidence-image">
      {failed ? (
        <p role="status">Chưa tải được ảnh. Hãy tải lại trang hoặc kiểm tra phiên đăng nhập.</p>
      ) : (
        <a href={url} target="_blank" rel="noreferrer" aria-label={`Mở ảnh ${label}`}>
          <img
            src={url}
            alt={label}
            loading="lazy"
            width={480}
            height={320}
            onError={() => setFailed(true)}
          />
        </a>
      )}
      <figcaption>{label}</figcaption>
    </figure>
  )
}
