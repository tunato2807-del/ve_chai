import QuoteCard from './QuoteCard'
import { orderTime, orderMoney } from './model'
import { paymentMethods } from './payment-model'
import '../../styles/order-receipt.css'

export default function OrderReceipt({ receipt }) {
  const { order, quote, payment } = receipt
  return (
    <article className="workspace-panel order-receipt">
      <h2>Đơn {order.code}</h2>
      <dl className="detail-fields receipt-fields">
        <div>
          <dt>Người bán</dt>
          <dd>{order.contactName}</dd>
        </div>
        <div>
          <dt>Số điện thoại</dt>
          <dd>{order.contactPhone}</dd>
        </div>
        <div className="receipt-address">
          <dt>Điểm thu gom</dt>
          <dd>{order.address}</dd>
        </div>
        <div>
          <dt>Thời gian chi trả</dt>
          <dd>{orderTime(payment.paidAt)}</dd>
        </div>
        <div>
          <dt>Phương thức</dt>
          <dd>{paymentMethods[payment.method]}</dd>
        </div>
        <div>
          <dt>Mã giao dịch</dt>
          <dd>{payment.referenceCode || '#' + payment.id}</dd>
        </div>
        <div>
          <dt>Tổng tiền thu mua đã chi</dt>
          <dd className="receipt-amount">{orderMoney(payment.amount)}</dd>
        </div>
      </dl>
      <QuoteCard quote={quote} now={Date.parse(payment.paidAt)} />
      <p className="receipt-note">
        Biên nhận ghi khối lượng và đơn giá đã được khách chấp thuận, đối chiếu với thanh toán hoàn
        tất. Đây là giao dịch mô phỏng của đồ án và không phải hóa đơn thuế.
      </p>
    </article>
  )
}
