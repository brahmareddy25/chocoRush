import { useEffect, useMemo, useState } from 'react';
import { getOrders, submitOrderRating } from '../api/orders.js';
import OrderCard from '../components/OrderCard.jsx';
import RatingModal from '../components/RatingModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dismissedRatingOrderIds, setDismissedRatingOrderIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [rating, setRating] = useState(0);
  const [ratingMessage, setRatingMessage] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await getOrders();
        setOrders(response.orders || []);
        setLoading(false);
      } catch {
        setError('Could not load your orders right now.');
        setLoading(false);
      }
    }

    loadOrders();
  }, [user.uid]);

  const visibleOrders = useMemo(() => {
    if (statusFilter === 'All') return orders;
    return orders.filter((order) => (order.status || 'Placed') === statusFilter);
  }, [orders, statusFilter]);

  const pendingRatingOrder = useMemo(
    () =>
      orders.find(
        (order) => order.status === 'Delivered' && !order.rating && !dismissedRatingOrderIds.includes(order.id)
      ),
    [orders, dismissedRatingOrderIds]
  );

  async function handleSubmitRating() {
    if (!pendingRatingOrder || !rating) return;
    setSubmittingRating(true);

    try {
      await submitOrderRating({
        orderId: pendingRatingOrder.id,
        rating,
        message: ratingMessage
      });
      setOrders((current) =>
        current.map((order) =>
          order.id === pendingRatingOrder.id ? { ...order, rating, ratingMessage } : order
        )
      );
      setDismissedRatingOrderIds((current) => current.concat(pendingRatingOrder.id));
      setRating(0);
      setRatingMessage('');
    } catch (err) {
      setError(err.message || 'Could not save rating right now.');
    } finally {
      setSubmittingRating(false);
    }
  }

  return (
    <main className="orders-page">
      <div className="section-title">
        <div>
          <p>Your chocolate trail</p>
          <h1>Order history</h1>
        </div>
      </div>

      <div className="admin-filters">
        <label>
          Filter
          <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option value="All">All</option>
            <option value="Placed">Placed</option>
            <option value="Accepted">Accepted</option>
            <option value="Preparing">Preparing</option>
            <option value="Delivered">Delivered</option>
          </select>
        </label>
      </div>

      {error && <p className="notice">{error}</p>}
      {loading ? (
        <div className="orders-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="order-skeleton" key={index} />
          ))}
        </div>
      ) : visibleOrders.length ? (
        <div className="orders-grid">
          {visibleOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <p>Your first chocolate delivery will appear here.</p>
        </div>
      )}

      <RatingModal
        message={ratingMessage}
        onClose={() => {
          if (pendingRatingOrder) {
            setDismissedRatingOrderIds((current) => current.concat(pendingRatingOrder.id));
          }
          setRating(0);
          setRatingMessage('');
        }}
        onMessageChange={setRatingMessage}
        onSelectRating={setRating}
        onSubmit={handleSubmitRating}
        open={Boolean(pendingRatingOrder)}
        order={pendingRatingOrder}
        rating={rating}
        submitting={submittingRating}
      />
    </main>
  );
}
