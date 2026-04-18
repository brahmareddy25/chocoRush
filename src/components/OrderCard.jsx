import { formatCurrency, formatDate } from '../utils/format.js';

export default function OrderCard({ order }) {
  return (
    <article className="order-card">
      <div className="order-title">
        <div>
          <p>Order #{order.id.slice(0, 8)}</p>
          <h3>{formatCurrency(order.total)}</h3>
        </div>
        <span className={`status-pill ${String(order.status || 'Placed').toLowerCase()}`}>
          {order.status || 'Placed'}
        </span>
      </div>
      <p className="order-date">{formatDate(order.createdAt)}</p>
      {order.expectedDeliveryDate && <p className="order-date">Expected: {formatDate(order.expectedDeliveryDate)}</p>}
      {order.address && <p className="order-date">{order.address}</p>}
      <ul>
        {(order.items || []).map((item) => (
          <li key={item.id}>
            <span>{item.name}</span>
            <strong>x{item.quantity}</strong>
          </li>
        ))}
      </ul>
      {order.rating && (
        <p className="order-date">
          Rating: {order.rating}/5 {order.ratingMessage ? `- ${order.ratingMessage}` : ''}
        </p>
      )}
    </article>
  );
}
