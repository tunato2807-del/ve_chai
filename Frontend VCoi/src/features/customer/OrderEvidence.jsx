import { useState } from 'react'
import EvidenceImage from '../../components/EvidenceImage'
import { beforeTrip } from './order-action-model'
import { uploadMaterialPhoto } from './order-actions-api'
import useCustomerOrder from './useCustomerOrder'
import useCustomerAction from './useCustomerAction'
import ActionFeedback from '../../components/ActionFeedback'
import useUnsavedChanges from '../navigation/useUnsavedChanges'

export default function OrderEvidence({ order }) {
  const cache = useCustomerOrder(order),
    [files, setFiles] = useState({})
  const protection = useUnsavedChanges(Object.values(files).some(Boolean), 'Ảnh vật liệu')
  const state = useCustomerAction(async () => {
    await cache.read()
    setFiles({})
  })
  function upload(item) {
    void state.run(
      () => uploadMaterialPhoto(order, item.itemId, files[item.itemId]),
      async (result) => {
        setFiles({})
        await cache.commit({
          order: {
            ...order,
            version: result.orderVersion,
            items: order.items.map((row) =>
              row.itemId === item.itemId ? { ...row, photoUrl: result.url } : row,
            ),
          },
        })
      },
      'Đã lưu ảnh vật liệu vào đơn.',
    )
  }
  return (
    <details className="workspace-panel customer-section customer-disclosure">
      <summary>
        <h2>Ảnh vật liệu</h2>
      </summary>
      <p className="customer-description">
        Mỗi vật liệu có một ảnh JPEG/PNG tối đa 5 MB, không quá 8192 px mỗi chiều và 16 triệu điểm
        ảnh. Có thể bổ sung trước khi nhân viên khởi hành.
      </p>
      <button
        className="text-button"
        type="button"
        disabled={state.busy}
        onClick={() => protection.confirmDiscard(() => void state.refresh())}
      >
        Tải lại ảnh vật liệu
      </button>
      <ActionFeedback state={state} />
      <ul className="customer-records">
        {order.items.map((item) => (
          <li key={item.itemId}>
            <h3>{item.materialName}</h3>
            {item.photoUrl ? (
              <EvidenceImage url={item.photoUrl} label={`Vật liệu ${item.materialName}`} />
            ) : beforeTrip(order) ? (
              <div className="customer-photo-form">
                <label htmlFor={`material-photo-${item.itemId}`}>
                  Chọn ảnh {item.materialName}
                </label>
                <input
                  id={`material-photo-${item.itemId}`}
                  type="file"
                  accept="image/jpeg,image/png"
                  disabled={state.busy || state.blocked}
                  onChange={(event) =>
                    setFiles({ ...files, [item.itemId]: event.target.files?.[0] })
                  }
                />
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={state.busy || state.blocked || !files[item.itemId]}
                  onClick={() => upload(item)}
                >
                  Tải ảnh {item.materialName}
                </button>
              </div>
            ) : (
              <p className="customer-empty">Chưa có ảnh vật liệu này.</p>
            )}
          </li>
        ))}
      </ul>
    </details>
  )
}
