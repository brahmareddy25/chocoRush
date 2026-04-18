import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { getOrder } from '../api/orders.js';
import { formatCurrency } from '../utils/format.js';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const response = await getOrder(orderId);
        setOrder(response.order || null);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  return (
    <main className="success-page">
      <section className="success-card">
        <CheckCircle2 size={54} />
        <p>Order placed</p>
        <h1>Your chocolates are on the move.</h1>
        {loading ? (
          <span>Loading order...</span>
        ) : order ? (
          <>
            <strong>Order ID: {order.id}</strong>
            <p>Status: {order.status || 'Placed'}</p>
            {order.paymentMethod && (
              <p>Payment method: {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Pay online'}</p>
            )}
            {order.expectedDeliveryDate && <p>Expected delivery: {new Date(order.expectedDeliveryDate).toLocaleString('en-IN')}</p>}
            <ul>
              {order.items.map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <b>x{item.quantity}</b>
                </li>
              ))}
            </ul>
            {order.pricing && (
              <>
                <p>Subtotal: {formatCurrency(order.pricing.subtotal || 0)}</p>
                <p>GST: {formatCurrency(order.pricing.gst || 0)}</p>
                <p>Delivery: {formatCurrency(order.pricing.deliveryCharge || 0)}</p>
                {order.pricing.codCharge ? <p>COD fee: {formatCurrency(order.pricing.codCharge)}</p> : null}
              </>
            )}
            <h2>{formatCurrency(order.total)}</h2>
          </>
        ) : (
          <span>Order details are unavailable.</span>
        )}
        <div className="success-actions">
          <Link className="primary-link" to="/orders">
            View orders
          </Link>
          <Link className="ghost-link" to="/">
            Keep shopping
          </Link>
        </div>
      </section>
    </main>
  );
}
