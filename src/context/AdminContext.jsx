import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminGetSession } from '../api/admin.js';

const STORAGE_KEY = 'chocorush_admin_session';
const AdminContext = createContext(null);

function isSessionValid(session) {
  if (!session?.token) return false;
  if (!session.expiresAt) return true;
  const expiresAt = new Date(session.expiresAt);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt > new Date();
}

function sameSession(a, b) {
  return a?.token === b?.token && a?.username === b?.username && a?.expiresAt === b?.expiresAt;
}

export function AdminProvider({ children }) {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);

  const clearAdminSession = useCallback(() => {
    setSession(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const persistAdminSession = useCallback((nextSession) => {
    setSession((current) => (sameSession(current, nextSession) ? current : nextSession));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  }, []);

  useEffect(() => {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      setBooting(false);
      return;
    }

    async function bootstrapAdminSession() {
      try {
        const parsed = JSON.parse(rawValue);
        if (!isSessionValid(parsed)) {
          clearAdminSession();
          return;
        }

        const verified = await adminGetSession(parsed.token);
        const safeSession = {
          token: parsed.token,
          username: verified.username || parsed.username || 'admin',
          expiresAt: verified.expiresAt || parsed.expiresAt || ''
        };
        persistAdminSession(safeSession);
      } catch {
        clearAdminSession();
      } finally {
        setBooting(false);
      }
    }

    bootstrapAdminSession();
  }, [clearAdminSession, persistAdminSession]);

  const verifyAdminSession = useCallback(
    async (token = session?.token) => {
      if (!token) {
        clearAdminSession();
        return false;
      }

      try {
        const verified = await adminGetSession(token);
        const safeSession = {
          token,
          username: verified.username || session?.username || 'admin',
          expiresAt: verified.expiresAt || session?.expiresAt || ''
        };
        persistAdminSession(safeSession);
        return true;
      } catch {
        clearAdminSession();
        return false;
      }
    },
    [clearAdminSession, persistAdminSession, session?.expiresAt, session?.token, session?.username]
  );

  const value = useMemo(
    () => ({
      booting,
      session,
      isAdmin: isSessionValid(session),
      verifyAdminSession,
      loginAdmin(nextSession) {
        const safeSession = {
          token: nextSession.token,
          username: nextSession.username || 'admin',
          expiresAt: nextSession.expiresAt || ''
        };
        persistAdminSession(safeSession);
      },
      logoutAdmin() {
        clearAdminSession();
      }
    }),
    [booting, clearAdminSession, persistAdminSession, session, verifyAdminSession]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used inside AdminProvider');
  return context;
}
