import { MessageSquare, Star } from 'lucide-react';

export default function RatingModal({
  open,
  order,
  rating,
  message,
  onSelectRating,
  onMessageChange,
  onSubmit,
  onClose,
  submitting
}) {
  if (!open || !order) return null;

  return (
    <div className="modal-scrim">
      <section className="modal-card">
        <p>Delivered order</p>
        <h2>How was your chocolate run?</h2>
        <div className="rating-row">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              className={`star-btn ${value <= rating ? 'active' : ''}`}
              key={value}
              onClick={() => onSelectRating(value)}
              type="button"
            >
              <Star fill="currentColor" size={20} />
            </button>
          ))}
        </div>
        <label>
          <span className="inline-label">
            <MessageSquare size={16} />
            Message
          </span>
          <textarea onChange={(event) => onMessageChange(event.target.value)} rows="4" value={message} />
        </label>
        <div className="modal-actions">
          <button className="ghost-btn" onClick={onClose} type="button">
            Later
          </button>
          <button className="primary-link" disabled={!rating || submitting} onClick={onSubmit} type="button">
            {submitting ? 'Saving...' : 'Send rating'}
          </button>
        </div>
      </section>
    </div>
  );
}
