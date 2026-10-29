import { useConfirmDiscard } from '../features/navigation/useUnsavedChanges'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../features/auth/context'
import {
  getAddresses,
  saveAddress,
  makeDefaultAddress,
  deleteAddress,
} from '../features/customer/account-api'
import useCustomerAction from '../features/customer/useCustomerAction'
import ActionFeedback from '../components/ActionFeedback'
import AddressForm from '../features/customer/AddressForm'
import AsyncState from '../components/AsyncState'
import '../styles/customer.css'
import '../styles/forms.css'
import '../styles/workspace.css'

export default function CustomerAddressesPage() {
  const confirmDiscard = useConfirmDiscard()

  const { user } = useAuth(),
    client = useQueryClient()
  const [editing, setEditing] = useState(null),
    [removing, setRemoving] = useState(null)
  const key = ['private', user.id, 'CUSTOMER', 'addresses']
  const rows = useQuery({ queryKey: key, queryFn: getAddresses, retry: false, staleTime: 0 })
  const state = useCustomerAction(async () => {
    await rows.refetch({ throwOnError: true })
    setEditing(null)
    setRemoving(null)
  })
  async function updated() {
    setEditing(null)
    setRemoving(null)
    await client.invalidateQueries({ queryKey: key })
    await client.invalidateQueries({ queryKey: ['private', user.id, 'CUSTOMER', 'order'] })
  }
  return (
    <section className="container workspace-page customer-page">
      <header className="workspace-heading">
        <div>
          <h1>Địa chỉ thu gom</h1>
          <p className="muted">
            Lưu điểm hẹn để đặt lịch nhanh hơn. Sửa địa chỉ không thay đổi đơn đã đặt.
          </p>
        </div>
        <button
          className="button button-primary"
          type="button"
          disabled={
            state.busy ||
            state.blocked ||
            rows.isPending ||
            rows.isError ||
            rows.data?.length >= 100
          }
          onClick={() =>
            confirmDiscard(() => {
              setEditing({})
              setRemoving(null)
            })
          }
        >
          Thêm địa chỉ
        </button>
      </header>
      <div className="customer-toolbar">
        <span>Tối đa 100 địa chỉ</span>
        <button
          className="text-button"
          type="button"
          disabled={state.busy || rows.isFetching}
          onClick={() => confirmDiscard(() => void state.refresh())}
        >
          Tải lại địa chỉ
        </button>
      </div>
      <ActionFeedback state={state} />
      {editing && (
        <AddressForm
          key={editing.id || 'new'}
          address={editing.id ? editing : null}
          user={user}
          disabled={state.busy || state.blocked}
          onClose={() => setEditing(null)}
          onSave={(values) =>
            void state.run(
              () => saveAddress(editing.id ? editing : null, values),
              updated,
              'Đã lưu địa chỉ thu gom.',
            )
          }
        />
      )}
      {rows.isPending ? (
        <AsyncState title="Đang tải địa chỉ" busy />
      ) : rows.isError ? (
        <AsyncState
          title="Chưa tải được địa chỉ"
          message={rows.error.message}
          retry={() => confirmDiscard(() => void state.refresh())}
        />
      ) : !rows.data.length ? (
        <AsyncState
          title="Chưa có địa chỉ lưu sẵn"
          message="Thêm điểm thu gom đầu tiên, hoặc nhập địa chỉ trực tiếp khi đặt lịch."
        />
      ) : (
        <ul className="customer-addresses">
          {rows.data.map((row) => (
            <li key={row.id} className="workspace-panel customer-address">
              <header>
                <h2>{row.pickupAddress.contactName}</h2>
                {row.isDefault && <span className="customer-default">Mặc định</span>}
              </header>
              <p>{row.pickupAddress.contactPhone}</p>
              {row.pickupAddress.location && (
                <p className="field-hint">
                  Đã lưu điểm bản đồ · Chọn Sửa địa chỉ để xem hoặc cập nhật.
                </p>
              )}
              <p>
                {[
                  row.pickupAddress.addressLine,
                  row.pickupAddress.ward,
                  row.pickupAddress.district,
                  row.pickupAddress.province,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <div className="customer-actions">
                <button
                  className="text-button"
                  type="button"
                  disabled={state.busy || state.blocked}
                  onClick={() =>
                    confirmDiscard(() => {
                      setEditing(row)
                      setRemoving(null)
                    })
                  }
                  aria-label={`Sửa địa chỉ của ${row.pickupAddress.contactName}`}
                >
                  Sửa địa chỉ
                </button>
                {!row.isDefault && (
                  <button
                    className="text-button"
                    type="button"
                    disabled={state.busy || state.blocked}
                    onClick={() =>
                      void state.run(
                        () => makeDefaultAddress(row.id),
                        updated,
                        'Đã chọn địa chỉ mặc định.',
                      )
                    }
                  >
                    Đặt làm mặc định
                  </button>
                )}
                <button
                  className="text-button"
                  type="button"
                  disabled={state.busy || state.blocked}
                  onClick={() =>
                    confirmDiscard(() => {
                      setRemoving(row.id)
                      setEditing(null)
                    })
                  }
                  aria-label={`Xóa địa chỉ của ${row.pickupAddress.contactName}`}
                >
                  Xóa
                </button>
              </div>
              {removing === row.id && (
                <div className="customer-confirm">
                  <p>Xóa địa chỉ lưu này? Thông tin trên các đơn đã đặt vẫn được giữ nguyên.</p>
                  <div className="customer-actions">
                    <button
                      className="button button-secondary"
                      type="button"
                      disabled={state.busy || state.blocked}
                      onClick={() =>
                        void state.run(() => deleteAddress(row.id), updated, 'Đã xóa địa chỉ lưu.')
                      }
                    >
                      Xác nhận xóa địa chỉ
                    </button>
                    <button
                      className="text-button"
                      type="button"
                      disabled={state.busy}
                      onClick={() => setRemoving(null)}
                    >
                      Giữ địa chỉ
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Link className="text-link" to="/dat-lich">
        Đặt lịch thu gom →
      </Link>
    </section>
  )
}
