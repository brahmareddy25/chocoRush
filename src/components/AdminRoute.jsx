import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext.jsx';

export default function AdminRoute({ children }) {
  const { booting, isAdmin, session, verifyAdminSession } = useAdmin();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function guardAdminRoute() {
      if (booting) return;
      if (!isAdmin || !session?.token) {
        if (!cancelled) {
          setAllowed(false);
          setChecking(false);
        }
        return;
      }

      const ok = await verifyAdminSession(session.token);
      if (!cancelled) {
        setAllowed(ok);
        setChecking(false);
      }
    }

    setChecking(true);
    guardAdminRoute();

    return () => {
      cancelled = true;
    };
  }, [booting, isAdmin, session?.token, verifyAdminSession]);

  if (booting || checking) {
    return (
      <main className="app-loader">
        <div className="loader-ring" />
        <p>Verifying admin access...</p>
      </main>
    );
  }

  if (!allowed) {
    return <Navigate replace state={{ from: location.pathname }} to="/admin/login" />;
  }

  return children;
}
