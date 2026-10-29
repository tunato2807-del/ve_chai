import OrderChanges from './OrderChanges'
import OrderDisputes from './OrderDisputes'
import OrderEvidence from './OrderEvidence'
import OrderTimeline from './OrderTimeline'
import CustomerWeighings from './CustomerWeighings'
import CustomerPayments from './CustomerPayments'
export default function CustomerOrderExtras({ order }) {
  return (
    <div className="customer-order-extras">
      <div className="customer-order-actions-grid">
        <OrderChanges order={order} />
        <OrderDisputes order={order} />
      </div>
      <OrderEvidence order={order} />
      <CustomerWeighings order={order} />
      <OrderTimeline order={order} />
      <CustomerPayments order={order} />
    </div>
  )
}
