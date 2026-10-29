import { useState } from 'react'
import EvidenceImage from '../../components/EvidenceImage'
import { weighingPhotoFileProblem, weighingPhotoProblem } from './weighing-photo-api'
import useUnsavedChanges from '../navigation/useUnsavedChanges'

export default function WeighingPhoto({ order, history, row, quotes, disabled, onUpload }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const id = 'weighing-photo-' + row.id
  useUnsavedChanges(Boolean(file) && !row.photoUrl, 'Ảnh phiếu cân #' + row.id)
  if (row.photoUrl) return <EvidenceImage url={row.photoUrl} label={`Phiếu cân #${row.id}`} />
  const problem = quotes.isPending
    ? 'Đang kiểm tra báo giá trước khi bổ sung ảnh...'
    : quotes.isError
      ? 'Chưa kiểm tra được báo giá. Hãy tải lại đơn và lịch sử cân trước khi tải ảnh.'
      : weighingPhotoProblem(order, history, quotes.data, row.id)
  if (problem)
    return (
      <p className="weighing-photo-hint" role="status">
        {problem}
      </p>
    )
  return (
    <form
      className="weighing-photo-form"
      aria-label={`Ảnh phiếu cân #${row.id}`}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        const invalid = weighingPhotoFileProblem(file)
        if (invalid) setError(invalid)
        else void onUpload(row.id, file)
      }}
    >
      <fieldset disabled={disabled || quotes.isFetching}>
        <legend>Ảnh phiếu cân #{row.id}</legend>
        <label htmlFor={id}>Chọn ảnh phiếu #{row.id}</label>
        <p className="field-hint" id={id + '-hint'}>
          JPEG/PNG tối đa 5 MB; mỗi chiều tối đa 8192 px, tối đa 16 triệu điểm ảnh. Mỗi phiếu lưu
          một ảnh.
        </p>
        <input
          type="file"
          id={id}
          accept="image/jpeg,image/png"
          aria-describedby={id + '-hint' + (error ? ' ' + id + '-error' : '')}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            const selected = event.target.files?.[0]
            const invalid = selected ? weighingPhotoFileProblem(selected) : null
            setError(invalid)
            setFile(invalid ? null : selected)
          }}
        />
        {error && (
          <p className="field-error" id={id + '-error'} role="alert">
            {error}
          </p>
        )}
        {file && (
          <p className="field-hint" role="status">
            Đã chọn: {file.name} · {Math.ceil(file.size / 1024)} KB. Ảnh chưa được tải lên.
          </p>
        )}
        <button className="button button-secondary" type="submit" disabled={!file}>
          Tải ảnh phiếu #{row.id}
        </button>
      </fieldset>
    </form>
  )
}
