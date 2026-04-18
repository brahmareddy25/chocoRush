import { Plus, Star } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../utils/format.js';

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        <span className="rating-chip">
          <Star size={14} fill="currentColor" />
          {Number(product.rating || 4.5).toFixed(1)}
        </span>
      </div>
      <div className="product-copy">
        <p className="category-label">{product.category}</p>
        <h3>{product.name}</h3>
        <div className="card-bottom">
          <strong>{formatCurrency(product.price)}</strong>
          <button className="add-btn" onClick={() => addItem(product)} type="button">
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
