import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ShoppingBag, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const { count, toggleCart } = useCart();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header className="site-header">
      <Link className="brand" to="/">
        <img alt="NutBliss logo" className="brand-logo" src="/nutbliss-logo.jpeg" />
        <span>
          <strong>NutBliss</strong>
          <small>Chocolates made with love</small>
        </span>
      </Link>

      <nav className="main-nav">
        <NavLink to="/">Shop</NavLink>
        {user && <NavLink to="/orders">Orders</NavLink>}
        {user && <NavLink to="/profile">Profile</NavLink>}
      </nav>

      <div className="header-actions">
        {user ? (
          <>
            <span className="user-pill">
              <UserRound size={16} />
              {user.displayName || user.email}
            </span>
            <button className="ghost-btn" onClick={handleLogout} type="button">
              <LogOut size={17} />
              Logout
            </button>
          </>
        ) : (
          <Link className="primary-link" to="/login">
            Login
          </Link>
        )}
        <button className="cart-trigger" onClick={() => toggleCart()} type="button" aria-label="Open cart">
          <ShoppingBag size={20} />
          <span>{count}</span>
        </button>
      </div>
    </header>
  );
}
