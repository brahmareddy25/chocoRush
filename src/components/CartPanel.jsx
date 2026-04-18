import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../utils/format.js';

export default function CartPanel() {
  const { items, isOpen, total, updateQuantity, removeItem, toggleCart } = useCart();

  return (
    <>
      <aside className={`cart-panel ${isOpen ? 'open' : ''}`}>
        <div className="cart-head">
          <div>
            <p>Your cart</p>
            <h2>{items.length ? `${items.length} item${items.length > 1 ? 's' : ''}` : 'Hungry cart'}</h2>
          </div>
          <button className="icon-btn" onClick={() => toggleCart(false)} type="button" aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty-cart">
            <p>Add a chocolate and the checkout magic starts here.</p>
          </div>
        ) : (
          <div className="cart-items">
            {items.map((item) => (
              <article className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} />
                <div>
                  <h3>{item.name}</h3>
                  <p>{formatCurrency(item.price)}</p>
                  <div className="qty-row">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} type="button">
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} type="button">
                      <Plus size={14} />
                    </button>
                    <button className="remove-btn" onClick={() => removeItem(item.id)} type="button">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="cart-footer">
          <div className="total-row">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
          <Link
            className={`checkout-btn ${items.length ? '' : 'disabled'}`}
            onClick={() => items.length && toggleCart(false)}
            to={items.length ? '/checkout' : '#'}
          >
            Checkout
          </Link>
        </div>
      </aside>
      {isOpen && <button className="cart-scrim" onClick={() => toggleCart(false)} type="button" aria-label="Close cart" />}
    </>
  );
}
