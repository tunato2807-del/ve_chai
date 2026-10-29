import { Link } from 'react-router-dom'
import { ArrowUpRightIcon } from '@phosphor-icons/react/ArrowUpRight'
import { orderStatuses, orderTime } from './model'

export default function OrderList({ rows, home, listPath = home }) {
  return (
    <ul className="order-list">
      {rows.map((order) => (
        <li key={order.id}>
          <Link to={`${home}/don/${order.id}`} state={{ listPath }}>
            <div>
              <span className="order-code">{order.code}</span>
              <p>
                <time dateTime={order.pickupStart}>{orderTime(order.pickupStart)}</time>
              </p>
            </div>
            <div className="order-list-end">
              <span className={`order-status status-${order.status.toLowerCase()}`}>
                {orderStatuses[order.status]}
              </span>
              <ArrowUpRightIcon size={20} aria-hidden="true" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
