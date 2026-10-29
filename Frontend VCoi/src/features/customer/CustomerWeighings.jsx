import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getWeighings } from '../orders/weighing-api'
import WeighingHistory from '../orders/WeighingHistory'
import useCustomerOrder from './useCustomerOrder'
import useCustomerAction from './useCustomerAction'
import ActionFeedback from '../../components/ActionFeedback'
import AsyncState from '../../components/AsyncState'
import '../../styles/weighing.css'

export default function CustomerWeighings({ order }) {
  const [open, setOpen] = useState(false),
    cache = useCustomerOrder(order)
  const query = useQuery({
    queryKey: [...cache.scope, 'customer-weighings', String(order.id), order.version],
    queryFn: ({ signal }) => getWeighings(order, { signal, role: 'CUSTOMER' }),
    retry: false,
    staleTime: 0,
    enabled: open,
  })
  const state = useCustomerAction(async () => {
    await cache.read()
    await cache.client.invalidateQueries({ queryKey: [...cache.scope, 'customer-weighings'] })
    await query.refetch({ throwOnError: true })
  })
  return (
    <details
      className="workspace-panel customer-section customer-disclosure"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <h2>Kết quả cân thực tế</h2>
      </summary>
      <button
        className="text-button"
        type="button"
        disabled={state.busy || query.isFetching}
        onClick={() => void state.refresh()}
      >
        Tải lại kết quả cân
      </button>
      <ActionFeedback state={state} />
      {query.isPending ? (
        <AsyncState title="Đang tải kết quả cân" busy />
      ) : query.isError ? (
        <AsyncState
          title="Chưa tải được kết quả cân"
          message={query.error.message}
          retry={state.refresh}
        />
      ) : query.data.records.length ? (
        <WeighingHistory order={order} records={query.data.records} />
      ) : (
        <p className="customer-empty">Nhân viên chưa ghi nhận kết quả cân cho đơn này.</p>
      )}
    </details>
  )
}
