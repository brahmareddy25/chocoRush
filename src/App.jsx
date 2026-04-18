import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import CartPanel from './components/CartPanel.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import OrderHistory from './pages/OrderHistory.jsx';
import Profile from './pages/Profile.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { useAuth } from './context/AuthContext.jsx';

export default function App() {
  const { booting } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const fallbackPath = isAdminRoute ? '/admin/login' : '/login';
  const params = new URLSearchParams(location.search);
  const redirectParam = params.get('redirect');
  const storedRedirect =
    typeof window !== 'undefined' ? window.sessionStorage.getItem('chocorush_redirect_path') : '';
  const pendingRedirectPath =
    location.pathname === '/' && (redirectParam || storedRedirect)?.startsWith('/')
      ? redirectParam || storedRedirect
      : '';

  useEffect(() => {
    if (!pendingRedirectPath) {
      return;
    }

    window.sessionStorage.removeItem('chocorush_redirect_path');
    navigate(pendingRedirectPath, { replace: true });
  }, [navigate, pendingRedirectPath]);

  if (booting || pendingRedirectPath) {
    return (
      <main className="app-loader">
        <div className="loader-ring" />
        <p>Tempering your chocolate run...</p>
      </main>
    );
  }

  return (
    <>
      {!isAdminRoute && <Header />}
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrderHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/success/:orderId"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to={fallbackPath} replace />} />
      </Routes>
      {!isAdminRoute && <CartPanel />}
    </>
  );
}
